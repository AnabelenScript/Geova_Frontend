// src/views/MedirIrregularidades/MedirIrregularidades.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import './MedirIrre.css';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { hcService } from '../../services/HcService';

function MedirIrregularidades() {
  const { id } = useParams();
  const currentProjectId = id ? parseInt(id, 10) : 1;
  
  const [measurements, setMeasurements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [collectionStats, setCollectionStats] = useState({
    total: 0,
    lastDistance: null,
    startTime: null
  });
  const [viewMode, setViewMode] = useState('2D');
  
  const lastDataTimeRef = useRef(null);
  const noDataTimeoutRef = useRef(null);
  const collectionTimeoutRef = useRef(null);
  const postQueueRef = useRef([]);
  const isProcessingPostRef = useRef(false);

  // Hook para inicializar y verificar datos existentes
  useEffect(() => {
    initializeComponent();
    return () => {
      cleanup();
    };
  }, [currentProjectId]);

  const initializeComponent = async () => {
    setIsLoading(true);
    
    try {
      // Verificar si existen datos previos para el proyecto actual
      const existingData = await hcService.getMeasurements(currentProjectId);
      
      if (existingData && existingData.measurements && existingData.measurements.length > 0) {
        setHasExistingData(true);
        setMeasurements(transformMeasurementsForChart(existingData.measurements));
        console.log(`📊 Datos existentes encontrados para proyecto ${currentProjectId}: ${existingData.total_measurements} mediciones`);
      } else {
        setHasExistingData(false);
        setMeasurements([]);
        console.log(`🆕 No hay datos previos para proyecto ${currentProjectId}, listo para nueva recolección`);
      }
    } catch (error) {
      console.error('Error inicializando componente:', error);
      setHasExistingData(false);
    } finally {
      setIsLoading(false);
    }
  };

  const transformMeasurementsForChart = (rawMeasurements) => {
    return rawMeasurements.map((measurement, index) => ({
      punto: index + 1,
      distancia: parseFloat(measurement.distancia_cm),
      altura: parseFloat(measurement.distancia_cm),
      timestamp: measurement.timestamp,
      x: Math.floor(index / 10),
      y: index % 10,
      z: parseFloat(measurement.distancia_cm)
    }));
  };

  const processPostQueue = async () => {
    if (isProcessingPostRef.current || postQueueRef.current.length === 0) {
      return;
    }

    isProcessingPostRef.current = true;

    while (postQueueRef.current.length > 0) {
      const measurementData = postQueueRef.current.shift();
      
      try {
        await hcService.createMeasurement(measurementData);
        console.log(`📏 Medición guardada: ${measurementData.distancia_cm} cm (Proyecto: ${measurementData.id_project})`);
        
        // Pequeña pausa para evitar saturar el servidor
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error('Error guardando medición:', error);
        // Reintentamos una vez más
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          await hcService.createMeasurement(measurementData);
          console.log(`📏 Medición guardada (reintento): ${measurementData.distancia_cm} cm`);
        } catch (retryError) {
          console.error('Error en reintento de guardado:', retryError);
        }
      }
    }

    isProcessingPostRef.current = false;
  };

  const startDataCollection = async () => {
    try {
      setIsCollecting(true);
      setMeasurements([]);
      setCollectionStats({
        total: 0,
        lastDistance: null,
        startTime: new Date()
      });

      // Limpiar cola de POST
      postQueueRef.current = [];
      isProcessingPostRef.current = false;

      // Conectar al WebSocket
      hcService.connectToWebSocket();
      
      // Suscribirse a los datos
      hcService.subscribe(handleWebSocketMessage);

      // Configurar timeout para detectar fin de recolección
      resetNoDataTimeout();

      console.log(`🎯 Iniciando recolección de datos HC-SR04 para proyecto ${currentProjectId}...`);
      
    } catch (error) {
      console.error('Error iniciando recolección:', error);
      setIsCollecting(false);
    }
  };

  const handleWebSocketMessage = async (message) => {
    if (message.type === 'connection') {
      setConnectionStatus(message.status);
      return;
    }

    if (message.type === 'data' && message.payload && isCollecting) {
      const distance = parseFloat(message.payload.distancia_cm || message.payload.altura);
      
      if (distance && distance > 0) {
        lastDataTimeRef.current = Date.now();
        
        // IMPORTANTE: Sobrescribir el id_project del WebSocket con el de la URL
        // El WebSocket siempre envía id_project=1, pero nosotros usamos el correcto
        const measurementData = {
          ...message.payload, // Mantener todos los datos originales
          id_project: currentProjectId, // SOBRESCRIBIR con el ID correcto desde la URL
          distancia_cm: distance,
          event: true
        };

        // Agregar a la cola de POST para procesamiento asíncrono
        postQueueRef.current.push(measurementData);
        
        // Procesar cola si no se está procesando ya
        if (!isProcessingPostRef.current) {
          processPostQueue();
        }
        
        // Actualizar estado local inmediatamente para la UI
        setMeasurements(prev => {
          const newMeasurement = {
            punto: prev.length + 1,
            distancia: distance,
            altura: distance,
            timestamp: new Date().toISOString(),
            x: Math.floor(prev.length / 10),
            y: prev.length % 10,
            z: distance
          };
          return [...prev, newMeasurement];
        });

        setCollectionStats(prev => ({
          ...prev,
          total: prev.total + 1,
          lastDistance: distance
        }));

        // Resetear timeout de sin datos
        resetNoDataTimeout();
      }
    }
  };

  const resetNoDataTimeout = () => {
    if (noDataTimeoutRef.current) {
      clearTimeout(noDataTimeoutRef.current);
    }
    
    noDataTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Sin datos por 10 segundos, finalizando recolección...');
      stopDataCollection();
    }, 10000);
  };

  const stopDataCollection = async () => {
    try {
      setIsCollecting(false);
      
      // Limpiar timeouts
      if (noDataTimeoutRef.current) {
        clearTimeout(noDataTimeoutRef.current);
      }
      
      // Procesar cualquier POST pendiente en la cola
      if (postQueueRef.current.length > 0) {
        console.log(`📤 Procesando ${postQueueRef.current.length} mediciones pendientes...`);
        await processPostQueue();
      }
      
      // Desconectar WebSocket
      hcService.unsubscribe(handleWebSocketMessage);
      hcService.disconnectWebSocket();
      
      // Recargar datos desde la base de datos para asegurar consistencia
      await initializeComponent();
      
      console.log(`✅ Recolección finalizada para proyecto ${currentProjectId}. Total de mediciones: ${collectionStats.total}`);
      
    } catch (error) {
      console.error('Error finalizando recolección:', error);
    }
  };

  const deleteAllMeasurements = async () => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar todas las mediciones del proyecto ${currentProjectId}?`)) {
      return;
    }

    try {
      setIsLoading(true);
      await hcService.deleteMeasurements(currentProjectId);
      setMeasurements([]);
      setHasExistingData(false);
      console.log(`🗑️ Todas las mediciones del proyecto ${currentProjectId} han sido eliminadas`);
    } catch (error) {
      console.error('Error eliminando mediciones:', error);
      alert('Error eliminando las mediciones');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanup = () => {
    if (noDataTimeoutRef.current) {
      clearTimeout(noDataTimeoutRef.current);
    }
    if (collectionTimeoutRef.current) {
      clearTimeout(collectionTimeoutRef.current);
    }
    hcService.unsubscribe(handleWebSocketMessage);
    hcService.disconnectWebSocket();
    
    // Limpiar cola de POST
    postQueueRef.current = [];
    isProcessingPostRef.current = false;
  };

  const render2DChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={measurements}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="punto" 
          label={{ value: 'Punto de medición', position: 'insideBottom', offset: -5 }} 
        />
        <YAxis 
          label={{ value: 'Distancia (cm)', angle: -90, position: 'insideLeft' }} 
        />
        <Tooltip 
          formatter={(value) => [`${value} cm`, 'Distancia']}
          labelFormatter={(label) => `Punto: ${label}`}
        />
        <Line 
          type="monotone" 
          dataKey="distancia" 
          stroke="#E6AF2E" 
          strokeWidth={3} 
          dot={{ r: 4, fill: '#E6AF2E' }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const render3DChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart data={measurements}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="x" 
          type="number" 
          label={{ value: 'Posición X', position: 'insideBottom', offset: -5 }} 
        />
        <YAxis 
          dataKey="y" 
          type="number" 
          label={{ value: 'Posición Y', angle: -90, position: 'insideLeft' }} 
        />
        <ZAxis 
          dataKey="z" 
          range={[50, 400]} 
        />
        <Tooltip 
          formatter={(value, name) => {
            if (name === 'z') return [`${value} cm`, 'Distancia'];
            return [value, name.toUpperCase()];
          }}
          labelFormatter={() => 'Coordenadas del terreno'}
        />
        <Scatter 
          fill="#E6AF2E" 
          fillOpacity={0.8}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );

  if (isLoading) {
    return (
      <div className='MedicionIrregularidades'>
        <div className="IrreGraphContainer">
          <div className="corner-top-right"></div>
          <div className="corner-bottom-left"></div>
          <div className='MainGraphContainer'>
            <h2>Cargando datos del proyecto {currentProjectId}...</h2>
            <div className="loading-spinner">🔄</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='MedicionIrregularidades'>
      <div className="IrreGraphContainer">
        <div className="corner-top-right"></div>
        <div className="corner-bottom-left"></div>
        <div className='MainGraphContainer'>
          <div className="header-controls">
            <h2>Irregularidades del terreno - Proyecto {currentProjectId}</h2>
            <div className="view-controls">
              <button 
                className={`view-btn ${viewMode === '2D' ? 'active' : ''}`}
                onClick={() => setViewMode('2D')}
              >
                Vista 2D
              </button>
              <button 
                className={`view-btn ${viewMode === '3D' ? 'active' : ''}`}
                onClick={() => setViewMode('3D')}
              >
                Vista 3D
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-label">Total de puntos:</span>
              <span className="stat-value">{measurements.length}</span>
            </div>
            {measurements.length > 0 && (
              <>
                <div className="stat-item">
                  <span className="stat-label">Distancia promedio:</span>
                  <span className="stat-value">
                    {(measurements.reduce((sum, m) => sum + m.distancia, 0) / measurements.length).toFixed(1)} cm
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Rango:</span>
                  <span className="stat-value">
                    {Math.min(...measurements.map(m => m.distancia)).toFixed(1)} - {Math.max(...measurements.map(m => m.distancia)).toFixed(1)} cm
                  </span>
                </div>
              </>
            )}
            {isCollecting && postQueueRef.current.length > 0 && (
              <div className="stat-item">
                <span className="stat-label">Pendientes de guardar:</span>
                <span className="stat-value">{postQueueRef.current.length}</span>
              </div>
            )}
          </div>

          {/* Gráfico */}
          <div className="chart-container">
            {measurements.length > 0 ? (
              viewMode === '2D' ? render2DChart() : render3DChart()
            ) : (
              <div className="no-data-message">
                <p>No hay datos para mostrar del proyecto {currentProjectId}</p>
                <p>Inicia la recolección de datos para ver el plano de irregularidades</p>
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="action-controls">
            {hasExistingData && !isCollecting ? (
              <button 
                className="delete-btn"
                onClick={deleteAllMeasurements}
                disabled={isLoading}
              >
                🗑️ Eliminar mediciones
              </button>
            ) : (
              <div className="collection-controls">
                {!isCollecting ? (
                  <button 
                    className="start-btn"
                    onClick={startDataCollection}
                    disabled={isLoading}
                  >
                    📏 Iniciar medición
                  </button>
                ) : (
                  <div className="collecting-status">
                    <button 
                      className="stop-btn"
                      onClick={stopDataCollection}
                    >
                      ⏹️ Detener medición
                    </button>
                    <div className="collection-info">
                      <p>📡 Recolectando datos... ({collectionStats.total} puntos)</p>
                      {collectionStats.lastDistance && (
                        <p>Última distancia: {collectionStats.lastDistance} cm</p>
                      )}
                      <p className="connection-status">
                        Estado: {connectionStatus === 'connected' ? '🟢 Conectado' : '🔴 Desconectado'}
                      </p>
                      {postQueueRef.current.length > 0 && (
                        <p className="queue-status">
                          Cola de guardado: {postQueueRef.current.length} pendientes
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MedirIrregularidades;