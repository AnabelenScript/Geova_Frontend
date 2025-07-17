import React, { useEffect, useState } from 'react';
import { graphViewModel } from '../../viewmodels/graphViewModel';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

type ChartDatum = {
  name: string;
  value: number;
};

type GraphData = {
  title: string;
  description?: string;
  type: 'bar' | 'line';
  data?: ChartDatum[] | any;
};

const colors = ['#D68C0D'];

const getUnitByKey = (key: string): string => {
  if (key.includes('distancia')) return 'cm';
  if (key.includes('calidad')) return 'FPS';
  if (key.includes('luminosidad')) return 'lux';
  if (key.includes('nitidez')) return '%';
  if (key.includes('apertura')) return '°'; 
  if (key.includes('inclinacion')) return '°'; 
  return 'valor';
};

const convertIMX477Data = (data: any): any[] => [
  {
    name: 'Sensor IMX477',
    nitidez_score: data.nitidez_score,
    luminosidad_promedio: data.luminosidad_promedio,
    calidad_frame: data.calidad_frame * 100,
  }
];

const GraphCard = ({ graph }: { graph: GraphData }) => {
  const { title, description, data, type } = graph;

  const isBarWithMultipleKeys =
    type === 'bar' &&
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === 'object' &&
    Object.keys(data[0]).length > 2;

  const barKeys = isBarWithMultipleKeys
    ? Object.keys(data[0]).filter(k => k !== 'name')
    : [];

  return (
    <div className="GraphCard" style={{ marginBottom: 30 }}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      <div style={{ width: '100%', height: 250, marginBottom: 50 }}>
        <ResponsiveContainer>
          {type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)} ${getUnitByKey(name.toLowerCase())}`,
                  name.replace(/_/g, ' ')
                ]}
              />
              <Legend />
              {isBarWithMultipleKeys ? (
                barKeys.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={colors[0]} 
                    name={key.replace(/_/g, ' ')}
                  />
                ))
              ) : (
                <Bar dataKey="value" fill={colors[0]} /> 
              )}
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 'auto']} />
              <Tooltip
                formatter={(value: number) => {
                  const unit = getUnitByKey(title.toLowerCase());
                  return [`${value.toFixed(2)} ${unit}`, title];
                }}
              />
              <Legend
                formatter={() => {
                  const unit = getUnitByKey(title.toLowerCase());
                  return `${title} (${unit})`;
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors[0]} 
                strokeWidth={2}
                dot={false}
                name={`${title}`}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const GraphViewer: React.FC = () => {
  const { data } = graphViewModel.useGraphData();
  const [sensorData, setSensorData] = useState<{ [key: string]: any }>({});
  const [history, setHistory] = useState<{
    luminosidad: ChartDatum[];
    calidad: ChartDatum[];
    nitidez: ChartDatum[];
    distancia: ChartDatum[];
    inclinacion: ChartDatum[];
    apertura: ChartDatum[];
  }>({
    luminosidad: [],
    calidad: [],
    nitidez: [],
    distancia: [],
    inclinacion: [],
    apertura: [],
  });

  useEffect(() => {
    if (data?.sensor && data.data) {
      setSensorData(prev => ({ ...prev, [data.sensor]: data.data }));

      const now = new Date().toLocaleTimeString();

      if (data.sensor === 'IMX477') {
        setHistory(prev => ({
          ...prev,
          luminosidad: [...prev.luminosidad, {
            name: now,
            value: data.data.luminosidad_promedio
          }].slice(-20),

          calidad: [...prev.calidad, {
            name: now,
            value: data.data.calidad_frame * 100
          }].slice(-20),

          nitidez: [...prev.nitidez, {
            name: now,
            value: data.data.nitidez_score
          }].slice(-20),
        }));
      }

      if (data.sensor === 'TF-Luna') {
        setHistory(prev => ({
          ...prev,
          distancia: [...prev.distancia, {
            name: now,
            value: data.data.distancia_m * 100
          }].slice(-20),
        }));
      }

      if (data.sensor === 'MPU6050') {
        setHistory(prev => ({
          ...prev,
          inclinacion: [...prev.inclinacion, {
            name: now,
            value: data.data.roll + data.data.pitch 
          }].slice(-20),
          apertura: [...prev.apertura, {
            name: now,
            value: data.data.apertura
          }].slice(-20),
        }));
      }
    }
  }, [data]);

  const graphs: GraphData[] = [];

  if (sensorData["IMX477"]) {
    graphs.push({
      title: 'Sensor IMX477 - Nitidez, Luminosidad y Calidad',
      description: 'Datos en tiempo real del sensor de cámara',
      type: 'bar',
      data: convertIMX477Data(sensorData["IMX477"])
    });
  }

  if (history.luminosidad.length > 0) {
    graphs.push({
      title: 'Luminosidad',
      description: 'Evolución en tiempo real de la luminosidad',
      type: 'line',
      data: history.luminosidad
    });
  }

  if (history.calidad.length > 0) {
    graphs.push({
      title: 'Calidad',
      description: 'Evolución en tiempo real de la calidad de la imagen',
      type: 'line',
      data: history.calidad
    });
  }

  if (history.nitidez.length > 0) {
    graphs.push({
      title: 'Nitidez',
      description: 'Evolución en tiempo real de la nitidez',
      type: 'line',
      data: history.nitidez
    });
  }

  if (history.distancia.length > 0) {
    graphs.push({
      title: 'TF-Luna - Distancia',
      description: 'Evolución en tiempo real de la distancia',
      type: 'line',
      data: history.distancia
    });
  }

  if (history.inclinacion.length > 0) {
    graphs.push({
      title: 'Inclinación (Roll + Pitch)',
      description: 'Nivelación del sensor con respecto al nivel del suelo (medido en grados)',
      type: 'line',
      data: history.inclinacion
    });
  }

  if (history.apertura.length > 0) {
    graphs.push({
      title: 'Apertura',
      description: 'Rango de visión del sensor en grados',
      type: 'line',
      data: history.apertura
    });
  }

  return (
    <div>
      {graphs.length > 0 ? (
        graphs.map((graph, index) => (
          <GraphCard key={index} graph={graph} />
        ))
      ) : (
        <p>Esperando datos de sensores...</p>
      )}
    </div>
  );
};

export default GraphViewer;
