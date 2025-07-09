import './DetallesyGraficas.css';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectViewModel } from '../../viewmodels/ProjectViewModel';
import { graphViewModel } from '../../viewmodels/GraphViewModel';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function DetallesProyecto() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [graphs, setGraphs] = useState([]);
  const [graphsLoading, setGraphsLoading] = useState(true);
  const navigate = useNavigate();

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

    fetchProject();
  }, [id]);

  useEffect(() => {
    const fetchGraphs = async () => {
      if (!id) return;

      const { success, data } = await graphViewModel.handleGetGraphsByProjectId(Number(id));
      if (success) setGraphs(data);
      setGraphsLoading(false);
    };

    fetchGraphs();
  }, [id]);

  const Handlecamera = () => {
    projectViewModel.handleCamera(navigate);
  };

  const formatDate = (fecha) => {
    const date = new Date(fecha);
    return isNaN(date.getTime()) ? 'Fecha inválida' : date.toLocaleDateString();
  };

  return (
    <div className="DetallesContainer">
      <div className="DetallesTitleContainer">
        <div className="DetallesTitle">
          <h1>Detalles de proyecto</h1>
          <i className="bx bxs-add-to-queue"></i>
        </div>
        <div className="DetallesEndContainer"></div>
      </div>

      <div className="DashSubtitle">
        <div className="DashSub1">
          <h2 className="Dsub1">
            {loading ? 'Cargando...' : project?.NombreProyecto || 'Proyecto no encontrado'}
          </h2>
          <p className="Dsub2">
            {loading ? '' : project?.Fecha ? formatDate(project.Fecha) : 'Fecha no disponible'}
          </p>
        </div>
        <div className="DashSub2"></div>
      </div>

      <div className="ProjectphotoDetail">
        <div className="corner-top-right"></div>
        <div className="corner-bottom-left"></div>
        <div className="PhotoContainer">
          {project?.Img ? (
            <img src={project.Img} alt="Proyecto" className="ProjectImage" />
          ) : (
            <p>No se ha cargado imagen para este proyecto</p>
          )}
        </div>
      </div>

      <div className="DetailOptions">
        <h2>Descripción</h2>
        <p>{project?.Descripcion || ''}</p>

        <div className="ExtraDetails">
          <button onClick={Handlecamera}>Medir terreno</button>
          <button>Medir irregularidades</button>
          <div className="categorycontainer">
            <p>Categoría: {project?.Categoria || ''}</p>
          </div>
        </div>

        <h2>Ubicación</h2>
        <div className="MapDetail">
          {project?.Lat && project?.Lng ? (
            <MapContainer center={[project.Lat, project.Lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} doubleClickZoom={false} scrollWheelZoom={false} touchZoom={false}>
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

      <div>
        <h2>Gráficas</h2>
        <div className="GraphSection">
          {graphsLoading ? (
            <p>Cargando gráficas...</p>
          ) : graphs.length === 0 ? (
            <p>No hay gráficas generadas por el momento</p>
          ) : (
            graphs.map((graph) => (
              <div key={graph.id} className="GraphCard">
                <h3>{graph.title}</h3>
                <p>{graph.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default DetallesProyecto;
