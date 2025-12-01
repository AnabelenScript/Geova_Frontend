import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { projectViewModel } from '../../viewmodels/ProjectViewModel';
import { projectService } from '../../services/ProjectService';
import { showCautionAlert } from '../../utils/alerts';

function GraphViewer({ onDataStatusChange }) {
  const { id } = useParams();
  const [dataIMX, setDataIMX] = useState([]);
  const [dataTF, setDataTF] = useState([]);
  const [dataMPU, setDataMPU] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const evaluarFPS = useCallback((fps) => {
    if (fps >= 24) return ' (Buena)';
    if (fps >= 15) return ' (Media)';
    return ' (Mala)';
  }, []);

  const evaluarFuerzaSenal = useCallback((valor) => {
    if (valor >= 10000) return 'Muy buena';
    if (valor >= 4000) return 'Buena';
    if (valor >= 2000) return 'Aceptable';
    if (valor >= 1000) return 'Baja';
    return 'Muy baja';
  }, []);

  const normalizarLuminosidad = useCallback((lum) => Math.min((lum / 255) * 100, 100), []);
  const normalizarNitidez = useCallback((nit) => Math.min((nit / 500) * 100, 100), []);

  useEffect(() => {
    const dataExists = dataIMX.length > 0 || dataTF.length > 0 || dataMPU.length > 0;
    
    if (onDataStatusChange) {
      onDataStatusChange(dataExists);
    }
  }, [dataIMX.length, dataTF.length, dataMPU.length, onDataStatusChange]);


  const formatDate = useCallback((fecha) => {
    const date = new Date(fecha);
    return isNaN(date.getTime()) ? 'Fecha inválida' : date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);
  const IMXRadarCard = React.memo(({ data, index }) => {
    const radarData = useMemo(() => [
      {
        atributo: 'Calidad',
        valor: Number((data.calidad_frame * 100).toFixed(2)),
        evaluacion: evaluarFPS(data.calidad_frame * 30),
      },
      {
        atributo: 'Nitidez',
        valor: Number(normalizarNitidez(data.nitidez_score).toFixed(2)),
      },
      {
        atributo: 'Luminosidad',
        valor: Number(normalizarLuminosidad(data.luminosidad_promedio).toFixed(2)),
      },
      {
        atributo: 'Confiabilidad',
        valor: Number((data.probabilidad_confiabilidad).toFixed(2)),
      },
    ], [data]);

    const formattedDate = useMemo(() => 
      formatDate(data.fecha || data.timestamp), 
      [data.fecha, data.timestamp]
    );

    return (
      <div className="GraphCard">
        <div className="GraphCardHeader">
          <h4 className="GraphCardTitle">Medición #{index + 1}</h4>
          <span className="GraphCardDate">{formattedDate}</span>
        </div>
        <div className="GraphCardContent">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="atributo" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="Valores"
                dataKey="valor"
                stroke="black"
                fill="#E6AF2E"
                fillOpacity={0.6}
              />
              <Tooltip formatter={(value, name, props) => {
                const atributo = props?.payload?.atributo;
                const evaluacion = props?.payload?.evaluacion || '';
                return [`${value} %${evaluacion}`, atributo];
              }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  });

  useEffect(() => {
    if (!dataFetched) {
      async function fetchData() {
        setLoading(true);
        try {
          // Primero verificar si la Raspberry Pi está conectada
          const isLocalAPIAvailable = await projectService.checkLocalAPIAvailability();
          
          if (!isLocalAPIAvailable) {
            // Mostrar una sola alerta de que la Raspberry está desconectada
            await showCautionAlert(
              'Raspberry Pi desconectada',
              'No se pueden cargar los datos de sensores porque la Raspberry Pi no está conectada.'
            );
            setDataFetched(true);
            setLoading(false);
            return;
          }

          const imx = await projectViewModel.handleGetSensorIMXByProjectId(id);
          const tf = await projectViewModel.handleGetSensorTFLunaByProjectId(id);
          const mpu = await projectViewModel.handleGetSensorMPUByProjectId(id);

          if (imx.success && imx.data.length > 0) {
            setDataIMX(imx.data);
          }
          if (tf.success && tf.data.length > 0) {
            setDataTF(tf.data);
          }
          if (mpu.success && mpu.data.length > 0) {
            setDataMPU(mpu.data);
          }
          
          setDataFetched(true);
        } catch (error) {
          console.error('Error obteniendo datos de sensores:', error);
        } finally {
          setLoading(false);
        }
      }

      fetchData();
    }
  }, [id, dataFetched]);

  useEffect(() => {
    setDataFetched(false);
    setDataIMX([]);
    setDataTF([]);
    setDataMPU([]);
  }, [id]);

  const hasData = useMemo(() => 
      dataIMX.length > 0 || dataTF.length > 0 || dataMPU.length > 0, 
      [dataIMX.length, dataTF.length, dataMPU.length]
    );

  const imxSection = useMemo(() => {
    if (dataIMX.length === 0) return null;
    
    return (
      <div className="SensorSection">
        <div className="GraphHeaderContainer">
          <h2>Sensor IMX - Calidad, Nitidez y Confiabilidad</h2>
          <div className="graph-count">{dataIMX.length} mediciones</div>
        </div>
        <div className="GraphScrollContainer">
          <div className="GraphScrollContent">
            {dataIMX.map((data, index) => (
              <IMXRadarCard key={`imx-${index}-${data.id || index}`} data={data} index={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }, [dataIMX]);

  if (loading) {
    return (
      <div className="GraphContainerChild" style={{color: '#666'}}>
        <div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>⏳</div>
          Cargando datos de sensores...
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="GraphContainerChild">
        <div style={{ fontSize: '48px', marginBottom: '20px' }}></div>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>No hay mediciones registradas</h3>
        <p style={{ margin: '0', color: '#666' }}>
          Realiza una medición desde el módulo de captura para ver las gráficas aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="GraphContainerChild">
      {imxSection}
    </div>
  );
}

export default GraphViewer;