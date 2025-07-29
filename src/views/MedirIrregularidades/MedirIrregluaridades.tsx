// src/views/MedirIrregularidades/MedirIrregularidades.tsx
import { useState, useEffect, useRef } from 'react';
import './MedirIrre.css';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, AreaChart, Area
} from 'recharts';
import { hcsr04Service } from '../../services/hcsr04Service';
import type { HCSensorData, MeasurementResponse, ConnectionStatus } from '../../services/hcsr04Service';
import { useParams } from 'react-router-dom';

interface TerrainPoint {
  punto: number;
  distancia: number;
  x: number;
  y: number;
  z: number;
  irregularidad: 'normal' | 'hoyo' | 'elevacion';
  timestamp?: string;
}

interface TerrainModel {
  distances: number[];
  baseLevel: number;
  irregularities: TerrainPoint[];
  totalPoints: number;
}

function MedirIrregularidades() {
  const [measurements, setMeasurements] = useState<HCSensorData[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentReading, setCurrentReading] = useState<number | null>(null);
  const [terrainModel, setTerrainModel] = useState<TerrainModel | null>(null);
  const [status, setStatus] = useState('Inicializando...');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isApiOnline: false,
    isEsp32Connected: false
  });
  
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const noDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const connectionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSuccessfulReadingRef = useRef<number>(0);
  const isComponentMountedRef = useRef(true);
  
  const { id } = useParams<{ id: string }>();
  const projectId = id ? parseInt(id, 10) : 1;

  // Limpiar al desmontar componente
  useEffect(() => {
    return () => {
      isComponentMountedRef.current = false;
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      if (noDataTimeoutRef.current) clearTimeout(noDataTimeoutRef.current);
      if (connectionCheckIntervalRef.current) clearInterval(connectionCheckIntervalRef.current);
      if (wsRef.current && (wsRef.current as any).closeIntentionally) {
        (wsRef.current as any).closeIntentionally();
      }
    };
  }, []);

  // Cargar datos existentes solo una vez al montar
  useEffect(() => {
    loadExistingData();
  }, [projectId]);

  // Configurar WebSocket una sola vez
  useEffect(() => {
    setupWebSocket();
    return () => {
      if (wsRef.current && (wsRef.current as any).closeIntentionally) {
        (wsRef.current as any).closeIntentionally();
      }
    };
  }, []);

  // Verificar conexión cada 10 segundos (no cada 2)
  useEffect(() => {
    checkInitialConnection();
    
    connectionCheckIntervalRef.current = setInterval(() => {
      if (!isCapturing && isComponentMountedRef.current) {
        checkConnectionStatus();
      }
    }, 10000); // Cada 10 segundos

    return () => {
      if (connectionCheckIntervalRef.current) {
        clearInterval(connectionCheckIntervalRef.current);
      }
    };
  }, [projectId]);

  const setupWebSocket = () => {
    const ws = hcsr04Service.createWebSocket(
      (data) => {
        if (!isComponentMountedRef.current) return;
        
        setCurrentReading(data.distancia_cm);
        lastSuccessfulReadingRef.current = Date.now();
        setWarning(null); // Limpiar advertencias cuando hay datos
        
        setConnectionStatus(prev => ({
          ...prev,
          isEsp32Connected: true
        }));
      },
      (connected) => {
        if (!isComponentMountedRef.current) return;
        
        setConnectionStatus(prev => ({
          ...prev,
          isApiOnline: connected
        }));
        
        if (!connected && !isCapturing) {
          setWarning('WebSocket desconectado - usando HTTP como respaldo');
        }
      },
      2 // Solo 2 reintentos
    );
    
    wsRef.current = ws;
  };

  const checkInitialConnection = async () => {
    try {
      setStatus('Verificando conexión inicial...');
      const status = await hcsr04Service.checkConnection(projectId);
      
      if (!isComponentMountedRef.current) return;
      
      setConnectionStatus(status);
      
      if (!status.isApiOnline) {
        setError('API no disponible - verifica que el servidor esté ejecutándose');
        setStatus('Sin conexión al servidor');
      } else if (!status.isEsp32Connected) {
        setWarning('ESP32 no está enviando datos - verifica que esté encendido');
        setStatus('Esperando datos del ESP32...');
      } else {
        setStatus('Conexión establecida correctamente');
        setError(null);
        setWarning(null);
      }
    } catch (error: any) {
      if (!isComponentMountedRef.current) return;
      
      console.warn('Error en verificación inicial:', error);
      setConnectionStatus({
        isApiOnline: false,
        isEsp32Connected: false,
        lastError: error.message
      });
      setError('No se pudo conectar con el servidor');
      setStatus('Error de conexión');
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const status = await hcsr04Service.checkConnection(projectId);
      
      if (!isComponentMountedRef.current) return;
      
      setConnectionStatus(status);
      
      // Solo actualizar warnings/errors si cambió el estado
      const timeSinceLastData = Date.now() - lastSuccessfulReadingRef.current;
      
      if (!status.isApiOnline) {
        if (!error) {
          setError('Conexión con servidor perdida');
        }
      } else {
        setError(null);
        
        if (!status.isEsp32Connected && timeSinceLastData > 15000) {
          if (warning !== 'ESP32 no responde hace más de 15 segundos') {
            setWarning('ESP32 no responde hace más de 15 segundos');
          }
        } else if (status.isEsp32Connected) {
          setWarning(null);
        }
      }
    } catch (error: any) {
      // Solo loggear, no mostrar errores por verificaciones fallidas
      console.warn('Verificación de conexión falló:', error.message);
    }
  };

  const loadExistingData = async () => {
    if (!isComponentMountedRef.current) return;
    
    try {
      setStatus('Cargando datos existentes...');
      const existingData = await hcsr04Service.getMeasurementsByProject(projectId);
      
      if (!isComponentMountedRef.current) return;
      
      if (existingData.measurements && existingData.measurements.length > 0) {
        setMeasurements(existingData.measurements);
        setHasExistingData(true);
        generateTerrainFromExistingData(existingData.measurements);
        setStatus(`Datos cargados: ${existingData.total_measurements} mediciones`);
      } else {
        setHasExistingData(false);
        setStatus('Sin datos previos - listo para medir');
      }
    } catch (error: any) {
      if (!isComponentMountedRef.current) return;
      
      setHasExistingData(false);
      if (error.message.includes('No se encontraron mediciones')) {
        setStatus('Sin datos previos - listo para medir');
      } else {
        console.warn('Error cargando datos existentes:', error);
        setWarning('No se pudieron cargar datos previos');
        setStatus('Listo para medir (sin datos previos)');
      }
    }
  };

  const generateTerrainFromExistingData = (existingMeasurements: HCSensorData[]) => {
    if (existingMeasurements.length === 0) return;

    const distances = existingMeasurements.map(m => m.distancia_cm);
    const model = generateTerrainModel(distances);
    setTerrainModel(model);
  };

  const generateTerrainModel = (distances: number[]): TerrainModel => {
    if (distances.length === 0) return {
      distances: [],
      baseLevel: 0,
      irregularities: [],
      totalPoints: 0
    };

    const baseLevel = distances[0];
    const irregularities: TerrainPoint[] = distances.map((distance, index) => {
      const difference = distance - baseLevel;
      let irregularidad: 'normal' | 'hoyo' | 'elevacion' = 'normal';
      
      if (difference < -2) {
        irregularidad = 'elevacion';
      } else if (difference > 2) {
        irregularidad = 'hoyo';
      }

      return {
        punto: index + 1,
        distancia: distance,
        x: index * 10,
        y: 0,
        z: -difference,
        irregularidad,
        timestamp: new Date().toISOString()
      };
    });

    return {
      distances,
      baseLevel,
      irregularities,
      totalPoints: distances.length
    };
  };

  const startCapture = async () => {
    // Verificar conexión antes de empezar
    if (!connectionStatus.isApiOnline) {
      setError('No hay conexión con el servidor - no se puede iniciar captura');
      return;
    }

    try {
      setStatus('Verificando ESP32...');
      const testReading = await hcsr04Service.getCurrentReading(projectId, false);
      
      if (!testReading || testReading.distancia_cm === undefined) {
        setError('ESP32 no está enviando datos válidos. Verifica la conexión.');
        setStatus('Error: ESP32 no responde');
        return;
      }
    } catch (error: any) {
      setError('No se puede conectar con ESP32: ' + (error.message || 'Sin respuesta'));
      setStatus('Error de conexión ESP32');
      return;
    }

    // Iniciar captura
    setIsCapturing(true);
    setMeasurements([]);
    setTerrainModel(null);
    setError(null);
    setWarning(null);
    setStatus('Capturando mediciones...');
    
    let captureCount = 0;
    const maxInactivityTime = 8000; // 8 segundos sin datos para finalizar
    let lastCaptureTime = Date.now();
    let consecutiveErrors = 0;

    // Limpiar intervalos previos
    if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    if (noDataTimeoutRef.current) clearTimeout(noDataTimeoutRef.current);

    const captureReading = async () => {
      if (!isComponentMountedRef.current || !isCapturing) return;
      
      try {
        const reading = await hcsr04Service.getCurrentReading(projectId, true);
        
        if (reading && reading.distancia_cm && reading.distancia_cm > 0) {
          captureCount++;
          lastCaptureTime = Date.now();
          consecutiveErrors = 0;
          
          setMeasurements(prev => {
            const newMeasurement = {
              ...reading,
              id_project: projectId,
              event: true
            };
            const updated = [...prev, newMeasurement];
            
            // Actualizar modelo en tiempo real
            const distances = updated.map(m => m.distancia_cm);
            const model = generateTerrainModel(distances);
            setTerrainModel(model);
            
            return updated;
          });

          setStatus(`Mediciones: ${captureCount} - Última: ${reading.distancia_cm.toFixed(1)} cm`);
          
          // Reiniciar timeout de inactividad
          if (noDataTimeoutRef.current) clearTimeout(noDataTimeoutRef.current);
          noDataTimeoutRef.current = setTimeout(() => {
            if (isComponentMountedRef.current) {
              stopCapture();
            }
          }, maxInactivityTime);
        } else {
          consecutiveErrors++;
          const timeSinceLastCapture = Date.now() - lastCaptureTime;
          
          if (consecutiveErrors >= 3 && captureCount === 0) {
            setWarning('ESP32 no envía datos válidos - se intentará automáticamente');
          }
          
          if (timeSinceLastCapture > maxInactivityTime && captureCount > 0) {
            stopCapture();
          }
        }
      } catch (error: any) {
        consecutiveErrors++;
        const timeSinceLastCapture = Date.now() - lastCaptureTime;
        
        if (consecutiveErrors >= 8 || (timeSinceLastCapture > maxInactivityTime && captureCount === 0)) {
          setError('Error persistente: ESP32 no responde o API caída');
          stopCapture();
        }
      }
    };

    // Iniciar captura y continuar cada 500ms
    await captureReading();
    captureIntervalRef.current = setInterval(captureReading, 500);

    // Timeout de seguridad (máximo 90 segundos)
    setTimeout(() => {
      if (isComponentMountedRef.current && isCapturing) {
        stopCapture();
      }
    }, 90000);
  };

  const stopCapture = async () => {
    setIsCapturing(false);
    
    // Limpiar intervalos
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (noDataTimeoutRef.current) {
      clearTimeout(noDataTimeoutRef.current);
      noDataTimeoutRef.current = null;
    }

    // Procesar resultados finales
    setMeasurements(prev => {
      if (prev.length > 0) {
        const distances = prev.map(m => m.distancia_cm);
        const model = generateTerrainModel(distances);
        setTerrainModel(model);
        setStatus(`✅ Captura completada: ${prev.length} mediciones`);
        setHasExistingData(true);
        setError(null);
        setWarning(null);
        
        // Recargar datos después de la captura para sincronizar con BD
        setTimeout(() => {
          if (isComponentMountedRef.current) {
            loadExistingData();
          }
        }, 1000);
      } else {
        setStatus('❌ No se capturaron mediciones válidas');
        setError('Verifica que el ESP32 esté funcionando y enviando datos');
      }
      return prev;
    });
  };

  const deleteAllMeasurements = async () => {
    try {
      setStatus('Eliminando mediciones...');
      await hcsr04Service.deleteMeasurements(projectId);
      
      if (!isComponentMountedRef.current) return;
      
      setMeasurements([]);
      setTerrainModel(null);
      setHasExistingData(false);
      setStatus('✅ Mediciones eliminadas correctamente');
      setError(null);
      setWarning(null);
    } catch (error: any) {
      if (!isComponentMountedRef.current) return;
      
      setError('Error al eliminar mediciones: ' + error.message);
      setStatus('❌ Error al eliminar');
    }
  };

  const clearCurrentSession = () => {
    setMeasurements([]);
    setTerrainModel(null);
    setStatus('🔄 Sesión limpiada - listo para nueva captura');
    setError(null);
    setWarning(null);
    
    if (isCapturing) {
      stopCapture();
    }
  };

  // Datos para gráficos
  const graphData = terrainModel ? terrainModel.irregularities.map(point => ({
    punto: point.punto,
    distancia: point.distancia,
    baseLevel: terrainModel.baseLevel,
    irregularidad: point.z,
    tipo: point.irregularidad
  })) : [];

  const getColorByIrregularity = (tipo: string) => {
    switch (tipo) {
      case 'hoyo': return '#ff4444';
      case 'elevacion': return '#44ff44';
      default: return '#E6AF2E';
    }
  };

  return (
    <div className='MedicionIrregularidades'>
      <div className="IrreGraphContainer">
        <div className="corner-top-right"></div>
        <div className="corner-bottom-left"></div>
        <div className='MainGraphContainer'>
          <h2>Irregularidades del Terreno - Proyecto {projectId}</h2>
          
          {/* Estado de conexión */}
          <div style={{ 
            padding: '10px 15px',
            marginBottom: '15px',
            borderRadius: '6px',
            backgroundColor: !connectionStatus.isApiOnline ? '#ffebee' : 
                           !connectionStatus.isEsp32Connected ? '#fff3e0' : '#e8f5e8',
            border: `1px solid ${!connectionStatus.isApiOnline ? '#f44336' : 
                                 !connectionStatus.isEsp32Connected ? '#ff9800' : '#4caf50'}`,
            fontSize: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>
                <strong>Servidor:</strong> {connectionStatus.isApiOnline ? '🟢 Online' : '🔴 Offline'}
              </span>
              <span>
                <strong>ESP32:</strong> {connectionStatus.isEsp32Connected ? '🟢 Conectado' : '🟡 Sin datos'}
              </span>
              {currentReading && connectionStatus.isEsp32Connected && (
                <span><strong>Actual:</strong> {currentReading.toFixed(1)} cm</span>
              )}
            </div>
          </div>

          {/* Mensajes de estado */}
          {error && (
            <div style={{ 
              color: '#d32f2f', 
              backgroundColor: '#ffebee', 
              padding: '10px 15px', 
              borderRadius: '6px',
              fontSize: '14px',
              border: '1px solid #f44336',
              marginBottom: '15px'
            }}>
              <strong>❌ Error:</strong> {error}
            </div>
          )}
          
          {warning && !error && (
            <div style={{ 
              color: '#f57c00', 
              backgroundColor: '#fff3e0', 
              padding: '10px 15px', 
              borderRadius: '6px',
              fontSize: '14px',
              border: '1px solid #ff9800',
              marginBottom: '15px'
            }}>
              <strong>⚠️ Advertencia:</strong> {warning}
            </div>
          )}

          {/* Panel de control */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={startCapture}
              disabled={isCapturing || !connectionStatus.isApiOnline}
              style={{
                padding: '12px 24px',
                backgroundColor: isCapturing || !connectionStatus.isApiOnline ? '#ccc' : '#E6AF2E',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isCapturing || !connectionStatus.isApiOnline ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              {isCapturing ? '🔄 Capturando...' : '▶️ Iniciar Medición'}
            </button>
            
            <button
              onClick={stopCapture}
              disabled={!isCapturing}
              style={{
                padding: '12px 24px',
                backgroundColor: !isCapturing ? '#ccc' : '#ff6b6b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: !isCapturing ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              ⏹️ Detener
            </button>

            <button
              onClick={clearCurrentSession}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6b73ff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔄 Limpiar Sesión
            </button>

            {hasExistingData && (
              <button
                onClick={deleteAllMeasurements}
                disabled={isCapturing}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isCapturing ? '#ccc' : '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isCapturing ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                🗑️ Eliminar Todo
              </button>
            )}
          </div>

          {/* Estado actual */}
          <div style={{ 
            marginBottom: '20px',
            padding: '10px 15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ fontSize: '14px' }}>
              <strong>Estado:</strong> {status}
            </div>
          </div>

          {/* Información del modelo */}
          {terrainModel && (
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '15px', 
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              border: '1px solid #ddd'
            }}>
              <div><strong>Total de mediciones:</strong> {terrainModel.totalPoints}</div>
              <div><strong>Nivel base del suelo:</strong> {terrainModel.baseLevel.toFixed(1)} cm</div>
              <div><strong>Irregularidades detectadas:</strong></div>
              <div style={{ marginLeft: '10px', marginTop: '8px', display: 'flex', gap: '15px' }}>
                <span>🟢 Normal: {terrainModel.irregularities.filter(i => i.irregularidad === 'normal').length}</span>
                <span>🔴 Hoyos: {terrainModel.irregularities.filter(i => i.irregularidad === 'hoyo').length}</span>
                <span>🟡 Elevaciones: {terrainModel.irregularities.filter(i => i.irregularidad === 'elevacion').length}</span>
              </div>
            </div>
          )}

          {/* Gráfico principal - Perfil del terreno */}
          {graphData.length > 0 && (
            <div style={{ width: '100%', marginBottom: '30px' }}>
              <h3 style={{ textAlign: 'center', margin: '0 0 15px 0', color: '#333' }}>
                📊 Perfil de Irregularidades del Terreno
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="punto" 
                    label={{ value: 'Punto de medición', position: 'insideBottom', offset: -5 }} 
                  />
                  <YAxis 
                    label={{ value: 'Distancia (cm)', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'distancia') return [`${value} cm`, 'Distancia medida'];
                      if (name === 'baseLevel') return [`${value} cm`, 'Nivel base'];
                      if (name === 'irregularidad') return [`${value > 0 ? '+' : ''}${value.toFixed(1)} cm`, 'Irregularidad'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Punto ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="distancia" 
                    stroke="#E6AF2E" 
                    fill="#E6AF2E" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="baseLevel" 
                    stroke="#888" 
                    strokeDasharray="5 5"
                    strokeWidth={1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Vista de irregularidades con colores */}
          {graphData.length > 0 && (
            <div style={{ width: '100%' }}>
              <h3 style={{ textAlign: 'center', margin: '0 0 15px 0', color: '#333' }}>
                🗺️ Mapa de Irregularidades
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="punto" 
                    type="number"
                    label={{ value: 'Punto', position: 'insideBottom', offset: -5 }} 
                  />
                  <YAxis 
                    dataKey="irregularidad" 
                    type="number"
                    label={{ value: 'Irregularidad (cm)', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${value > 0 ? '+' : ''}${value.toFixed(1)} cm`, 
                      'Irregularidad'
                    ]}
                    labelFormatter={(label) => `Punto ${label}`}
                  />
                  <Scatter dataKey="irregularidad" fill="#E6AF2E">
                    {graphData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getColorByIrregularity(entry.tipo)} 
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              
              {/* Leyenda */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '20px', 
                marginTop: '10px',
                fontSize: '13px',
                fontWeight: '500'
              }}>
                <span>🟢 Normal (-2 a +2 cm)</span>
                <span>🔴 Hoyo (+2 cm)</span>
                <span>🟡 Elevación (-2 cm)</span>
              </div>
            </div>
          )}

          {/* Mensaje cuando no hay datos */}
          {!terrainModel && !isCapturing && (
            <div style={{ 
              textAlign: 'center', 
              padding: '50px 20px', 
              color: '#666',
              backgroundColor: '#f9f9f9',
              borderRadius: '10px',
              border: '2px dashed #ddd',
              margin: '20px 0'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📏</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Sin datos de irregularidades</h3>
              <p style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
                Presiona <strong>"▶️ Iniciar Medición"</strong> para comenzar a capturar datos del terreno
              </p>
              <p style={{ fontSize: '14px', color: '#999', margin: '0' }}>
                {!connectionStatus.isApiOnline ? 
                  '🔴 Servidor desconectado - verifica que la API esté ejecutándose' :
                  !connectionStatus.isEsp32Connected ?
                  '🟡 ESP32 sin datos - verifica que esté encendido y transmitiendo' :
                  '🟢 Sistema listo para medir'
                }
              </p>
            </div>
          )}

          {/* Información de ayuda cuando está capturando */}
          {isCapturing && (
            <div style={{
              backgroundColor: '#e3f2fd',
              border: '1px solid #2196f3',
              borderRadius: '8px',
              padding: '15px',
              marginTop: '20px',
              fontSize: '14px'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>📡 Captura en progreso...</strong>
              </div>
              <div style={{ color: '#666' }}>
                • Mantén el sensor apuntando hacia el terreno<br/>
                • La captura se detendrá automáticamente sin nuevos datos<br/>
                • Presiona "⏹️ Detener" para finalizar manualmente
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MedirIrregularidades;