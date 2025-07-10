import React, { useEffect } from 'react';
import { graphViewModel } from '../../viewmodels/graphViewModel';
import {
  BarChart, Bar,
  PieChart, Pie, Cell,
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
  data?: ChartDatum[];
};

const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'];

const GraphCard = ({ graph }: { graph: GraphData }) => {
  const { title, description, data } = graph;

  const chartData: ChartDatum[] = data && data.length > 0
    ? data
    : [
        { name: 'A', value: 400 },
        { name: 'B', value: 300 },
        { name: 'C', value: 300 },
        { name: 'D', value: 200 },
      ];

  const isPie = title.toLowerCase().includes('pastel') || title.toLowerCase().includes('pie');

  return (
    <div className="GraphCard">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          {isPie ? (
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const GraphViewer: React.FC = () => {
  const { data, isConnected } = graphViewModel.useGraphData();

  useEffect(() => {
    if (data) {
      console.log('📡 Nueva data recibida:', data);
    }
  }, [data]);

  const graph: GraphData = {
    title: 'Gráfica en tiempo real',
    description: 'Datos recibidos por WebSocket',
    data,
  };

  return (
    <div>
      {data ? (
        <GraphCard graph={graph} />
      ) : (
        <p>Esperando datos del sensor...</p>
      )}
    </div>
  );
};

export default GraphViewer;
