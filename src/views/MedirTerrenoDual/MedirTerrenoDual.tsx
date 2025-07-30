//src/views/MedirTerrenoDual/MedirTerrenoDual.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { graphViewModel } from '../../viewmodels/GraphViewModel';
import { cameraService } from '../../services/cameraService';
import { projectViewModel } from '../../viewmodels/ProjectViewModel';
import { showSuccessAlert, showErrorAlert, showLoadingAlert, closeLoadingAlert} from '../../utils/alerts';

import './MedirTerreno.css';

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid,
  XAxis, YAxis,
} from 'recharts';

function MedirTerrenoDual() {
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
  
  const [measurementState, setMeasurementState] = useState('initial');
  const [lastMeasurementIds, setLastMeasurementIds] = useState({ imx: null, tf: null, mpu: null });
  const [showDualMessage, setShowDualMessage] = useState(false);
  const [dualMessageType, setDualMessageType] = useState('');
  
  const [tfDataHistory, setTfDataHistory] = useState({
    distancia_cm_history: [],
    fuerzaSenal_history: [],
    temperatura_history: [],
    inclinacion_history: [],
    apertura_history: []
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

  const showDualMessageWithTimeout = (type, duration = 4000) => {
    setDualMessageType(type);
    setShowDualMessage(true);
    setTimeout(() => {
      setShowDualMessage(false);
    }, duration);
  };

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const imxResponse = await projectViewModel.handleGetSensorIMXByProjectId(id);
        if (imxResponse.success && imxResponse.data.length > 0) {
          const last = imxResponse.data[imxResponse.data.length - 1];
          
          if (last.measurement_count === 2) {
            setMeasurementState('dual_done');
          } else if (last.measurement_count === 1) {
            setMeasurementState('first_done');
            setLastMeasurementIds(prev => ({ ...prev, imx: last.id }));
          }
          
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
            apertura: last.apertura,
          }));
          setIsFromAPI(true);
        }

        const tfResponse = await projectViewModel.handleGetSensorTFLunaByProjectId(id);
        if (tfResponse.success && tfResponse.data.length > 0) {
          const lastTF = tfResponse.data[tfResponse.data.length - 1];
          
          if (lastTF.measurement_count === 1 && measurementState !== 'dual_done') {
            setLastMeasurementIds(prev => ({ ...prev, tf: lastTF.id }));
          }
          
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
            inclinacion_history: [],
            apertura_history: []
          });

          setUseRealtime(false);
        }

        const mpuResponse = await projectViewModel.handleGetSensorMPUByProjectId(id);
        if (mpuResponse.success && mpuResponse.data.length > 0) {
          const lastMPU = mpuResponse.data[mpuResponse.data.length - 1];
          if (lastMPU.measurement_count === 1 && measurementState !== 'dual_done') {
            setLastMeasurementIds(prev => ({ ...prev, mpu: lastMPU.id }));
          }
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
    if (websocketData?.sensor === 'MPU6050') {
      const { roll, pitch, apertura } = websocketData.data;
      if (typeof roll === 'number' && typeof pitch === 'number' && typeof apertura === 'number') {
        const inclinacion = roll + pitch;

        setData(prev => ({
          ...prev,
          inclinacion,
          apertura,
        }));

        const now = new Date().toLocaleTimeString();
        setTfDataHistory(prev => ({
          ...prev,
          inclinacion_history: [...prev.inclinacion_history.slice(-19), { name: now, valor: inclinacion }],
          apertura_history: [...prev.apertura_history.slice(-19), { name: now, valor: apertura }],
        }));
      }
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
          ...prev,
          distancia_cm_history: [...prev.distancia_cm_history.slice(-19), { name: timestamp, valor: distancia }],
          fuerzaSenal_history: [...prev.fuerzaSenal_history.slice(-19), { name: timestamp, valor: fuerza }],
          temperatura_history: [...prev.temperatura_history.slice(-19), { name: timestamp, valor: temperatura }]
        }));
      }
    }, 10000);

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
    showLoadingAlert(); 
    const timestamp = new Date().toISOString().replace('Z', '');

    try {
      if (measurementState === 'initial') {
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

        const payloadMPU = {
          id_project: parseInt(id),
          ax: websocketData?.data?.ax ?? 0,
          ay: websocketData?.data?.ay ?? 0,
          az: websocketData?.data?.az ?? 0,
          gx: websocketData?.data?.gx ?? 0,
          gy: websocketData?.data?.gy ?? 0,
          gz: websocketData?.data?.gz ?? 0,
          roll: websocketData?.data?.roll ?? 0,
          pitch: websocketData?.data?.pitch ?? 0,
          apertura: data.apertura ?? 0,
          event: true,
          timestamp,
        };

        const resIMX = await projectViewModel.handlePostSensorIMX(payloadCamara);
        const resTF = await projectViewModel.handlePostSensorTFLuna(payloadTF);
        const resMPU = await projectViewModel.handlePostSensorMPU(payloadMPU);

        closeLoadingAlert();

        if (resIMX.success && resTF.success && resMPU.success) {
          setLastMeasurementIds({
            imx: resIMX.data?.id,
            tf: resTF.data?.id,
            mpu: resMPU.data?.id
          });
          
          setMeasurementState('first_done');
          await showSuccessAlert("Primera medición guardada exitosamente.");
          
          showDualMessageWithTimeout('flip_camera', 5000);
        } else {
          await showErrorAlert("Error al guardar la primera medición.");
        }

      } else if (measurementState === 'first_done') {
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

        const payloadMPU = {
          id_project: parseInt(id),
          ax: websocketData?.data?.ax ?? 0,
          ay: websocketData?.data?.ay ?? 0,
          az: websocketData?.data?.az ?? 0,
          gx: websocketData?.data?.gx ?? 0,
          gy: websocketData?.data?.gy ?? 0,
          gz: websocketData?.data?.gz ?? 0,
          roll: websocketData?.data?.roll ?? 0,
          pitch: websocketData?.data?.pitch ?? 0,
          apertura: data.apertura ?? 0,
          event: true,
          timestamp,
        };

        const resIMX = await projectViewModel.handleUpdateDualSensorIMX(lastMeasurementIds.imx, payloadCamara);
        const resTF = await projectViewModel.handleUpdateDualSensorTFLuna(lastMeasurementIds.tf, payloadTF);
        const resMPU = await projectViewModel.handleUpdateDualSensorMPU(lastMeasurementIds.mpu, payloadMPU);

        closeLoadingAlert();

        if (resIMX.success && resTF.success && resMPU.success) {
          setMeasurementState('dual_done');
          await showSuccessAlert("Medición dual completada exitosamente.");
          
          showDualMessageWithTimeout('dual_complete', 6000);
        } else {
          await showErrorAlert("Error al completar la medición dual.");
        }

      } else {
        closeLoadingAlert();
        await showErrorAlert("Ya existe una medición dual para este proyecto. Las distancias se sumaron y los demás datos se promediaron.");
      }
    } catch (error) {
      closeLoadingAlert();
      await showErrorAlert("Error al procesar la medición.");
    }
  };

  const DualMessage = () => {
    if (!showDualMessage) return null;

    return (
      <div className="dual-message-overlay">
        <div className="dual-message-container">
          {dualMessageType === 'flip_camera' && (
            <>
              <div className="dual-message-icon">🔄</div>
              <h3>¡Primera medición completada!</h3>
              <p>Ahora voltea la cámara hacia el lado opuesto para realizar la medición dual.</p>
              <div className="dual-message-animation">
                <span>📷</span>
                <span className="arrow">→</span>
                <span>🔄</span>
                <span className="arrow">→</span>
                <span>📷</span>
              </div>
            </>
          )}
          {dualMessageType === 'dual_complete' && (
            <>
              <div className="dual-message-icon">✅</div>
              <h3>¡Medición Dual Completada!</h3>
              <p>Las distancias se han sumado y los demás datos se promediaron automáticamente.</p>
              <div className="dual-message-stats">
                <span>📏 Distancias: Sumadas</span>
                <span>📊 Otros datos: Promediados</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="ProjectPContainer">
      {/*  Componente de mensaje dual */}
      <DualMessage />
      
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
          {/*  Botón mejorado con indicadores de estado */}
          <button 
            className={`guardar-medidas-btn ${measurementState === 'dual_done' ? 'completed' : measurementState === 'first_done' ? 'dual-ready' : ''}`}
            onClick={handleGuardarMedidas}
            disabled={measurementState === 'dual_done'}
          >
            {measurementState === 'initial' && '📏 Realizar primera medición'}
            {measurementState === 'first_done' && '🔄 Completar medición dual'}
            {measurementState === 'dual_done' && '✅ Medición dual completada'}
          </button>
          
          {/* Indicador de progreso */}
          <div className="measurement-progress">
            <div className={`progress-step ${measurementState !== 'initial' ? 'completed' : 'active'}`}>
              1️⃣ Primera medición
            </div>
            <div className="progress-arrow">→</div>
            <div className={`progress-step ${measurementState === 'dual_done' ? 'completed' : measurementState === 'first_done' ? 'active' : ''}`}>
              2️⃣ Medición dual
            </div>
          </div>
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

      <div className="MPUGraphsContainer">
        <h2>Gráficas del sensor MPU</h2>

        <div style={{ width: '100%', height: 350, marginBottom: 50 }}>
          <h4>Inclinación (°)</h4>
          <ResponsiveContainer>
            <LineChart data={tfDataHistory.inclinacion_history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="°" />
              <Tooltip formatter={(value) => [`${value.toFixed(2)} °`, 'Inclinación']} />
              <Line type="monotone" dataKey="valor" stroke="#2e86de" strokeWidth={2} dot={false} />
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
              <Tooltip formatter={(value) => [`${value.toFixed(2)} °`, 'Apertura']} />
              <Line type="monotone" dataKey="valor" stroke="#1abc9c" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default MedirTerrenoDual;