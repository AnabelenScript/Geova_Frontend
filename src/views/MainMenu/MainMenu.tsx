import React, { useEffect, useState } from 'react';
import { projectViewModel } from '../../viewmodels/ProjectViewModel';
import './MainMenu.css';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function MainMenu() {
  const [projects, setProjects] = useState([]);
  const [selectedButton, setSelectedButton] = useState('recientes');
  const [currentPage, setCurrentPage] = useState(0); 
  const [weeklyData, setWeeklyData] = useState([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const cardsPerPage = 2;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      const result = await projectViewModel.handleGetAllProjects();
      if (result.success) {
        const sorted = projectViewModel.sortProjectsByDate('recientes', result.data);
        setProjects(sorted);
      } else {
        console.error(result.error);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchWeeklyStats = async () => {
      setLoadingStats(true);
      const result = await projectViewModel.handleGetWeeklyStats();
      if (result.success) {
        setWeeklyData(result.data);
        setTotalProjects(result.total);
      } else {
        console.error(result.error);
      }
      setLoadingStats(false);
    };
    fetchWeeklyStats();
  }, []);

  const formatDate = (date) => {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return 'Fecha inválida';
    return parsedDate.toLocaleDateString();
  };

  const handleSortProjects = (type) => {
    setSelectedButton(type);
    const sorted = projectViewModel.sortProjectsByDate(type, projects);
    setProjects(sorted);
    setCurrentPage(0); 
  };

  const handleProjectClick = (Id) => {
  projectViewModel.handleSelectProject(Id, navigate);
};


  const startIndex = currentPage * cardsPerPage;
  const visibleProjects = projects.slice(startIndex, startIndex + cardsPerPage);
  const totalPages = Math.ceil(projects.length / cardsPerPage);

  return (
    <div className='MainMenuContainer'>
      <div className="MenuTitleContainer">
        <div className="MenuTitle">
          <h1>¡Bienvenido!</h1>
          <i class="fa-solid fa-helmet-safety"></i>
        </div>
        <h3>Comencemos a medir</h3>
        <div className="stats-container">
  <div className="stats-header">
    <div className="stats-title">
      <h2>Has creado {totalProjects} proyectos esta semana</h2>
      <p className="stats-subtitle">Proyectos creados en los últimos 7 días</p>
    </div>
  </div>

  {loadingStats ? (
    <div className="stats-loading">
      <p>Cargando estadísticas...</p>
    </div>
  ) : (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={325}>
        <LineChart 
          data={weeklyData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" opacity={0.3} />
          <XAxis 
            dataKey="dia" 
            stroke="#ffffff"
            tick={{ fill: '#ffffff', fontSize: 12 }}
            axisLine={{ stroke: '#1e3a5f' }}
          />
          <YAxis 
            label={{ 
              value: 'Cantidad de proyectos creados', 
              angle: -90, 
              style: { fill: '#ffffff', fontSize: 12 }
            }}
            stroke="#ffffff"
            tick={{ fill: '#ffffff', fontSize: 14 }}
            axisLine={{ stroke: '#1e3a5f' }}
            domain={[0, 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--dark-blue)', 
              border: '1px solid #ffa500',
              borderRadius: '8px',
              color: '#ffffff'
            }}
            labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
            itemStyle={{ color: '#ffa500' }}
          />
          <Line 
            type="monotone" 
            dataKey="proyectos" 
            stroke="#ffa500" 
            strokeWidth={3}
            dot={{ fill: '#ffa500', r: 4 }}
            activeDot={{ r: 6, fill: '#ffa500' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )}
</div>
      </div>

      <div className="MenuSubtitle">
        <div className="MenuSub1">
          <h2 className="Msub1">Proyectos</h2>
          <p className="Msub2">Información principal</p>
        </div>
        <div className="MenuSub2">
          <button
            className={`buttonantiguo ${selectedButton === 'antiguos' ? 'selected' : ''}`}
            onClick={() => handleSortProjects('antiguos')}
          >
            Antiguos
          </button>
          <button
            className={`buttonreciente ${selectedButton === 'recientes' ? 'selected' : ''}`}
            onClick={() => handleSortProjects('recientes')}
          >
            Recientes
          </button>
        </div>
      </div>

      <div className="MenuProjectsWrapper">
        <button
          className="sliderArrow"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
          disabled={currentPage === 0}
        >
          ◀
        </button>

        <div className="MenuProjects">
          {visibleProjects.map((project) => (
            <div  className="MenuProjectCard fade-in" key={project.Id} onClick={() => handleProjectClick(project.Id)}>
              <div className='MenuProjectContainer'>
                <div className='MenuProjectImageContainer'>
                  {project?.Img ? (
                    <img src={project.Img} alt="Proyecto" className="MenuProjectImage" />
                  ) : (
                    <p>No se ha cargado imagen para este proyecto</p>
                  )}
                </div>
                <div className='MenuProjectData'>
                  <h3>{project.NombreProyecto}</h3>
                  <p><strong>Fecha de creación:</strong> {formatDate(project.Fecha)}</p>
                  <p><strong>Categoría:</strong> {project.Categoria}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="sliderArrow"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
          disabled={currentPage >= totalPages - 1}
        >
          ▶
        </button>
      </div>

      <div className='VideoContainer'>
        <h2 className="Msub1">Video promocional</h2>
        <div className='VideoPromocional'>
          <iframe width="560" height="315" 
              src="https://www.youtube.com/embed/iOZG-GAH7tY?si=tGGRR3LGR5HLlFx7" 
              title="YouTube video player" frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>  
          </iframe>
        </div>
      </div>
    </div>
  );
}

export default MainMenu;
