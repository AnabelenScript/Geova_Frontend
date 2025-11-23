//src/views/MedirTerrenoDual/MedirTerrenoDual.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { graphViewModel } from '../../viewmodels/GraphViewModel';
import { cameraService } from '../../services/cameraService';
import { projectViewModel } from '../../viewmodels/ProjectViewModel';
import { showSuccessAlert, showErrorAlert, showLoadingAlert, closeLoadingAlert, showConfirmAlert } from '../../utils/modals/alerts';
import Swal from 'sweetalert2';
import alerticon from '../../assets/alerticon.svg';
import succesfulicon from '../../assets/sucessfulicon.svg';

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
  
  // Estados mejorados para manejar múltiples mediciones
  const [measurementState, setMeasurementState] = useState('no_measurements'); // no_measurements, has_measurements, first_done, dual_done
  const [lastMeasurementIds, setLastMeasurementIds] = useState({ imx: null, tf: null, mpu: null });
  const [availableMeasurements, setAvailableMeasurements] = useState([]);
  const [showDualMessage, setShowDualMessage] = useState(false);
  const [dualMessageType, setDualMessageType] = useState('');
  
  // Historial de datos en tiempo real para las gráficas
  const tfDataHistoryRef = useRef({
    distancia_cm_history: [],
    fuerzaSenal_history: [],
    temperatura_history: [],
    inclinacion_history: [],
    apertura_history: []
  });

  const [tfDataHistory, setTfDataHistory] = useState(tfDataHistoryRef.current);

  // Ref para el radar data en tiempo real
  const radarDataRef = useRef([
    { atributo: 'Calidad', valor: 0, evaluacion: '' },
    { atributo: 'Nitidez', valor: 0 },
    { atributo: 'Luminosidad', valor: 0 },
    { atributo: 'Confiabilidad', valor: 0 }
  ]);

  const [radarData, setRadarData] = useState(radarDataRef.current);

  const imgRef = useRef(null);
  const { data: websocketData } = graphViewModel.useGraphData();
  const { id } = useParams(); // Este es el id_project

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
    if (type === 'flip_camera') {
      Swal.fire({
        title: '¡Primera medición completada!',
        text: 'Voltea la cámara hacia el lado opuesto para realizar la medición dual.',
        imageUrl: alerticon,
        imageWidth: 200,
        imageHeight: 200,
        showConfirmButton: false,
        timer: 5000,
        background: '#fff',
        color: '#333',
        customClass: {
          popup: 'succesful-popup',
          title: 'succesful-title'
        }
      });
    } else if (type === 'dual_complete') {
      Swal.fire({
        title: '¡Medición Dual Completada!',
        text: 'Las distancias se han sumado y los demás datos se promediaron automáticamente.',
        imageUrl: succesfulicon,
        imageWidth: 200,
        imageHeight: 200,
        showConfirmButton: false,
        timer: 4000,
        background: '#fff',
        color: '#333',
        customClass: {
          popup: 'succesful-popup',
          title: 'succesful-titulo',
          confirmButton: 'succesful-confirmar',
          htmlContainer: 'succesful-contenido'
        }
      });
    }
    
    setDualMessageType(type);
    setShowDualMessage(true);
    setTimeout(() => {
      setShowDualMessage(false);
    }, duration);
  };

  // Función para actualizar radar data en tiempo real
  const updateRadarData = () => {
    radarDataRef.current = [
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
    
    setRadarData([...radarDataRef.current]);
  };

  useEffect(() => {
    const fetchSensorData = async () => {
      if (!id) {
        console.error('ID del proyecto no encontrado');
        return;
      }

      try {
        const imxResponse = await projectViewModel.handleGetSensorIMXByProjectId(id);
        const tfResponse = await projectViewModel.handleGetSensorTFLunaByProjectId(id);
        const mpuResponse = await projectViewModel.handleGetSensorMPUByProjectId(id);

        if (imxResponse.success && imxResponse.data.length > 0 &&
            tfResponse.success && tfResponse.data.length > 0 &&
            mpuResponse.success && mpuResponse.data.length > 0) {
          
          // Encontrar mediciones agrupadas por measurement_count
          const measurements = [];
          const maxLength = Math.max(imxResponse.data.length, tfResponse.data.length, mpuResponse.data.length);
          
          for (let i = 0; i < maxLength; i++) {
            const imx = imxResponse.data[i];
            const tf = tfResponse.data[i];
            const mpu = mpuResponse.data[i];
            
            if (imx && tf && mpu) {
              measurements.push({
                imx: imx,
                tf: tf,
                mpu: mpu,
                index: i
              });
            }
          }

          setAvailableMeasurements(measurements);

          // Verificar si hay alguna medición en progreso (measurement_count = 1)
          const pendingMeasurement = measurements.find(m => 
            m.imx.measurement_count === 1 && 
            m.tf.measurement_count === 1 && 
            m.mpu.measurement_count === 1
          );

          // Contar mediciones completas (measurement_count = 2)
          const completedMeasurements = measurements.filter(m => 
            m.imx.measurement_count === 2 && 
            m.tf.measurement_count === 2 && 
            m.mpu.measurement_count === 2
          );

          if (pendingMeasurement) {
            setMeasurementState('first_done');
            // ✅ CORRECCIÓN CRÍTICA: Guardar los IDs correctamente
            setLastMeasurementIds({
              imx: pendingMeasurement.imx.id,
              tf: pendingMeasurement.tf.id,
              mpu: pendingMeasurement.mpu.id
            });
            console.log('🔍 DEBUG - IDs cargados desde BD:', {
              imx: pendingMeasurement.imx.id,
              tf: pendingMeasurement.tf.id,
              mpu: pendingMeasurement.mpu.id
            });
          } else if (measurements.length > 0) {
            if (completedMeasurements.length === measurements.length) {
              setMeasurementState('dual_done');
            } else {
              setMeasurementState('has_measurements');
            }
          } else {
            setMeasurementState('no_measurements');
          }

          // Establecer datos de configuración del último registro
          const lastIMX = imxResponse.data[imxResponse.data.length - 1];
          setData(prevData => ({
            ...prevData,
            resolution: lastIMX.resolution,
            laser_detectado: lastIMX.laser_detectado,
            event: lastIMX.event,
          }));
        } else {
          setMeasurementState('no_measurements');
          setAvailableMeasurements([]);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setMeasurementState('no_measurements');
      }
    };

    fetchSensorData();
  }, [id]);

  // WebSocket IMX477 - IGUAL QUE EN TOMAR FOTO
  useEffect(() => {
    if (websocketData?.sensor === 'IMX477') {
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

      setTimeout(() => updateRadarData(), 100);
    }
  }, [websocketData]);

  // WebSocket TF-Luna y MPU6050 - IGUAL QUE EN TOMAR FOTO
  useEffect(() => {
    if (!websocketData) return;

    const now = new Date().toLocaleTimeString();

    if (websocketData.sensor === 'TF-Luna') {
      const tf = websocketData.data;
      const distancia = typeof tf.distancia_m === 'number' ? tf.distancia_m * 100 : 0;
      const fuerza = typeof tf.fuerza_senal === 'number' ? tf.fuerza_senal : 0;
      const temperatura = typeof tf.temperatura === 'number' ? tf.temperatura : 0;

      tfDataHistoryRef.current.distancia_cm_history = [
        ...tfDataHistoryRef.current.distancia_cm_history,
        { name: now, valor: distancia }
      ].slice(-20);

      tfDataHistoryRef.current.fuerzaSenal_history = [
        ...tfDataHistoryRef.current.fuerzaSenal_history,
        { name: now, valor: fuerza }
      ].slice(-20);

      tfDataHistoryRef.current.temperatura_history = [
        ...tfDataHistoryRef.current.temperatura_history,
        { name: now, valor: temperatura }
      ].slice(-20);

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
      const { roll, pitch, apertura } = websocketData.data;
      if (typeof roll === 'number' && typeof pitch === 'number' && typeof apertura === 'number') {
        const inclinacion = roll + pitch;

        tfDataHistoryRef.current.inclinacion_history = [
          ...tfDataHistoryRef.current.inclinacion_history,
          { name: now, valor: inclinacion }
        ].slice(-20);

        tfDataHistoryRef.current.apertura_history = [
          ...tfDataHistoryRef.current.apertura_history,
          { name: now, valor: apertura }
        ].slice(-20);

        setData(prev => ({
          ...prev,
          inclinacion,
          apertura,
        }));

        setTfDataHistory({ ...tfDataHistoryRef.current });
      }
    }
  }, [websocketData]);

  useEffect(() => {
    updateRadarData();
  }, [data.calidad, data.nitidez, data.luminosidad, data.probabilidad]);

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

  // Función para mostrar opciones cuando hay mediciones existentes
  const showMeasurementOptions = async () => {
    // Filtrar solo mediciones normales (measurement_count = 1) que puedan convertirse en duales
    const normalMeasurements = availableMeasurements.filter(m => 
      m.imx.measurement_count === 1 && 
      m.tf.measurement_count === 1 && 
      m.mpu.measurement_count === 1
    );

    // Contar mediciones duales (measurement_count = 2)
    const dualMeasurements = availableMeasurements.filter(m =>
      m.imx.measurement_count === 2 && 
      m.tf.measurement_count === 2 && 
      m.mpu.measurement_count === 2
    );

    if (normalMeasurements.length === 0) {
      // No hay mediciones normales disponibles para convertir en duales
      const result = await Swal.fire({
        title: 'Opciones de Medición',
        html: `
          <p>Estado actual del proyecto:</p>
          <ul style="text-align: left; margin: 10px 0;">
            <li>📊 Mediciones duales completadas: ${dualMeasurements.length}</li>
            <li>📏 Mediciones normales pendientes: ${normalMeasurements.length}</li>
          </ul>
          <p>¿Qué deseas hacer?</p>
        `,
        imageUrl: alerticon,
        imageWidth: 150,
        imageHeight: 150,
        showCancelButton: true,
        confirmButtonText: '📊 Crear nueva medición',
        cancelButtonText: '❌ Cancelar',
        background: '#fff',
        customClass: {
          popup: 'succesful-popup',
          confirmButton: 'succesful-confirmar',
          cancelButton: 'cancel-button'
        }
      });

      return result.isConfirmed ? 'create_new' : 'cancel';
    } else {
      // Hay mediciones normales disponibles para convertir en duales
      const options = normalMeasurements.map((measurement, i) => ({
        value: measurement.index,
        text: `Medición ${i + 1} (ID: ${measurement.imx.id}) - ${new Date(measurement.imx.timestamp).toLocaleString()}`
      }));

      const { value: selectedOption } = await Swal.fire({
        title: 'Opciones de Medición',
        html: `
          <p>Estado actual del proyecto:</p>
          <ul style="text-align: left; margin: 10px 0;">
            <li>📊 Mediciones duales completadas: ${dualMeasurements.length}</li>
            <li>📏 Mediciones normales disponibles: ${normalMeasurements.length}</li>
          </ul>
          <p>¿Qué deseas hacer?</p>
        `,
        imageUrl: alerticon,
        imageWidth: 150,
        imageHeight: 150,
        input: 'radio',
        inputOptions: {
          'create_new': '📊 Crear nueva medición normal',
          ...options.reduce((acc, opt) => ({
            ...acc,
            [`convert_${opt.value}`]: `🔄 Convertir en dual: ${opt.text}`
          }), {})
        },
        inputValidator: (value) => {
          if (!value) {
            return 'Debes seleccionar una opción';
          }
        },
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
        background: '#fff',
        customClass: {
          popup: 'succesful-popup',
          confirmButton: 'succesful-confirmar',
          cancelButton: 'cancel-button'
        }
      });

      if (selectedOption) {
        if (selectedOption === 'create_new') {
          return 'create_new';
        } else if (selectedOption.startsWith('convert_')) {
          const measurementIndex = parseInt(selectedOption.replace('convert_', ''));
          const selectedMeasurement = normalMeasurements.find(m => m.index === measurementIndex);
          if (selectedMeasurement) {
            setLastMeasurementIds({
              imx: selectedMeasurement.imx.id,
              tf: selectedMeasurement.tf.id,
              mpu: selectedMeasurement.mpu.id
            });
            return 'convert_existing';
          }
        }
      }
      
      return 'cancel';
    }
  };

  const handleGuardarMedidas = async () => {
    if (!id) {
      await showErrorAlert("Error: ID del proyecto no encontrado");
      return;
    }

    showLoadingAlert(); 
    const timestamp = new Date().toISOString().replace('Z', '');

    try {
      // Si no hay mediciones, crear la primera
      if (measurementState === 'no_measurements') {
        await createFirstMeasurement(timestamp);
      }
      // Si hay mediciones existentes, preguntar qué hacer
      else if (measurementState === 'has_measurements') {
        closeLoadingAlert();
        const option = await showMeasurementOptions();
        
        if (option === 'create_new') {
          showLoadingAlert();
          await createFirstMeasurement(timestamp);
        } else if (option === 'convert_existing') {
          showLoadingAlert();
          await completeDualMeasurement(timestamp);
        } else {
          return; // Usuario canceló
        }
      }
      // Si hay una medición pendiente, completar el dual
      else if (measurementState === 'first_done') {
        await completeDualMeasurement(timestamp);
      }
      // Si ya está completo, mostrar error
      else {
        closeLoadingAlert();
        await showErrorAlert("Ya existen mediciones duales completas para este proyecto.");
      }
    } catch (error) {
      closeLoadingAlert();
      console.error('🔍 DEBUG - Error en handleGuardarMedidas:', error);
      await showErrorAlert("Error al procesar la medición: " + error.message);
    }
  };

  const createFirstMeasurement = async (timestamp) => {
    const payloadCamara = {
      id_project: parseInt(id), // Usando id directamente como id_project
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
      id_project: parseInt(id), // Usando id directamente como id_project
      distancia_cm: data.distancia ?? 0,
      distancia_m: (data.distancia ?? 0) / 100,
      fuerza_senal: fuerzaParseada,
      temperatura: data.temperatura ?? 0,
      event: true,
      timestamp,
    };

    const payloadMPU = {
      id_project: parseInt(id), // Usando id directamente como id_project
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

    console.log('🔍 DEBUG - Payloads primera medición:', {
      payloadCamara,
      payloadTF,
      payloadMPU,
      websocketData: websocketData?.data
    });

    const resIMX = await projectViewModel.handlePostSensorIMX(payloadCamara);
    const resTF = await projectViewModel.handlePostSensorTFLuna(payloadTF);
    const resMPU = await projectViewModel.handlePostSensorMPU(payloadMPU);

    closeLoadingAlert();

    console.log('🔍 DEBUG - Respuestas POST:', { resIMX, resTF, resMPU });

    if (resIMX.success && resTF.success && resMPU.success) {
      setLastMeasurementIds({
        imx: resIMX.data?.id,
        tf: resTF.data?.id,
        mpu: resMPU.data?.id
      });
      
      setMeasurementState('first_done');
      await showSuccessAlert("Primera medición guardada exitosamente.");
      
      showDualMessageWithTimeout('flip_camera', 1000);
    } else {
      await showErrorAlert("Error al guardar la primera medición.");
    }
  };

  const completeDualMeasurement = async (timestamp) => {
    // ✅ VALIDACIÓN CRÍTICA: Verificar que tenemos los IDs antes de proceder
    if (!lastMeasurementIds.imx || !lastMeasurementIds.tf || !lastMeasurementIds.mpu) {
      console.error('❌ ERROR - IDs de medición no disponibles:', lastMeasurementIds);
      await showErrorAlert("Error: No se encontraron los IDs de la primera medición.");
      return;
    }

    console.log('🔍 DEBUG - IDs para completar dual:', lastMeasurementIds);

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

    console.log('🔍 DEBUG - Payloads segunda medición:', {
      payloadCamara,
      payloadTF,
      payloadMPU,
      lastMeasurementIds
    });

    // ✅ CORRECCIÓN: Usar los IDs específicos de cada sensor para las llamadas PUT
    const resIMX = await projectViewModel.handleUpdateDualSensorIMX(lastMeasurementIds.imx, payloadCamara);
    const resTF = await projectViewModel.handleUpdateDualSensorTFLuna(lastMeasurementIds.tf, payloadTF);
    const resMPU = await projectViewModel.handleUpdateDualSensorMPU(lastMeasurementIds.mpu, payloadMPU);

    closeLoadingAlert();

    console.log('🔍 DEBUG - Respuestas PUT:', { resIMX, resTF, resMPU });

    if (resIMX.success && resTF.success && resMPU.success) {
      setMeasurementState('dual_done');
      await showSuccessAlert("Medición dual completada exitosamente.");
      
      showDualMessageWithTimeout('dual_complete', 1000);
    } else {
      await showErrorAlert("Error al completar la medición dual.");
    }
  };

  const getButtonText = () => {
    switch (measurementState) {
      case 'no_measurements':
        return '📊 Realizar primera medición';
      case 'has_measurements':
        return '🔄 Gestionar mediciones';
      case 'first_done':
        return '🔄 Completar medición dual';
      case 'dual_done':
        return '✅ Todas las mediciones completadas';
      default:
        return '📊 Realizar medición';
    }
  };

  const getButtonClass = () => {
    switch (measurementState) {
      case 'dual_done':
        return 'guardar-medidas-btn completed';
      case 'first_done':
        return 'guardar-medidas-btn dual-ready';
      default:
        return 'guardar-medidas-btn';
    }
  };

  const getProgressSteps = () => {
    if (measurementState === 'no_measurements') {
      return (
        <div className="measurement-progress">
          <div className="progress-step active">Crear primera medición</div>
          <div className="progress-arrow">→</div>
          <div className="progress-step">Medición dual</div>
        </div>
      );
    } else if (measurementState === 'has_measurements') {
      return (
        <div className="measurement-progress">
          <div className="progress-step completed">Mediciones existentes ({availableMeasurements.length})</div>
          <div className="progress-arrow">→</div>
          <div className="progress-step active">Gestionar</div>
        </div>
      );
    } else if (measurementState === 'first_done') {
      return (
        <div className="measurement-progress">
          <div className="progress-step completed">Primera medición</div>
          <div className="progress-arrow">→</div>
          <div className="progress-step active">Medición dual</div>
        </div>
      );
    } else {
      return (
        <div className="measurement-progress">
          <div className="progress-step completed">Primera medición</div>
          <div className="progress-arrow">→</div>
          <div className="progress-step completed">Medición dual</div>
        </div>
      );
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
        <h2>Gráfica del sensor de cámara y fiabilidad de datos (Tiempo Real)</h2>
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
                animationDuration={300}
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
          <button 
            className={getButtonClass()}
            onClick={handleGuardarMedidas}
            disabled={measurementState === 'dual_done'}
          >
            {getButtonText()}
          </button>
          
          {getProgressSteps()}
        </div>
      </div>

      <div className="TFGraphsContainer">
        <h2>Gráficas del sensor TF-Luna (Tiempo Real)</h2>

        <div style={{ width: '100%', height: 350, marginBottom: 50 }}>
          <h4>Distancia (cm) - Actualización en Tiempo Real</h4>
          <ResponsiveContainer>
            <LineChart data={tfDataHistory.distancia_cm_history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="cm" />
              <Tooltip formatter={(value) => [`${value.toFixed(2)} cm`, 'Distancia']} />
              <Line 
                type="monotone" 
                dataKey="valor" 
                stroke="#E6AF2E" 
                strokeWidth={2} 
                dot={false}
                animationDuration={200}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ width: '100%', height: 350, marginBottom: 50 }}>
          <h4>Fuerza de Señal - Actualización en Tiempo Real</h4>
          <ResponsiveContainer>
            <LineChart data={tfDataHistory.fuerzaSenal_history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value.toFixed(2)} (${evaluarFuerzaSenal(value)})`, 'Fuerza']} />
              <Line 
                type="monotone" 
                dataKey="valor" 
                stroke="#E6AF2E" 
                strokeWidth={2} 
                dot={false}
                animationDuration={200}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ width: '100%', height: 350, marginBottom: 50 }}>
          <h4>Temperatura (°C) - Actualización en Tiempo Real</h4>
          <ResponsiveContainer>
            <LineChart data={tfDataHistory.temperatura_history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="°C" />
              <Tooltip formatter={(value) => [`${value.toFixed(2)} °C`, 'Temperatura']} />
              <Line 
                type="monotone" 
                dataKey="valor" 
                stroke="#E6AF2E" 
                strokeWidth={2} 
                dot={false}
                animationDuration={200}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="MPUGraphsContainer">
        <h2>Gráficas del sensor MPU (Tiempo Real)</h2>

        <div style={{ width: '100%', height: 350, marginBottom: 50 }}>
          <h4>Inclinación (°) - Actualización en Tiempo Real</h4>
          <ResponsiveContainer>
            <LineChart data={tfDataHistory.inclinacion_history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="°" />
              <Tooltip formatter={(value) => [`${value.toFixed(2)} °`, 'Inclinación']} />
              <Line 
                type="monotone" 
                dataKey="valor" 
                stroke="#E6AF2E" 
                strokeWidth={2} 
                dot={false}
                animationDuration={200}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ width: '100%', height: 350, marginBottom: 50 }}>
          <h4>Apertura (°) - Actualización en Tiempo Real</h4>
          <ResponsiveContainer>
            <LineChart data={tfDataHistory.apertura_history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="°" />
              <Tooltip formatter={(value) => [`${value.toFixed(2)} °`, 'Apertura']} />
              <Line 
                type="monotone" 
                dataKey="valor" 
                stroke="#E6AF2E" 
                strokeWidth={2} 
                dot={false}
                animationDuration={200}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default MedirTerrenoDual;