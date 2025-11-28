import './DetallesyGraficas.css';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectViewModel } from '../../viewmodels/ProjectViewModel';
import { projectService } from '../../services/ProjectService';
import { graphViewModel } from '../../viewmodels/GraphViewModel';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import GraphViewer from '../GraphViewer/Graph';

function LocationMarkerEdit({ setLat, setLng }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setLat(e.latlng.lat);
      setLng(e.latlng.lng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

function DetallesProyecto() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLocalAPIAvailable, setIsLocalAPIAvailable] = useState(false);
  const [checkingLocalAPI, setCheckingLocalAPI] = useState(true);
  const navigate = useNavigate();
  const { data: graphs } = graphViewModel.useGraphData();

  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState({
    nombreProyecto: '',
    categoria: '',
    descripcion: '',
    lat: null,
    lng: null,
    imgFile: null
  });

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      const { success, data, error } = await projectViewModel.handleGetProjectById(Number(id));
      if (success) {
        setProject(data);
      } else {
        console.error("Error al obtener proyecto:", error);
      }
      setLoading(false);
    };

    const checkLocalAPI = async () => {
      setCheckingLocalAPI(true);
      const isAvailable = await projectService.checkLocalAPIAvailability();
      setIsLocalAPIAvailable(isAvailable);
      setCheckingLocalAPI(false);
    };

    fetchProject();
    checkLocalAPI();
  }, [id]);

  const Handlecamera = () => {
    projectViewModel.handleCamera(navigate);
  };

  const Handlecameradual = () => {
    projectViewModel.handleCameraDual(navigate);
  };

  const handleIrregularidades = () => {
    if (project?.Id) {
      projectViewModel.handleIrregularidades(navigate, project.Id);
    }
  };

  const formatDate = (fecha) => {
    const date = new Date(fecha);
    return isNaN(date.getTime()) ? 'Fecha inválida' : date.toLocaleDateString();
  };

  const openEditModal = () => {
    if (!project) return;
    setEditData({
      nombreProyecto: project.NombreProyecto,
      categoria: project.Categoria,
      descripcion: project.Descripcion,
      lat: project.Lat || null,
      lng: project.Lng || null,
      imgFile: null
    });
    setShowModal(true);
  };

  const handleEditSubmit = async () => {
    if (!id) {
      alert('ID del proyecto no disponible.');
      return;
    }

    const { nombreProyecto, categoria, descripcion, lat, lng, imgFile } = editData;

    try {
      const { success, error } = await projectViewModel.handleUpdateProject(
        Number(id),
        nombreProyecto,
        categoria,
        descripcion,
        imgFile,
        lat,
        lng
      );

      if (success) {
        setShowModal(false);
        const { data } = await projectViewModel.handleGetProjectById(Number(id));
        setProject(data);
      } else {
        console.error('Error al actualizar:', error);
        alert('Error al actualizar: ' + error);
      }
    } catch (e) {
      console.error('Error inesperado:', e);
      alert('Error inesperado al actualizar el proyecto');
    }
  };

  const handleDeleteProject = async () => {
    if (!project?.Id) return;
    await projectViewModel.handleDeleteProject(project.Id, navigate);
  };

  return (
    <div className="DetallesContainer">
      <div className="DetallesTitleContainer">
        <div className="DetallesTitle">
          <h1>
            {loading ? 'Cargando...' : project?.NombreProyecto || 'Proyecto no encontrado'}
          </h1>
          <i className="bx bxs-add-to-queue"></i>
        </div>
        <div className="DetallesEndContainer">
          {/* Indicador de estado de la API local */}
          <div className={`api-status ${checkingLocalAPI ? 'checking' : isLocalAPIAvailable ? 'available' : 'unavailable'}`}>
            {checkingLocalAPI ? (
              <span>🔄 Verificando conexión...</span>
            ) : isLocalAPIAvailable ? (
              <span>Raspberry Pi conectada</span>
            ) : (
              <span>Raspberry Pi desconectada</span>
            )}
          </div>
        </div>
      </div>

      <div className="DashSubtitle">
        <div className="DashSub1">
        </div>
      </div>

      <div className="ProjectphotoDetail">
        <div className="PhotoContainer">
          {project?.Img ? (
            <img src={project.Img} alt="Proyecto" className="ProjectImage" />
          ) : (
            <p>No se ha cargado imagen para este proyecto</p>
          )}
        </div>
      </div>

      <div className="categorycontainer">
        <p>{project?.Categoria || 'Categoría'}</p>
      </div>

      <div className="DetailOptions">
        <div className='SubtitleContainer'>
          <h2>Información</h2>
          <div className='ProjectOptions'>
              <div className='editproject' onClick={openEditModal}>
                <i className='bx bxs-edit-alt'></i>
              </div>
              <div 
                className={`deleteproject ${!isLocalAPIAvailable ? 'disabled' : ''}`}
                onClick={handleDeleteProject}
                title={!isLocalAPIAvailable ? 'Requiere conexión a Raspberry Pi' : 'Eliminar proyecto'}
              >
                <i className='bx bxs-trash-alt'></i>
              </div>
          </div>
        </div>
        <p className="Dsub2">
          {loading ? '' : project?.Fecha ? formatDate(project.Fecha) : 'Fecha no disponible'}
        </p>
        <h3 className='SectionTitle'>DESCRIPCIÓN</h3>
        <p>{project?.Descripcion || ''}</p>

        <div className="ExtraDetails">
          <button onClick={Handlecamera}>Medir terreno</button>
          <button onClick={Handlecameradual}>Medir terreno Dual</button>
          <button onClick={handleIrregularidades}>Medir irregularidades</button>
        </div>

        <h2>Ubicación</h2>
        <div className="MapDetail">
          {project?.Lat && project?.Lng ? (
            <MapContainer center={[project.Lat, project.Lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={true} dragging={false} doubleClickZoom={true} scrollWheelZoom={false} touchZoom={true}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[project.Lat, project.Lng]}>
                <Popup>Ubicación del proyecto</Popup>
              </Marker>
            </MapContainer>
          ) : (
            <p>Ubicación no disponible</p>
          )}
        </div>
      </div>

      <div className='GraphContainer'>
        <h2>Gráficas</h2>
        <div className="GraphSection">
          <GraphViewer />
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Editar Proyecto</h2>

            <input
              type="text"
              placeholder="Nombre del Proyecto"
              value={editData.nombreProyecto}
              onChange={(e) => setEditData({ ...editData, nombreProyecto: e.target.value })}
            />

            <select
              value={editData.categoria}
              onChange={(e) => setEditData({ ...editData, categoria: e.target.value })}
            >
              <option value="">Seleccione una categoría</option>
              <option value="Residencial">Residencial</option>
              <option value="Comercial">Comercial</option>
            </select>

            <textarea
              placeholder="Descripción"
              value={editData.descripcion}
              onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
            />
            <div className='ModalImageContainer'>
              <div className="PreviewImageContainer">
                {editData.imgFile ? (
                  <img
                    src={URL.createObjectURL(editData.imgFile)}
                    alt="Nueva imagen seleccionada"
                    className="ProjectImagePreview"
                  />
                ) : project?.Img ? (
                  <>
                    <p>Imagen actual:</p>
                    <img src={project.Img} alt="Imagen actual del proyecto" className="ProjectImagePreview" />
                  </>
                ) : (
                  <p>No hay imagen registrada para este proyecto</p>
                )}
              </div>
              
              <input className='modal-input.image'
                type="file"
                accept="image/*"
                onChange={(e) => setEditData({ ...editData, imgFile: e.target.files?.[0] || null })}
              />
            </div>

            <div style={{ height: '250px', marginTop: '10px' }}>
              <MapContainer
                center={[editData.lat || 23.6345, editData.lng || -102.5528]}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarkerEdit
                  setLat={(lat) => setEditData((prev) => ({ ...prev, lat }))}
                  setLng={(lng) => setEditData((prev) => ({ ...prev, lng }))}
                />
              </MapContainer>
            </div>

            <div className="modal-buttons">
              <button onClick={() => setShowModal(false)}>Cancelar</button>
              <button onClick={handleEditSubmit}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetallesProyecto;