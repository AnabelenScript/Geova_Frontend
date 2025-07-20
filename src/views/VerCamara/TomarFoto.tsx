import React, { useEffect, useState } from 'react';
import { graphViewModel } from '../../viewmodels/graphViewModel';
import './TomarFoto.css';

function TomarFoto() {
  const [data, setData] = useState({
    calidad: null,
    nitidez: null,
    luminosidad: null,
    inclinacion: null,
    distancia: null,
    fuerzaSenal: null,
    apertura: null
  });

  const { data: websocketData, isConnected } = graphViewModel.useGraphData(); 

  useEffect(() => {
    if (websocketData) {
      const { sensor, data: sensorData } = websocketData;

      if (sensor === 'IMX477') {
        setData(prevData => ({
          ...prevData,
          luminosidad: sensorData.luminosidad_promedio,
          calidad: sensorData.calidad_frame * 100, 
          nitidez: sensorData.nitidez_score
        }));
      }

      if (sensor === 'TF-Luna') {
        setData(prevData => ({
          ...prevData,
          distancia: sensorData.distancia_m * 100, 
        }));
      }

      if (sensor === 'MPU6050') {
        setData(prevData => ({
          ...prevData,
          inclinacion: sensorData.roll + sensorData.pitch, 
          apertura: sensorData.apertura,
          fuerzaSenal: sensorData.event ? "Fuerza alta" : "Fuerza baja"
        }));
      }
    }
  }, [websocketData]);

  return (
    <div className="ProjectPContainer">
      <div className='ProjectData'>
        <label htmlFor="Calidad"><i className='bx bx-camera'></i> <br />Calidad</label>
        <span id="Calidad">{data.calidad ? `${data.calidad.toFixed(2)} FPS` : "Cargando..."}</span>
        <label htmlFor="Nitidez"><i className='bx bx-camera'></i><br /> Nitidez</label>
        <span id="Nitidez">{data.nitidez ? `${data.nitidez.toFixed(2)} %` : "Cargando..."}</span>
        <label htmlFor="Luminosidad"><i className='bx bx-camera'></i> <br />Luminosidad</label>
        <span id="Luminosidad">{data.luminosidad ? `${data.luminosidad.toFixed(2)} lux` : "Cargando..."}</span>
      </div>
      <div className="ProjectphotoContainer">
        <div className="corner-top-right"></div>
        <div className="corner-bottom-left"></div>
        <div className='MainphotoContainer'>
          <h1>Mueva la cámara hasta enfocar correctamente</h1>
          <div className='Takephotobutton'>
            <button className='TakeButton'></button>
          </div>
        </div>
      </div>
      <div className='ProjectData'>
        <label htmlFor="Distancia"><i className='bx bx-ruler'></i> <br />Distancia</label>
        <span id="Distancia">{data.distancia ? `${data.distancia.toFixed(2)} cm` : "Cargando..."}</span>
        <label htmlFor="FuerzaSenal"><i className='bx bx-ruler'></i> <br />Fuerza señal</label>
        <span id="FuerzaSenal">{data.fuerzaSenal || "Cargando..."}</span>
        <label htmlFor="Apertura"><i className='bx bx-shape-triangle'></i>  <br />Apertura</label>
        <span id="Apertura">{data.apertura ? `${data.apertura.toFixed(2)} °` : "Cargando..."}</span>
        <label htmlFor="Inclinación"><i className='bx bx-shape-triangle'></i> <br /> Inclinación</label>
        <span id="Inclinación">{data.inclinacion ? `${data.inclinacion.toFixed(2)} °` : "Cargando..."}</span>
      </div>
    </div>
  );
}

export default TomarFoto;
