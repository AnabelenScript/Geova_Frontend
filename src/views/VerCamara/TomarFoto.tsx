import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { graphViewModel } from '../../viewmodels/GraphViewModel';
import { cameraService } from '../../services/cameraService';
import { imxService } from '../../services/imx.Service';
import { showSuccessAlert, showErrorAlert } from '../../utils/alerts';
import './TomarFoto.css';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

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
  const [streamError, setStreamError] = useState(null);
  const [isFromAPI, setIsFromAPI] = useState(false);
  const imgRef = useRef(null);
  const { data: websocketData } = graphViewModel.useGraphData();
  const { id } = useParams(); // ID del proyecto desde la URL

  // Cargar datos de la API al iniciar
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await imxService.getSensorIMXByProjectId(id);
        if (response && response.length > 0) {
          const last = response[response.length - 1]; // Toma el último dato registrado
          setData(prevData => ({
            ...prevData,
            calidad: last.calidad_frame,
            nitidez: last.nitidez_score,
            luminosidad: last.luminosidad_promedio,
            fuerzaSenal: last.event ? "Fuerza alta" : "Fuerza baja",
          }));
          setIsFromAPI(true);
        }
      } catch (error) {
        console.error('Error al cargar datos desde API:', error);
      }
    };

    fetchSensorData();
  }, [id]);

  // Datos en tiempo real si no hay datos en la API
  useEffect(() => {
    if (!isFromAPI && websocketData) {
      const { sensor, data: sensorData } = websocketData;
      if (sensor === 'IMX477') {
        setData(prevData => ({
          ...prevData,
          luminosidad: sensorData.luminosidad_promedio,
          calidad: sensorData.calidad_frame,
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
  }, [websocketData, isFromAPI]);

  const startStream = async () => {
    try {
      setStreamError(null);
      await cameraService.startStreaming();
      const img = imgRef.current;
      if (img) {
        img.onload = () => setIsStreaming(true);
        img.onerror = () => setStreamError('Error cargando stream de video');
        img.src = cameraService.getStreamUrl();
      }
    } catch (error) {
      setStreamError('Error iniciando streaming: ' + error.message);
    }
  };

  const stopStream = async () => {
    try {
      setIsStreaming(false);
      setStreamError(null);
      const img = imgRef.current;
      if (img) {
        img.onload = null;
        img.onerror = null;
        img.src = '';
      }
      await cameraService.stopStreaming();
    } catch (error) {
      console.error('Error deteniendo stream:', error);
    }
  };

  const radarData = [
    {
      atributo: 'Calidad',
      valor: data.calidad ? Number(data.calidad.toFixed(2)) : 0,
    },
    {
      atributo: 'Nitidez',
      valor: data.nitidez ? Number(data.nitidez.toFixed(2)) : 0,
    },
    {
      atributo: 'Luminosidad',
      valor: data.luminosidad ? Number(data.luminosidad.toFixed(2)) : 0,
    },
    {
      atributo: 'Confiabilidad',
      valor: data.calidad && data.nitidez
        ? Number(((data.calidad + data.nitidez) / 2).toFixed(2))
        : 0,
    },
  ];

  const handleGuardarMedidas = async () => {
    const timestamp = new Date().toISOString();
    const payload = {
      id_project: parseInt(id),
      resolution: "640x480",
      luminosidad_promedio: data.luminosidad || 0,
      nitidez_score: data.nitidez || 0,
      laser_detectado: false,
      calidad_frame: data.calidad || 0,
      probabilidad_confiabilidad: data.calidad && data.nitidez
        ? (data.calidad + data.nitidez) / 2
        : 0,
      event: data.fuerzaSenal === "Fuerza alta",
      timestamp
    };

    try {
      await imxService.postSensorIMX(payload);
      await showSuccessAlert('Datos del sensor guardados correctamente.');
    } catch (error) {
      await showErrorAlert('Error al guardar los datos del sensor.');
    }
  };

  return (
    <div className="ProjectPContainer">
      <div className='ProjectFotoPContainer'>
        <div className='ProjectData'>
          <label>Calidad</label>
          <span>{data.calidad ? `${data.calidad.toFixed(2)} FPS` : "Cargando..."}</span>
          <label>Nitidez</label>
          <span>{data.nitidez ? `${data.nitidez.toFixed(2)} %` : "Cargando..."}</span>
          <label>Luminosidad</label>
          <span>{data.luminosidad ? `${data.luminosidad.toFixed(2)} lux` : "Cargando..."}</span>
        </div>

        <div className="ProjectphotoContainer">
          <div className="corner-top-right"></div>
          <div className="corner-bottom-left"></div>
          <div className='MainphotoContainer'>
            {isStreaming && <div className="stream-status-indicator">📡 Streaming Activo</div>}
            {streamError && (
              <div className="stream-error-overlay">
                ⚠️ {streamError}
                <button onClick={startStream} className="retry-stream-btn">Reintentar</button>
              </div>
            )}
            <img
              ref={imgRef}
              className="camera-stream-full"
              style={{ display: isStreaming ? 'block' : 'none' }}
              alt="Camera Stream"
            />
            {!isStreaming && !streamError && (
              <div className="camera-inactive-message">
                <h2>📷 Cámara Inactiva</h2>
                <p>Presiona el botón para activar el streaming</p>
              </div>
            )}
            <div className="Takephotobutton">
              <button
                className={`TakeButton ${isStreaming ? 'active' : ''}`}
                onClick={isStreaming ? stopStream : startStream}
              >
                {isStreaming ? '⏹️' : '📷'}
              </button>
            </div>
          </div>
        </div>

        <div className='ProjectData'>
          <label>Distancia</label>
          <span>{data.distancia ? `${data.distancia.toFixed(2)} cm` : "Cargando..."}</span>
          <label>Fuerza señal</label>
          <span>{data.fuerzaSenal || "Cargando..."}</span>
          <label>Apertura</label>
          <span>{data.apertura ? `${data.apertura.toFixed(2)} °` : "Cargando..."}</span>
          <label>Inclinación</label>
          <span>{data.inclinacion ? `${data.inclinacion.toFixed(2)} °` : "Cargando..."}</span>
        </div>
      </div>

      <div className="RadarGraphSection">
        <h2>Gráfica del sensor de cámara y fiabilidad de datos</h2>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="atributo" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="Análisis"
                dataKey="valor"
                stroke="black"
                fill="#E6AF2E"
                fillOpacity={0.6}
              />
              <Tooltip
                wrapperStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  padding: "5px"
                }}
                contentStyle={{ color: "#000000" }}
                cursor={{ stroke: "#E6AF2E", strokeWidth: 2 }}
                formatter={(value, name, props) => {
                  const atributo = props?.payload?.atributo;
                  let unidad = '';
                  switch (atributo) {
                    case 'Confiabilidad': unidad = '%'; break;
                    case 'Luminosidad': unidad = 'lux'; break;
                    case 'Calidad': unidad = 'FPS'; break;
                    default: unidad = '';
                  }
                  return [`${value} ${unidad}`, atributo];
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button className="guardar-medidas-btn" onClick={handleGuardarMedidas}>
            Guardar medidas
          </button>
        </div>
      </div>
    </div>
  );
}

export default TomarFoto;
