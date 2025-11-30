import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { graphViewModel } from '../../viewmodels/GraphViewModel';
import { projectViewModel } from '../../viewmodels/ProjectViewModel';
import { showSuccessAlert, showErrorAlert, showLoadingAlert, closeLoadingAlert } from '../../utils/alerts';

import './TomarFoto.css';

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid,
  XAxis, YAxis, PieChart, Pie, Cell, Legend
} from 'recharts';

const API_BASE_URL = "http://localhost:8000/imx477/streaming";

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
  valor?: number;
  temperatura?: number;
  fuerzaSenal?: number;
  apertura?: number;
  inclinacion?: number;
}

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

interface CircularMetricProps {
  value: number;
  label: string;
  color: string;
}

const MIN_INCLINACION = -15;
const MAX_INCLINACION = 15;
const MAX_HISTORY_LENGTH = 20;
const CircularMetric: React.FC<CircularMetricProps> = React.memo(({ value, label, color }) => {
  const data = useMemo(() => [
    { name: 'Valor', value: value },
    { name: 'Restante', value: 100 - value }
  ], [value]);

  return (
    <div className="circular-metric-container">
      <div className="circular-chart-wrapper-small">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              innerRadius={50}
              outerRadius={70}
              dataKey="value"
              strokeWidth={0}
              animationDuration={300}
              isAnimationActive={false}
            >
              <Cell fill={color} />
              <Cell fill="#E5E7EB" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="circular-value-overlay">
          <div className="circular-value-number">{value.toFixed(2)}</div>
        </div>
      </div>
      <div className="circular-metric-label">
        <div className="circular-color-dot" style={{ backgroundColor: color }} />
        <span>{label}</span>
      </div>
    </div>
  );
});

CircularMetric.displayName = 'CircularMetric';

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
  const [streamKey, setStreamKey] = useState<number>(0);
  const [distanciaHistory, setDistanciaHistory] = useState<HistoryPoint[]>([]);
  const [tfCombinedHistory, setTfCombinedHistory] = useState<HistoryPoint[]>([]);
  const [mpuCombinedHistory, setMpuCombinedHistory] = useState<HistoryPoint[]>([]);

  const mpuDataRef = useRef<MPUData>({
    ax: 0, ay: 0, az: 0,
    gx: 0, gy: 0, gz: 0,
    roll: 0, pitch: 0
  });

  const isInclinacionValida = data.inclinacion !== null && 
    data.inclinacion >= MIN_INCLINACION && 
    data.inclinacion <= MAX_INCLINACION;

  const { data: websocketData } = graphViewModel.useGraphData() as { data: any };
  const { id } = useParams();

  const evaluarFPS = useCallback((fps: number): string => {
    if (fps >= 24) return ' (Buena)';
    if (fps >= 15) return ' (Media)';
    return ' (Mala)';
  }, []);

  const evaluarFuerzaSenal = useCallback((valor: number): string => {
    if (valor >= 10000) return 'Muy buena';
    if (valor >= 4000) return 'Buena';
    if (valor >= 2000) return 'Aceptable';
    if (valor >= 1000) return 'Baja';
    return 'Muy baja';
  }, []);

  const normalizarLuminosidad = useCallback((lum: number): number => 
    Math.min((lum / 255) * 100, 100), []);
  
  const normalizarNitidez = useCallback((nit: number): number => 
    Math.min((nit / 500) * 100, 100), []);

  const startStream = useCallback(async () => {
    setStreamError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/start`, { method: "POST" });
      if (!res.ok) throw new Error("No se pudo iniciar el streaming");
      setStreamKey(Date.now());
      setIsStreaming(true);
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : 'Error al iniciar streaming');
    }
  }, []);

  const stopStream = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/stop`, { method: "POST" });
    } catch (err) {
      console.error('Error deteniendo stream:', err);
    }
    setIsStreaming(false);
  }, []);
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
  useEffect(() => {
    if (websocketData?.sensor === 'TF-Luna') {
      const tf = websocketData.data;
      const distancia = typeof tf.distancia_m === 'number' ? tf.distancia_m * 100 : 0;
      const fuerza = typeof tf.fuerza_senal === 'number' ? tf.fuerza_senal : 0;
      const temperatura = typeof tf.temperatura === 'number' ? tf.temperatura : 0;
      const now = new Date().toLocaleTimeString();
      setDistanciaHistory(prev => {
        const newHistory = [...prev, { name: now, valor: distancia }];
        return newHistory.slice(-MAX_HISTORY_LENGTH);
      });
      setTfCombinedHistory(prev => {
        const newHistory = [...prev, { 
          name: now, 
          temperatura: temperatura,
          fuerzaSenal: fuerza
        }];
        return newHistory.slice(-MAX_HISTORY_LENGTH);
      });

      setData(prev => ({
        ...prev,
        distancia,
        fuerzaSenal: `${fuerza} (${evaluarFuerzaSenal(fuerza)})`,
        temperatura,
        timestamp: tf.timestamp
      }));
    }
  }, [websocketData, evaluarFuerzaSenal]);
  useEffect(() => {
    if (websocketData?.sensor === 'MPU6050') {
      const { roll, pitch, apertura, ax, ay, az, gx, gy, gz } = websocketData.data;
      if (typeof roll === 'number' && typeof pitch === 'number' && typeof apertura === 'number') {
        const inclinacion = roll + pitch;
        const now = new Date().toLocaleTimeString();

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
        setMpuCombinedHistory(prev => {
          const newHistory = [...prev, { 
            name: now, 
            inclinacion: inclinacion,
            apertura: apertura
          }];
          return newHistory.slice(-MAX_HISTORY_LENGTH);
        });

        setData(prev => ({
          ...prev,
          inclinacion,
          apertura,
        }));
      }
    }
  }, [websocketData]);
  const radarData = useMemo(() => [
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
  ], [data.calidad, data.nitidez, data.luminosidad, data.probabilidad, evaluarFPS, normalizarNitidez, normalizarLuminosidad]);

  const handleGuardarMedidas = useCallback(async () => {
    if (data.inclinacion === null) {
      await showErrorAlert("No hay datos de inclinación del MPU6050.\n\nEspera a recibir datos del sensor.");
      return;
    }
    
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
  }, [data, id]);

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
            {isStreaming && <div className="stream-status-indicator">Streaming Activo</div>}
            
            {data.inclinacion !== null && !isInclinacionValida && (
              <div className="inclinacion-warning">
                <span>Inclinación: {data.inclinacion.toFixed(2)}°</span>
                <small>Rango válido: {MIN_INCLINACION}° a {MAX_INCLINACION}°</small>
              </div>
            )}
            
            {streamError && (
              <div className="stream-error-overlay">
                <span>⚠️ {streamError}</span>
                <button onClick={startStream} className="retry-stream-btn">Reintentar</button>
              </div>
            )}

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
      <div className='main-graphs'>
        <div className="RadarGraphSection">
          <h2>Gráfica del sensor de cámara y fiabilidad de datos</h2>
          <div className="radar-and-circular-container">
            <div className="radar-chart-container">
              <ResponsiveContainer width="100%" height={400}>
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
                    animationDuration={0}
                    isAnimationActive={false}
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
                Ajusta la inclinación ({data.inclinacion.toFixed(2)}°) al rango {MIN_INCLINACION}° a {MAX_INCLINACION}°
              </p>
            )}
          </div>
        </div>
        <div className="circular-metrics-container">
          <CircularMetric
            value={data.luminosidad ? normalizarLuminosidad(data.luminosidad) : 0}
            label="Luminosidad"
            color="#F59E0B"
          />
          <CircularMetric
            value={data.nitidez ? normalizarNitidez(data.nitidez) : 0}
            label="Nitidez"
            color="#1E40AF"
          />
          <CircularMetric
            value={data.calidad ? data.calidad * 100 : 0}
            label="Calidad"
            color="#031328"
          />
        </div>
      </div>
      <div className="TFGraphsContainer">
        <h2>Gráficas del sensor TF-Luna</h2>
        <div className='TFGraphsContent'>
          <div style={{ width: '100%', height: 380, marginBottom: 30 }}>
            <h4>Distancia (cm)</h4>
            <ResponsiveContainer>
              <LineChart data={distanciaHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis unit="cm" />
                <Tooltip formatter={(value: number) => [`${value.toFixed(2)} cm`, 'Distancia']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="#031328" 
                  strokeWidth={3} 
                  dot={false}
                  animationDuration={500}
                  animationEasing="ease-in-out"
                  isAnimationActive={true}
                  name="Distancia"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ width: '100%', height: 380, marginBottom: 60 }}>
            <h4>Temperatura y Fuerza de Señal</h4>
            <ResponsiveContainer>
              <LineChart data={tfCombinedHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" label={{ value: 'Temperatura (°C)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Fuerza Señal', angle: 90, position: 'insideRight' }} />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'Temperatura') return [`${value.toFixed(2)} °C`, 'Temperatura'];
                    if (name === 'Fuerza Señal') return [`${value.toFixed(2)} (${evaluarFuerzaSenal(value)})`, 'Fuerza Señal'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="temperatura" 
                  stroke="#F59E0B" 
                  strokeWidth={3} 
                  dot={false}
                  name="Temperatura"
                  animationDuration={500}
                  animationEasing="ease-in-out"
                  isAnimationActive={true}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="fuerzaSenal" 
                  stroke="#031328" 
                  strokeWidth={3} 
                  dot={false}
                  name="Fuerza Señal"
                  animationDuration={500}
                  animationEasing="ease-in-out"
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="MPUGraphsContainer">
        <h2>Gráficas del sensor MPU</h2>
        <div style={{ width: '100%', height: 380, marginBottom: 80 }}>
          <h4>Inclinación y Apertura</h4>
          <ResponsiveContainer>
            <LineChart data={mpuCombinedHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Grados (°)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'Inclinación') return [`${value.toFixed(2)} °`, 'Inclinación'];
                  if (name === 'Apertura') return [`${value.toFixed(2)} °`, 'Apertura'];
                  return [value, name];
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="inclinacion" 
                stroke="#c87f00ff" 
                strokeWidth={3} 
                dot={false}
                name="Inclinación"
                animationDuration={500}
                animationEasing="ease-in-out"
                isAnimationActive={true}
              />
              <Line 
                type="monotone" 
                dataKey="apertura" 
                stroke="#007eb5ff" 
                strokeWidth={3} 
                dot={false}
                name="Apertura"
                animationDuration={500}
                animationEasing="ease-in-out"
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default TomarFoto;