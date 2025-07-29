// TomarFoto.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { graphViewModel } from '../../viewmodels/GraphViewModel';
import { cameraService } from '../../services/cameraService';
import { projectViewModel } from '../../viewmodels/ProjectViewModel';
import { showSuccessAlert, showErrorAlert, showCautionAlert } from '../../utils/alerts';
import './TomarFoto.css';

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid,
  XAxis, YAxis,
} from 'recharts';

function TomarFoto() {
  const [data, setData] = useState({
    calidad: null,
    nitidez: null,
    luminosidad: null,
    inclinacion: null,
    distancia: null,
    fuerzaSenal: null,
    temperatura: null,
    apertura: null,
    resolution: null,
    laser_detectado: null,
    event: null,
    probabilidad: null,
    timestamp: null
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [isFromAPI, setIsFromAPI] = useState(false);
  const [lastTfData, setLastTfData] = useState(null);
  const [useRealtime, setUseRealtime] = useState(true);
  const [tfDataHistory, setTfDataHistory] = useState({
    distancia_cm_history: [],
    fuerzaSenal_history: [],
    temperatura_history: []
  });

  const imgRef = useRef(null);
  const { data: websocketData } = graphViewModel.useGraphData();
  const { id } = useParams();

  const evaluarFPS = (fps) => {
    if (fps >= 24) return ' (Buena)';
    if (fps >= 15) return ' (Media)';
    return ' (Mala)';
  };

  const evaluarFuerzaSenal = (valor) => {
    if (valor >= 10000) return 'Muy buena';
    if (valor >= 4000) return 'Buena';
    if (valor >= 2000) return 'Aceptable';
    if (valor >= 1000) return 'Baja';
    return 'Muy baja';
  };

  const normalizarLuminosidad = (lum) => Math.min((lum / 255) * 100, 100);
  const normalizarNitidez = (nit) => Math.min((nit / 500) * 100, 100);

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const imxResponse = await projectViewModel.handleGetSensorIMXByProjectId(id);
        if (imxResponse.success && imxResponse.data.length > 0) {
          const last = imxResponse.data[imxResponse.data.length - 1];
          setData(prevData => ({
            ...prevData,
            calidad: last.calidad_frame,
            nitidez: last.nitidez_score,
            distancia: last.distancia_cm,
            luminosidad: last.luminosidad_promedio,
            resolution: last.resolution,
            laser_detectado: last.laser_detectado,
            event: last.event,
            probabilidad: last.probabilidad_confiabilidad,
            timestamp: last.timestamp,
            fuerzaSenal: last.fuerza_senal
              ? `${last.fuerza_senal} (${evaluarFuerzaSenal(last.fuerza_senal)})`
              : "No disponible",
            temperatura: last.temperatura ?? 0,
          }));
          setIsFromAPI(true);
        }

        const tfResponse = await projectViewModel.handleGetSensorTFLunaByProjectId(id);
        if (tfResponse.success && tfResponse.data.length > 0) {
          const history = tfResponse.data.map((entry) => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            return {
              distancia: { name: time, valor: entry.distancia_cm },
              fuerza: { name: time, valor: entry.fuerza_senal },
              temp: { name: time, valor: entry.temperatura }
            };
          });

          setTfDataHistory({
            distancia_cm_history: history.map(h => h.distancia),
            fuerzaSenal_history: history.map(h => h.fuerza),
            temperatura_history: history.map(h => h.temp),
          });

          setUseRealtime(false);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };

    fetchSensorData();
  }, [id]);

  useEffect(() => {
    if (!isFromAPI && websocketData?.sensor === 'IMX477') {
      const sensorData = websocketData.data;
      setData(prevData => ({
        ...prevData,
        luminosidad: sensorData.luminosidad_promedio,
        calidad: sensorData.calidad_frame,
        nitidez: sensorData.nitidez_score,
        resolution: sensorData.resolution,
        laser_detectado: sensorData.laser_detectado,
        probabilidad: sensorData.probabilidad_confiabilidad,
        event: sensorData.event,
        timestamp: sensorData.timestamp
      }));
    }
  }, [websocketData, isFromAPI]);

  useEffect(() => {
    if (websocketData?.sensor === 'TF-Luna') {
      setLastTfData(websocketData.data);
    }
  }, [websocketData]);

  useEffect(() => {
    if (!useRealtime) return;

    const interval = setInterval(() => {
      if (lastTfData) {
        const timestamp = new Date().toLocaleTimeString();
        const distancia = lastTfData.distancia_m * 100;
        const fuerza = lastTfData.fuerza_senal;
        const temperatura = lastTfData.temperatura ?? 0;

        setData(prev => ({
          ...prev,
          distancia,
          fuerzaSenal: `${fuerza} (${evaluarFuerzaSenal(fuerza)})`,
          temperatura,
          timestamp: lastTfData.timestamp
        }));

        setTfDataHistory(prev => ({
          distancia_cm_history: [...prev.distancia_cm_history.slice(-19), { name: timestamp, valor: distancia }],
          fuerzaSenal_history: [...prev.fuerzaSenal_history.slice(-19), { name: timestamp, valor: fuerza }],
          temperatura_history: [...prev.temperatura_history.slice(-19), { name: timestamp, valor: temperatura }]
        }));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [lastTfData, useRealtime]);

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
      valor: data.calidad ? Number((data.calidad * 100).toFixed(2)) : 0,
      evaluacion: data.calidad ? evaluarFPS(data.calidad * 30) : '',
    },
    {
      atributo: 'Nitidez',
      valor: data.nitidez ? Number(normalizarNitidez(data.nitidez).toFixed(2)) : 0,
    },
    {
      atributo: 'Luminosidad',
      valor: data.luminosidad ? Number(normalizarLuminosidad(data.luminosidad).toFixed(2)) : 0,
    },
    {
      atributo: 'Confiabilidad',
      valor: data.probabilidad ? Number((data.probabilidad).toFixed(2)) : 0,
    },
  ];

  const handleGuardarMedidas = async () => {
  // 🟢 Naive datetime string compatible con PostgreSQL TIMESTAMP WITHOUT TIME ZONE
  const timestamp = new Date().toISOString().replace('Z', '');

  const payloadCamara = {
    id_project: parseInt(id),
    resolution: data.resolution,
    luminosidad_promedio: data.luminosidad ?? 0,
    nitidez_score: data.nitidez ?? 0,
    laser_detectado: data.laser_detectado ?? false,
    calidad_frame: data.calidad ?? 0,
    probabilidad_confiabilidad: data.probabilidad ?? 0,
    event: true,
    timestamp,
  };

  const fuerzaParseada = parseFloat(String(data.fuerzaSenal).split(" ")[0]) || 0;

  const payloadTF = {
    id_project: parseInt(id),
    distancia_cm: data.distancia ?? 0,
    distancia_m: (data.distancia ?? 0) / 100,
    fuerza_senal: fuerzaParseada,
    temperatura: data.temperatura ?? 0,
    event: true,
    timestamp,
  };

  try {
    const resIMX = await projectViewModel.handlePostSensorIMX(payloadCamara);
    const resTF = await projectViewModel.handlePostSensorTFLuna(payloadTF);

    if (resIMX.success && resTF.success) {
      await showSuccessAlert("Datos guardados exitosamente.");
    } else {
      await showErrorAlert("Uno o ambos sensores no se guardaron correctamente.");
    }
  } catch (error) {
    await showErrorAlert("Error al guardar los datos.");
  }
};



    return (
  <div className="ProjectPContainer">
    <div className='ProjectFotoPContainer'>
      <div className='ProjectData'>
        <label>Calidad</label>
        <span>{data.calidad ? `${data.calidad.toFixed(2)}` : "Cargando..."}</span>
        <label>Nitidez</label>
        <span>{data.nitidez ? `${data.nitidez.toFixed(2)}` : "Cargando..."}</span>
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
                const evaluacion = props?.payload?.evaluacion || '';
                return [`${value} %${evaluacion}`, atributo];
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

    <div className="TFGraphsContainer">
      <h2>Gráficas del sensor TF-Luna</h2>

      <div style={{ width: '100%', height: 350, marginBottom: 50 }}>
        <h4>Distancia (cm)</h4>
        <ResponsiveContainer>
          <LineChart data={tfDataHistory.distancia_cm_history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis unit="cm" />
            <Tooltip formatter={(value) => [`${value.toFixed(2)} cm`, 'Distancia']} />
            <Line type="monotone" dataKey="valor" stroke="#8884d8" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ width: '100%', height: 350, marginBottom: 50 }}>
        <h4>Fuerza de Señal</h4>
        <ResponsiveContainer>
          <LineChart data={tfDataHistory.fuerzaSenal_history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value.toFixed(2)} (${evaluarFuerzaSenal(value)})`, 'Fuerza']} />
            <Line type="monotone" dataKey="valor" stroke="#82ca9d" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ width: '100%', height: 350, marginBottom: 50 }}>
        <h4>Temperatura (°C)</h4>
        <ResponsiveContainer>
          <LineChart data={tfDataHistory.temperatura_history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis unit="°C" />
            <Tooltip formatter={(value) => [`${value.toFixed(2)} °C`, 'Temperatura']} />
            <Line type="monotone" dataKey="valor" stroke="#ff7300" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);
}

export default TomarFoto;
