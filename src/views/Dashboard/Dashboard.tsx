import './Dashboard.css';
import { useEffect, useState, useRef } from 'react';
import { projectViewModel } from '../../viewmodels/ProjectViewModel';
import { useNavigate } from 'react-router-dom'; 


interface Project {
  Id: number;
  NombreProyecto: string;
  Categoria: string;
  Descripcion: string;
  Fecha: string;
  Img: File;
}

function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleProjectClick = (id: number) => {
    projectViewModel.handleSelectProject(id, navigate); 
  };

  useEffect(() => {
    const fetchProjects = async () => {
      const { success, data, error } = await projectViewModel.handleGetAllProjects();
      if (success && Array.isArray(data)) {
        setProjects(data);
        setFilteredProjects(data);
      } else {
        console.warn('No se encontraron proyectos o data inválida.');
        setProjects([]);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const result = projectViewModel.filterAndSortProjects(projects, searchTerm, sortOption);
    setFilteredProjects(result);

    if (searchTerm && result.length === 1) {
      const foundId = result[0].Id;
      setHighlightedId(foundId);
      setTimeout(() => setHighlightedId(null), 1500);
    }
  }, [searchTerm, sortOption, projects]);

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return 'Fecha inválida';
    }
    return parsedDate.toLocaleDateString();
  };

  return (
    <div className="DashboardContainer">
      <div className="DashboardTitleContainer">
        <div className="DashTitle">
          <h1>Dashboard</h1>
          <i className="bx bxs-dashboard"></i>
        </div>
        <div className='DashEndContainer'></div>
      </div>

      <div className="DashSubtitle">
        <div className="DashSub1">
          <h2 className="Dsub1">Tus proyectos</h2>
          <p className="Dsub2">Información principal</p>
        </div>
         <div className="DashSub2">
          <div className="group">
            <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
              <g>
                <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z" />
              </g>
            </svg>
            <input
              placeholder="Search"
              type="search"
              className="input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            name="Dfilter"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value=""> Ordenar por...</option>
            <option value="az">Nombre A-Z</option>
            <option value="recientes">Fecha reciente</option>
            <option value="antiguos">Fecha antigua</option>
          </select>
        </div>
      </div>

      <div className="ProjectListContainer">
        {filteredProjects.length === 0 ? (
          <p className="NoProjects">No hay proyectos registrados.</p>
        ) : (
          <div className="ProjectList">
            {filteredProjects.map((project) => (
              <div
                key={project.Id}
                className={`ProjectCard ${highlightedId === project.Id ? 'highlighted' : ''}`}
                onClick={() => handleProjectClick(project.Id)}
              >
                <div className="projectinfo">
                  <div className="Projectphoto">
                    {project?.Img ? (
                      <img src={project.Img} alt="Proyecto" className="ProjectImage" />
                    ) : (
                      <p>No se ha cargado imagen para este proyecto</p>
                    )}
                  </div>
                  <div>
                    <h3>{project.NombreProyecto}</h3>
                    <p><strong>Categoría:</strong> {project.Categoria}</p>
                    <p><strong>Fecha de creación:</strong> {formatDate(project.Fecha)}</p>
                  </div>
                </div>
                <div className="graphview"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
