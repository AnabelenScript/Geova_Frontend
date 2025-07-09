import './CreateProject.css';
import { useState } from 'react';
import { projectViewModel } from '../../viewmodels/ProjectViewModel';
import Swal from 'sweetalert2';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function LocationMarker({ setLat, setLng }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setLat(e.latlng.lat);
      setLng(e.latlng.lng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

function CreateProject() {
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImgPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!nombreProyecto || !categoria || !descripcion || !imgFile || lat == null || lng == null) {
      Swal.fire('Error', 'Todos los campos son obligatorios, incluyendo imagen y ubicación', 'warning');
      return;
    }

    const { success, error } = await projectViewModel.handleCreateProject(
      nombreProyecto,
      categoria,
      descripcion,
      imgFile,
      lat,
      lng
    );

    if (success) {
      Swal.fire('Éxito', 'Proyecto creado exitosamente', 'success');
      setNombreProyecto('');
      setCategoria('');
      setDescripcion('');
      setImgFile(null);
      setImgPreview('');
      setLat(null);
      setLng(null);
    } else {
      Swal.fire('Error', error, 'error');
    }
  };

  return (
    <div className="CreateContainer">
      <div className="CreateTitleContainer">
        <div className="CreateTitle">
          <h1>Crear proyecto</h1>
          <i className="bx bxs-add-to-queue"></i>
        </div>
        <div className="CreateEndContainer"></div>
      </div>

      <div className="CreateInfoContainer">
        <div className="Info">
          <div className='CreateInfo1'>
            <label htmlFor="imgUpload" className='AddButton'>
                <p>Agregar Imagen</p>
              {imgPreview ? (
                <img src={imgPreview} alt="preview" className="PreviewImage" />
              ) : (
                '+'
              )}
            </label>
            <input type="file" id="imgUpload" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </div>

          <div className="CreateInfo2">
            <div className="CreateLabels">
              <div className="labels">
                <label>Nombre del proyecto</label>
                <input
                  type="text"
                  value={nombreProyecto}
                  onChange={(e) => setNombreProyecto(e.target.value)}
                />
              </div>
              <div className="labels">
                <label>Categoría</label>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  <option value="">Seleccione</option>
                  <option value="Residencial">Residencial</option>
                  <option value="Comercial">Comercial</option>
                </select>
              </div>
            </div>

            <div className="CreateArea">
              <label>Descripción</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="CreateMapContainer">
          <label>Seleccione la ubicación en el mapa</label>
          <div className="Map">
            <MapContainer center={[23.6345, -102.5528]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker setLat={setLat} setLng={setLng} />
            </MapContainer>
          </div>
          <div className="buttonsContainer">
            <button className="CancelButton" onClick={() => window.history.back()}>
              Cancelar
            </button>
            <button className="CreateButton" onClick={handleCreate}>
              Crear proyecto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateProject;
