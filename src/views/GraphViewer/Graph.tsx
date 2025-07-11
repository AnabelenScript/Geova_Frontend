import React, { useEffect, useState } from 'react';
import { graphViewModel } from '../../viewmodels/graphViewModel';
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

type ChartDatum = {
  name: string;
  value: number;
};

type GraphData = {
  title: string;
  description?: string;
  type: 'bar' | 'line';
  data?: ChartDatum[];
};

const colors = ['#E6AF2E', '#E6AF2E', '#ffc658'];

const convertIMX477Data = (data: any): ChartDatum[] => [
  { name: 'Nitidez', value: data.nitidez_score },
  { name: 'Luminosidad', value: data.luminosidad_promedio },
  { name: 'Calidad', value: data.calidad_frame * 100 },
];

const convertTFLunaData = (data: any): ChartDatum[] => [
  { name: 'Distancia (cm)', value: data.distancia_cm },
];

const GraphCard = ({ graph }: { graph: GraphData }) => {
  const { title, description, data, type } = graph;

  return (
    <div className="GraphCard" style={{ marginBottom: 30}}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      <div style={{ width: '100%', height: 250 , marginBottom: 50}}>
        <ResponsiveContainer>
          {type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill={colors[0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 'auto']} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke={colors[1]} strokeWidth={2} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const GraphViewer: React.FC = () => {
  const { data, isConnected } = graphViewModel.useGraphData();
  const [sensorData, setSensorData] = useState<{ [key: string]: any }>({});
  const [history, setHistory] = useState<{
    luminosidad: ChartDatum[],
    calidad: ChartDatum[],
    nitidez: ChartDatum[],
    distancia: ChartDatum[],
  }>({
    luminosidad: [],
    calidad: [],
    nitidez: [],
    distancia: [],
  });

  useEffect(() => {
    if (data?.sensor && data.data) {
      setSensorData(prev => ({ ...prev, [data.sensor]: data.data }));
      if (data.sensor === 'IMX477') {
        setHistory(prev => ({
          ...prev,
          luminosidad: [...prev.luminosidad, {
            name: new Date().toLocaleTimeString(),
            value: data.data.luminosidad_promedio
          }].slice(-20),

          calidad: [...prev.calidad, {
            name: new Date().toLocaleTimeString(),
            value: data.data.calidad_frame * 100
          }].slice(-20),

          nitidez: [...prev.nitidez, {
            name: new Date().toLocaleTimeString(),
            value: data.data.nitidez_score
          }].slice(-20),
        }));
      }

      if (data.sensor === 'TF-Luna') {
        setHistory(prev => ({
          ...prev,
          distancia: [...prev.distancia, {
            name: new Date().toLocaleTimeString(),
            value: data.data.distancia_m * 100 
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
      description: 'Evolución en tiempo real de la distancia (máximo 10m)',
      type: 'line',
      data: history.distancia
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
