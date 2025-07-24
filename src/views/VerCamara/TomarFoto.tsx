//src/views/VerCamara/TomarFoto.tsx - VERSIÓN LIMPIA SOLO IMG
import React, { useState, useRef, useEffect } from 'react';
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
  
  const imgRef = useRef<HTMLImageElement>(null);
  const { data: websocketData } = graphViewModel.useGraphData();

  // Actualizar datos desde WebSocket
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

  const startStream = async () => {
    try {
      setStreamError(null);
      
      // Iniciar streaming en backend
      await cameraService.startStreaming();
      
      const img = imgRef.current;
      if (img) {
        // Configurar eventos antes de cambiar src
        img.onload = () => {
          setIsStreaming(true);
        };
        img.onerror = (error) => {
          // Solo mostrar error si realmente estamos intentando hacer streaming
          if (img.src && img.src !== '' && !img.src.includes('about:blank')) {
            setStreamError('Error cargando stream de video');
            console.error('Error en IMG:', error);
          }
        };
        
        // Iniciar el stream
        img.src = cameraService.getStreamUrl();
      }
    } catch (error) {
      setStreamError('Error iniciando streaming: ' + (error as Error).message);
    }
  };

  const stopStream = async () => {
    try {
      setIsStreaming(false);
      setStreamError(null); // Limpiar cualquier error previo
      
      // Limpiar IMG de forma segura
      const img = imgRef.current;
      if (img) {
        // Primero remover los event listeners para evitar errores
        img.onload = null;
        img.onerror = null;
        // Luego limpiar la fuente
        img.src = '';
      }
      
      // Detener el streaming en el backend
      await cameraService.stopStreaming();
    } catch (error) {
      console.error('Error deteniendo stream:', error);
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
          
          {/* Indicador de streaming - posición estratégica */}
          {isStreaming && (
            <div className="stream-status-indicator">
              📡 Streaming Activo
            </div>
          )}
          
          {/* Error del stream */}
          {streamError && (
            <div className="stream-error-overlay">
              ⚠️ {streamError}
              <button 
                onClick={startStream}
                className="retry-stream-btn"
              >
                Reintentar
              </button>
            </div>
          )}
          
          {/* Stream de video - ocupa todo el espacio disponible */}
          <img 
            ref={imgRef}
            className="camera-stream-full"
            style={{ 
              display: isStreaming ? 'block' : 'none'
            }}
            alt="Camera Stream"
          />
          
          {/* Mensaje cuando no hay streaming */}
          {!isStreaming && !streamError && (
            <div className="camera-inactive-message">
              <h2>📷 Cámara Inactiva</h2>
              <p>Presiona el botón para activar el streaming</p>
            </div>
          )}
          
          {/* Botón de la cámara */}
          <div className="Takephotobutton">
            <button 
              className={`TakeButton ${isStreaming ? 'active' : ''}`}
              onClick={isStreaming ? stopStream : startStream}
              title={isStreaming ? 'Detener streaming' : 'Iniciar streaming'}
            >
              {isStreaming ? '⏹️' : '📷'}
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