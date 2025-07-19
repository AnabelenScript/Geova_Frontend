import React, { useEffect, useState } from 'react';
import { projectViewModel } from '../../viewmodels/projectViewModel';
import './MainMenu.css';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

function MainMenu() {
  const [projects, setProjects] = useState([]);
  const [selectedButton, setSelectedButton] = useState('recientes');
  const [currentPage, setCurrentPage] = useState(0); // 👈 Página actual

  const cardsPerPage = 2;

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

  const startIndex = currentPage * cardsPerPage;
  const visibleProjects = projects.slice(startIndex, startIndex + cardsPerPage);
  const totalPages = Math.ceil(projects.length / cardsPerPage);

  return (
    <div className='MainMenuContainer'>
      <div className="MenuTitleContainer">
        <div className="MenuTitle">
          <h1>¡Hola de nuevo!</h1>
          <i className='bx bxs-home'></i>
        </div>
        <div className="MenuEndContainer"></div>
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
            <div className="MenuProjectCard fade-in" key={project.Id}>
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
        <div className='VideoPromocional'></div>
      </div>
    </div>
  );
}

export default MainMenu;
