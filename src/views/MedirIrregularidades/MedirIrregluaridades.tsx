import './MedirIrre.css';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

function MedirIrregularidades() {
  const data = [
    { punto: 1, altura: 20 },
    { punto: 2, altura: 25 },
    { punto: 3, altura: 22 },
    { punto: 4, altura: 30 },
    { punto: 5, altura: 28 },
    { punto: 6, altura: 35 },
    { punto: 7, altura: 33 },
    { punto: 8, altura: 38 },
  ];

  return (
    <div className='MedicionIrregularidades'>
      <div className="IrreGraphContainer">
        <div className="corner-top-right"></div>
        <div className="corner-bottom-left"></div>
        <div className='MainGraphContainer'>
            <h2>
            Irregularidad del terreno
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="punto" label={{ value: 'Punto', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Altura (m)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Line type="monotone" dataKey="altura" stroke="#82ca9d" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default MedirIrregularidades;
