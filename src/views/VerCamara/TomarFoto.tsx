import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { graphViewModel } from '../../viewmodels/GraphViewModel';
import { projectViewModel } from '../../viewmodels/ProjectViewModel';
import { showSuccessAlert, showErrorAlert, showLoadingAlert, closeLoadingAlert } from '../../utils/alerts';

import './TomarFoto.css';

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid,
  XAxis, YAxis,
} from 'recharts';

const API_BASE_URL = "http://localhost:8000/imx477/streaming";

// Interfaces para tipado
interface SensorData {
  calidad: number | null;
  nitidez: number | null;
  luminosidad: number | null;
  inclinacion: number | null;
  distancia: number | null;
  fuerzaSenal: string | null;
  temperatura: number | null;
  apertura: number | null;
  resolution: string | null;
  laser_detectado: boolean | null;
  event: boolean | null;
  probabilidad: number | null;
  timestamp: string | null;
}

interface HistoryPoint {
  name: string;
  valor: number;
}

interface DataHistory {
  distancia_cm_history: HistoryPoint[];
  fuerzaSenal_history: HistoryPoint[];
  temperatura_history: HistoryPoint[];
  inclinacion_history: HistoryPoint[];
  apertura_history: HistoryPoint[];
}

// Interface para datos del MPU6050
interface MPUData {
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
  roll: number;
  pitch: number;
}

// Constantes para validación de inclinación
const MIN_INCLINACION = -15;
const MAX_INCLINACION = 15;

function TomarFoto() {
  const [data, setData] = useState<SensorData>({
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
  const [streamError, setStreamError] = useState<string | null>(null);
  // Timestamp fijo que solo cambia al iniciar stream - evita re-renders
  const [streamKey, setStreamKey] = useState<number>(0);

  // Ref para guardar los últimos datos del MPU6050 (persisten entre renders)
  const mpuDataRef = useRef<MPUData>({
    ax: 0, ay: 0, az: 0,
    gx: 0, gy: 0, gz: 0,
    roll: 0, pitch: 0
  });

  // Validación de inclinación
  const isInclinacionValida = data.inclinacion !== null && 
    data.inclinacion >= MIN_INCLINACION && 
    data.inclinacion <= MAX_INCLINACION;

  const tfDataHistoryRef = useRef<DataHistory>({
    distancia_cm_history: [],
    fuerzaSenal_history: [],
    temperatura_history: [],
    inclinacion_history: [],
    apertura_history: []
  });

  const [tfDataHistory, setTfDataHistory] = useState<DataHistory>(tfDataHistoryRef.current);

  const { data: websocketData } = graphViewModel.useGraphData() as { data: any };
  const { id } = useParams();

  // Funciones de evaluación
  const evaluarFPS = (fps: number) => {
    if (fps >= 24) return ' (Buena)';
    if (fps >= 15) return ' (Media)';
    return ' (Mala)';
  };

  const evaluarFuerzaSenal = (valor: number) => {
    if (valor >= 10000) return 'Muy buena';
    if (valor >= 4000) return 'Buena';
    if (valor >= 2000) return 'Aceptable';
    if (valor >= 1000) return 'Baja';
    return 'Muy baja';
  };

  const normalizarLuminosidad = (lum: number) => Math.min((lum / 255) * 100, 100);
  const normalizarNitidez = (nit: number) => Math.min((nit / 500) * 100, 100);

  const startStream = async () => {
    setStreamError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/start`, { method: "POST" });
      if (!res.ok) throw new Error("No se pudo iniciar el streaming");
      setStreamKey(Date.now()); // Timestamp fijo para esta sesión de stream
      setIsStreaming(true);
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : 'Error al iniciar streaming');
    }
  };

  const stopStream = async () => {
    try {
      await fetch(`${API_BASE_URL}/stop`, { method: "POST" });
    } catch (err) {
      console.error('Error deteniendo stream:', err);
    }
    setIsStreaming(false);
  };

  // Procesamiento de datos del sensor IMX477
  useEffect(() => {
    if (websocketData?.sensor === 'IMX477') {
      const sensorData = websocketData.data;
      setData(prev => ({
        ...prev,
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
  }, [websocketData]);

  // Procesamiento de datos TF-Luna y MPU6050
  useEffect(() => {
    if (!websocketData) return;

    const now = new Date().toLocaleTimeString();

    if (websocketData.sensor === 'TF-Luna') {
      const tf = websocketData.data;
      const distancia = typeof tf.distancia_m === 'number' ? tf.distancia_m * 100 : 0;
      const fuerza = typeof tf.fuerza_senal === 'number' ? tf.fuerza_senal : 0;
      const temperatura = typeof tf.temperatura === 'number' ? tf.temperatura : 0;

      // Actualizar historial
      tfDataHistoryRef.current = {
        ...tfDataHistoryRef.current,
        distancia_cm_history: [...tfDataHistoryRef.current.distancia_cm_history, { name: now, valor: distancia }].slice(-20),
        fuerzaSenal_history: [...tfDataHistoryRef.current.fuerzaSenal_history, { name: now, valor: fuerza }].slice(-20),
        temperatura_history: [...tfDataHistoryRef.current.temperatura_history, { name: now, valor: temperatura }].slice(-20)
      };

      setData(prev => ({
        ...prev,
        distancia,
        fuerzaSenal: `${fuerza} (${evaluarFuerzaSenal(fuerza)})`,
        temperatura,
        timestamp: tf.timestamp
      }));

      setTfDataHistory({ ...tfDataHistoryRef.current });
    }

    if (websocketData.sensor === 'MPU6050') {
      const { roll, pitch, apertura, ax, ay, az, gx, gy, gz } = websocketData.data;
      if (typeof roll === 'number' && typeof pitch === 'number' && typeof apertura === 'number') {
        const inclinacion = roll + pitch;

        // Guardar datos del MPU en ref para usarlos en el POST
        mpuDataRef.current = {
          ax: ax ?? 0,
          ay: ay ?? 0,
          az: az ?? 0,
          gx: gx ?? 0,
          gy: gy ?? 0,
          gz: gz ?? 0,
          roll,
          pitch
        };

        tfDataHistoryRef.current = {
          ...tfDataHistoryRef.current,
          inclinacion_history: [...tfDataHistoryRef.current.inclinacion_history, { name: now, valor: inclinacion }].slice(-20),
          apertura_history: [...tfDataHistoryRef.current.apertura_history, { name: now, valor: apertura }].slice(-20)
        };

        setData(prev => ({
          ...prev,
          inclinacion,
          apertura,
        }));

        setTfDataHistory({ ...tfDataHistoryRef.current });
      }
    }
  }, [websocketData]);

  // Datos para gráfica radar
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

  // Guardar medidas
  const handleGuardarMedidas = async () => {
    // Validar que hay datos de inclinación
    if (data.inclinacion === null) {
      await showErrorAlert("No hay datos de inclinación del MPU6050.\n\nEspera a recibir datos del sensor.");
      return;
    }
    
    // Validar que la inclinación está en el rango permitido
    if (data.inclinacion < MIN_INCLINACION || data.inclinacion > MAX_INCLINACION) {
      await showErrorAlert(
        `Inclinación fuera de rango: ${data.inclinacion.toFixed(2)}°\n\n` +
        `Debe estar entre ${MIN_INCLINACION}° y ${MAX_INCLINACION}° para guardar las medidas.\n\n` +
        `Ajusta la posición del dispositivo e intenta de nuevo.`
      );
      return;
    }

    showLoadingAlert();
    const timestamp = new Date().toISOString().replace('Z', '');

    const payloadCamara = {
      id_project: parseInt(id || '0'),
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
      id_project: parseInt(id || '0'),
      distancia_cm: Math.round(data.distancia ?? 0),
      distancia_m: (data.distancia ?? 0) / 100,
      fuerza_senal: Math.round(fuerzaParseada),
      temperatura: data.temperatura ?? 0,
      event: true,
      timestamp,
    };

    const payloadMPU = {
      id_project: parseInt(id || '0'),
      ax: mpuDataRef.current.ax,
      ay: mpuDataRef.current.ay,
      az: mpuDataRef.current.az,
      gx: mpuDataRef.current.gx,
      gy: mpuDataRef.current.gy,
      gz: mpuDataRef.current.gz,
      roll: mpuDataRef.current.roll,
      pitch: mpuDataRef.current.pitch,
      apertura: data.apertura ?? 0,
      event: true,
      timestamp,
    };

    try {
      const resIMX = await projectViewModel.handlePostSensorIMX(payloadCamara);
      const resTF = await projectViewModel.handlePostSensorTFLuna(payloadTF);
      const resMPU = await projectViewModel.handlePostSensorMPU(payloadMPU);

      closeLoadingAlert();

      if (resIMX.success && resTF.success && resMPU.success) {
        await showSuccessAlert("Datos guardados exitosamente.");
      } else {
        await showErrorAlert("Uno o más sensores no se guardaron correctamente.");
      }
    } catch {
      closeLoadingAlert();
      await showErrorAlert("Error al guardar los datos.");
    }
  };

  return (
    <div className="ProjectPContainer">
      <div className='TakePhotoTitleContainer'>
        <div className='TakePhotoTitle'>
          <h1>Tomar foto</h1>
          <i className="fa-solid fa-camera"></i>
        </div>
        <div className='TakePhotoEndTitle'></div>
      </div>

      <div className='ProjectFotoPContainer'>
        <div className='ProjectData'>
          <label>Calidad </label>
          <span>{data.calidad ? `${data.calidad.toFixed(2)}` : "Cargando"}</span>
          <label>Nitidez </label>
          <span>{data.nitidez ? `${data.nitidez.toFixed(2)}` : "Cargando"}</span>
          <label>Luminosidad </label>
          <span>{data.luminosidad ? `${data.luminosidad.toFixed(2)} lux` : "Cargando"}</span>
        </div>
        <div className="ProjectphotoContainer">
          <div className='MainphotoContainer'>
            {isStreaming && <div className="stream-status-indicator">📡 Streaming Activo</div>}
            
            {/* Advertencia de inclinación fuera de rango */}
            {data.inclinacion !== null && !isInclinacionValida && (
              <div className="inclinacion-warning">
                <span>⚠️ Inclinación: {data.inclinacion.toFixed(2)}°</span>
                <small>Rango válido: {MIN_INCLINACION}° a {MAX_INCLINACION}°</small>
              </div>
            )}
            
            {streamError && (
              <div className="stream-error-overlay">
                <span>⚠️ {streamError}</span>
                <button onClick={startStream} className="retry-stream-btn">Reintentar</button>
              </div>
            )}

            {/* Stream de video - MJPEG nativo sin procesamiento JavaScript */}
            {isStreaming ? (
              <img
                src={`${API_BASE_URL}/video?t=${streamKey}`}
                className="camera-stream-full"
                alt="Camera Stream"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={() => setStreamError('Error en stream de video')}
              />
            ) : (
              !streamError && (
                <div className="camera-inactive-message">
                  <h2>Cámara Inactiva</h2>
                  <p>Presiona el botón para activar el streaming</p>
                </div>
              )
            )}

            <div className="Takephotobutton">
              <button
                className={`TakeButton ${isStreaming ? 'active' : ''}`}
                onClick={isStreaming ? stopStream : startStream}
              />
            </div>
          </div>
        </div>

        <div className='ProjectData'>
          <label>Distancia</label>
          <span>{data.distancia ? `${data.distancia.toFixed(2)} cm` : "Cargando"}</span>
          <label>Fuerza señal</label>
          <span>{data.fuerzaSenal || "Cargando"}</span>
          <label>Apertura</label>
          <span>{data.apertura ? `${data.apertura.toFixed(2)} °` : "Cargando"}</span>
          <label>Inclinación</label>
          <span>{data.inclinacion ? `${data.inclinacion.toFixed(2)} °` : "Cargando"}</span>
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
                formatter={(value, _name, props) => {
                  const atributo = props?.payload?.atributo;
                  const evaluacion = props?.payload?.evaluacion || '';
                  return [`${value} %${evaluacion}`, atributo];
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            className={`guardar-medidas-btn ${!isInclinacionValida ? 'disabled' : ''}`}
            onClick={handleGuardarMedidas}
            disabled={!isInclinacionValida}
            title={!isInclinacionValida ? `Inclinación debe estar entre ${MIN_INCLINACION}° y ${MAX_INCLINACION}°` : 'Guardar medidas de todos los sensores'}
          >
            Guardar medidas
          </button>
          {!isInclinacionValida && data.inclinacion !== null && (
            <p style={{ color: '#dc143c', marginTop: '10px', fontSize: '0.9rem' }}>
              ⚠️ Ajusta la inclinación ({data.inclinacion.toFixed(2)}°) al rango {MIN_INCLINACION}° a {MAX_INCLINACION}°
            </p>
          )}
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
              <Tooltip formatter={(value: number) => [`${value.toFixed(2)} cm`, 'Distancia']} />
              <Line type="monotone" dataKey="valor" stroke="#E6AF2E" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ width: '100%', height: 350, marginBottom: 50 }}>
          <h4>Fuerza de Señal basada en 2 bytes</h4>
          <ResponsiveContainer>
            <LineChart data={tfDataHistory.fuerzaSenal_history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`${value.toFixed(2)} (${evaluarFuerzaSenal(value)})`, 'Fuerza']} />
              <Line type="monotone" dataKey="valor" stroke="#E6AF2E" strokeWidth={2} dot={false} />
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
              <Tooltip formatter={(value: number) => [`${value.toFixed(2)} °C`, 'Temperatura']} />
              <Line type="monotone" dataKey="valor" stroke="#E6AF2E" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="MPUGraphsContainer">
        <h2>Gráficas del sensor MPU</h2>

        <div style={{ width: '100%', height: 350, marginBottom: 50 }}>
          <h4>Inclinación (°)</h4>
          <ResponsiveContainer>
            <LineChart data={tfDataHistory.inclinacion_history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="°" />
              <Tooltip formatter={(value: number) => [`${value.toFixed(2)} °`, 'Inclinación']} />
              <Line type="monotone" dataKey="valor" stroke="#E6AF2E" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ width: '100%', height: 350, marginBottom: 50 }}>
          <h4>Apertura (°)</h4>
          <ResponsiveContainer>
            <LineChart data={tfDataHistory.apertura_history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="°" />
              <Tooltip formatter={(value: number) => [`${value.toFixed(2)} °`, 'Apertura']} />
              <Line type="monotone" dataKey="valor" stroke="#E6AF2E" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default TomarFoto;
