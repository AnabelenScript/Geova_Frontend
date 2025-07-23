import React, { useEffect, useState, useRef } from 'react';
import { graphViewModel } from '../../viewmodels/GraphViewModel';
import { cameraService } from '../../services/cameraService';
import './TomarFoto.css';

function TomarFoto() {
  const [data, setData] = useState({
    calidad: null,
    nitidez: null,
    luminosidad: null,
    inclinacion: null,
    distancia: null,
    fuerzaSenal: null,
    apertura: null
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const imgRef = useRef<HTMLImageElement>(null);
  const { data: websocketData, isConnected } = graphViewModel.useGraphData();

  // Verificar conexión al montar el componente
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus('checking');
        const isConnected = await cameraService.checkConnection();
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
        
        if (isConnected) {
          console.log(`✅ Conectado al servidor: ${cameraService.getBaseUrl()}`);
        } else {
          console.warn('⚠️ No se pudo conectar al servidor de la Raspberry Pi');
        }
      } catch (error) {
        console.error('❌ Error verificando conexión:', error);
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();
  }, []);

  useEffect(() => {
    if (websocketData) {
      const { sensor, data: sensorData } = websocketData;
      if (sensor === 'IMX477') {
        setData(prevData => ({
          ...prevData,
          luminosidad: sensorData.luminosidad_promedio,
          calidad: sensorData.calidad_frame * 100,
          nitidez: sensorData.nitidez_score
        }));
      }
      if (sensor === 'TF-Luna') {
        setData(prevData => ({
          ...prevData,
          distancia: sensorData.distancia_m * 100,
        }));
      }
      if (sensor === 'MPU6050') {
        setData(prevData => ({
          ...prevData,
          inclinacion: sensorData.roll + sensorData.pitch,
          apertura: sensorData.apertura,
          fuerzaSenal: sensorData.event ? "Fuerza alta" : "Fuerza baja"
        }));
      }
    }
  }, [websocketData]);

  const handleCameraToggle = async () => {
    try {
      setStreamError(null);
      
      // Verificar conexión antes de proceder
      if (connectionStatus !== 'connected') {
        setStreamError('No hay conexión con la Raspberry Pi. Verificando...');
        const isConnected = await cameraService.checkConnection();
        setConnectionStatus(isConnected ? 'connected' : 'disconnected');
        
        if (!isConnected) {
          setStreamError('No se puede conectar con raspberrypi.local. Verifique la conexión.');
          return;
        }
      }
      
      if (isStreaming) {
        // Detener streaming
        console.log('🛑 Deteniendo streaming...');
        await cameraService.stopStreaming();
        setIsStreaming(false);
        if (imgRef.current) {
          imgRef.current.src = '';
        }
      } else {
        // Iniciar streaming
        console.log('▶️ Iniciando streaming...');
        await cameraService.startStreaming();
        setIsStreaming(true);
        
        // Configurar la imagen para mostrar el stream con timestamp para evitar cache
        if (imgRef.current) {
          const streamUrl = `${cameraService.getStreamUrl()}?t=${Date.now()}`;
          imgRef.current.src = streamUrl;
          console.log(`📺 Stream URL: ${streamUrl}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setStreamError(errorMessage);
      console.error('❌ Error al manejar cámara:', error);
      
      // Si hay error, asegurar que el estado sea consistente
      setIsStreaming(false);
      if (imgRef.current) {
        imgRef.current.src = '';
      }
    }
  };

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      if (isStreaming) {
        cameraService.stopStreaming().catch(console.error);
      }
    };
  }, [isStreaming]);

  // Función para manejar errores de carga de imagen
  const handleImageError = () => {
    console.warn('⚠️ Error al cargar imagen del stream');
    setStreamError('Error al cargar el stream de video. Reintentando...');
    
    // Reintentar cargar la imagen después de un breve delay
    setTimeout(() => {
      if (imgRef.current && isStreaming) {
        const streamUrl = `${cameraService.getStreamUrl()}?t=${Date.now()}`;
        imgRef.current.src = streamUrl;
      }
    }, 2000);
  };

  // Función para limpiar errores cuando la imagen se carga correctamente
  const handleImageLoad = () => {
    if (streamError && streamError.includes('Error al cargar el stream')) {
      setStreamError(null);
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'checking':
        return '🔄 Verificando conexión...';
      case 'connected':
        return `✅ Conectado a ${cameraService.getBaseUrl()}`;
      case 'disconnected':
        return '❌ Sin conexión con Raspberry Pi';
      default:
        return '';
    }
  };

  return (
    <div className="ProjectPContainer">
      <div className='ProjectData'>
        <label htmlFor="Calidad"><i className='bx bx-camera'></i> <br />Calidad</label>
        <span id="Calidad">{data.calidad ? `${data.calidad.toFixed(2)} FPS` : "Cargando..."}</span>
        <label htmlFor="Nitidez"><i className='bx bx-camera'></i><br /> Nitidez</label>
        <span id="Nitidez">{data.nitidez ? `${data.nitidez.toFixed(2)} %` : "Cargando..."}</span>
        <label htmlFor="Luminosidad"><i className='bx bx-camera'></i> <br />Luminosidad</label>
        <span id="Luminosidad">{data.luminosidad ? `${data.luminosidad.toFixed(2)} lux` : "Cargando..."}</span>
      </div>
      
      <div className="ProjectphotoContainer">
        <div className="corner-top-right"></div>
        <div className="corner-bottom-left"></div>
        <div className='MainphotoContainer'>
          {!isStreaming ? (
            <div className="camera-placeholder">
              <h1>Presiona el botón para activar la cámara</h1>
              <div className="connection-status">
                <small>{getConnectionStatusText()}</small>
              </div>
            </div>
          ) : (
            <div className="camera-container">
              <img 
                ref={imgRef}
                alt="Camera Stream"
                className="camera-stream"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
              <div className="stream-overlay">
                <small>🔴 EN VIVO - {cameraService.getBaseUrl()}</small>
              </div>
            </div>
          )}
          
          {streamError && (
            <div className="stream-error">
              <p>⚠️ {streamError}</p>
              {connectionStatus === 'disconnected' && (
                <button 
                  onClick={() => window.location.reload()} 
                  className="retry-button"
                >
                  🔄 Reintentar conexión
                </button>
              )}
            </div>
          )}
          
          <div className='Takephotobutton'>
            <button 
              className={`TakeButton ${isStreaming ? 'active' : ''} ${connectionStatus !== 'connected' ? 'disabled' : ''}`}
              onClick={handleCameraToggle}
              disabled={connectionStatus !== 'connected'}
              title={
                connectionStatus !== 'connected' 
                  ? 'Esperando conexión con Raspberry Pi...' 
                  : isStreaming 
                    ? 'Detener cámara' 
                    : 'Activar cámara'
              }
            >
              {connectionStatus === 'checking' ? '🔄' : isStreaming ? '⏹️' : '📷'}
            </button>
          </div>
        </div>
      </div>
      
      <div className='ProjectData'>
        <label htmlFor="Distancia"><i className='bx bx-ruler'></i> <br />Distancia</label>
        <span id="Distancia">{data.distancia ? `${data.distancia.toFixed(2)} cm` : "Cargando..."}</span>
        <label htmlFor="FuerzaSenal"><i className='bx bx-ruler'></i> <br />Fuerza señal</label>
        <span id="FuerzaSenal">{data.fuerzaSenal || "Cargando..."}</span>
        <label htmlFor="Apertura"><i className='bx bx-shape-triangle'></i>  <br />Apertura</label>
        <span id="Apertura">{data.apertura ? `${data.apertura.toFixed(2)} °` : "Cargando..."}</span>
        <label htmlFor="Inclinación"><i className='bx bx-shape-triangle'></i> <br /> Inclinación</label>
        <span id="Inclinación">{data.inclinacion ? `${data.inclinacion.toFixed(2)} °` : "Cargando..."}</span>
      </div>
    </div>
  );
}

export default TomarFoto;