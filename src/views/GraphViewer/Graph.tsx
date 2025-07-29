import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';
import { projectViewModel } from '../../viewmodels/ProjectViewModel';

function GraphViewer() {
  const { id } = useParams();
  const [dataIMX, setDataIMX] = useState(null);
  const [dataTF, setDataTF] = useState(null);
  const [dataMPU, setDataMPU] = useState(null);

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
    async function fetchData() {
      try {
        const imx = await projectViewModel.handleGetSensorIMXByProjectId(id);
        const tf = await projectViewModel.handleGetSensorTFLunaByProjectId(id);
        const mpu = await projectViewModel.handleGetSensorMPUByProjectId(id);

        if (imx.success && imx.data.length > 0) {
          setDataIMX(imx.data[imx.data.length - 1]);
        }
        if (tf.success && tf.data.length > 0) {
          setDataTF(tf.data[tf.data.length - 1]);
        }
        if (mpu.success && mpu.data.length > 0) {
          setDataMPU(mpu.data[mpu.data.length - 1]);
        }
      } catch (error) {
        console.error('Error obteniendo datos de sensores:', error);
      }
    }

    fetchData();
  }, [id]);

  const radarData = dataIMX ? [
    {
      atributo: 'Calidad',
      valor: Number((dataIMX.calidad_frame * 100).toFixed(2)),
      evaluacion: evaluarFPS(dataIMX.calidad_frame * 30),
    },
    {
      atributo: 'Nitidez',
      valor: Number(normalizarNitidez(dataIMX.nitidez_score).toFixed(2)),
    },
    {
      atributo: 'Luminosidad',
      valor: Number(normalizarLuminosidad(dataIMX.luminosidad_promedio).toFixed(2)),
    },
    {
      atributo: 'Confiabilidad',
      valor: Number((dataIMX.probabilidad_confiabilidad).toFixed(2)),
    },
  ] : [];

  const distanceData = dataTF ? [{
    name: 'Último',
    valor: dataTF.distancia_cm,
  }] : [];

  const fuerzaData = dataTF ? [{
    name: 'Último',
    valor: dataTF.fuerza_senal,
  }] : [];

  const tempData = dataTF ? [{
    name: 'Último',
    valor: dataTF.temperatura,
  }] : [];

  const inclinacion = dataMPU ? (dataMPU.roll + dataMPU.pitch) : 0;
  const inclinacionData = [{
    name: 'Último',
    valor: inclinacion,
  }];

  const aperturaData = dataMPU ? [{
    name: 'Último',
    valor: dataMPU.apertura,
  }] : [];

  return (
    <div className="GraphContainer">
      {radarData.length > 0 && (
        <>
          <h3>Calidad, nitidez y confiabilidad</h3>
          <ResponsiveContainer width="100%" height={400}>
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
        </>
      )}

      <div style={{ marginTop: '40px' }}>
        <h3>Distancia (cm)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={distanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis unit="cm" />
            <Tooltip formatter={(value) => [`${value?.toFixed(2)} cm`, 'Distancia']} />
            <Line type="monotone" dataKey="valor" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h3>Fuerza de Señal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={fuerzaData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value?.toFixed(2)} (${evaluarFuerzaSenal(value)})`, 'Fuerza']} />
            <Line type="monotone" dataKey="valor" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h3>Temperatura (°C)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tempData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis unit="°C" />
            <Tooltip formatter={(value) => [`${value?.toFixed(2)} °C`, 'Temperatura']} />
            <Line type="monotone" dataKey="valor" stroke="#ff7300" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h3>Inclinación (°)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={inclinacionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis unit="°" />
            <Tooltip formatter={(value) => [`${value?.toFixed(2)} °`, 'Inclinación']} />
            <Line type="monotone" dataKey="valor" stroke="#2e86de" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h3>Apertura (°)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={aperturaData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis unit="°" />
            <Tooltip formatter={(value) => [`${value?.toFixed(2)} °`, 'Apertura']} />
            <Line type="monotone" dataKey="valor" stroke="#1abc9c" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default GraphViewer;
