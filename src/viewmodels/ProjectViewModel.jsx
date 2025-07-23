import { projectService } from '../services/ProjectService';
import Swal from 'sweetalert2';
import alerticon from '../assets/alerticon.svg'; 
import succesfulicon from '../assets/sucessfulicon.svg'
import './alerts.css'

let selectedProjectId = null;
let allProjects = [];
let filteredProjects = [];
let searchTerm = '';
let filterType = '';

export const projectViewModel = {
  async handleCreateProject(nombreProyecto, categoria, descripcion, imgFile, lat, lng) {
    if (!nombreProyecto || !categoria || !descripcion || !imgFile || lat == null || lng == null) {
      await Swal.fire({
        title: 'Campos obligatorios',
        text: 'Todos los campos son obligatorios, incluyendo imagen y ubicación.',
        imageUrl: alerticon,
        imageWidth: 200,
        imageHeight: 200,
        imageAlt: 'Advertencia',
        showConfirmButton: false, 
        icon: false,
        background: '#fff',
        color: '#333',
        customClass: {
           popup: 'succesful-popup',
                title: 'succesful-titulo',
                confirmButton: 'succesful-confirmar',
                 htmlContainer: 'succesful-contenido'
        }
      });
      return { success: false, error: 'Faltan campos obligatorios' };
    }

    try {
      const formData = new FormData();
      formData.append('nombreProyecto', nombreProyecto);
      formData.append('categoria', categoria);
      formData.append('descripcion', descripcion);
      formData.append('fecha', new Date().toISOString());
      formData.append('lat', parseFloat(lat));
      formData.append('lng', parseFloat(lng));
      formData.append('img', imgFile);

      const response = await projectService.createProject(formData);

      await Swal.fire({
        title: '¡Éxito!',
        imageUrl: succesfulicon,
        imageWidth: 200,
        imageHeight: 200,
        text: 'Proyecto creado exitosamente.',
        showConfirmButton: false,
        background: '#fff',
        color: '#333',
        customClass: {
          popup: 'succesful-popup',
                title: 'succesful-titulo',
                confirmButton: 'succesful-confirmar',
                 htmlContainer: 'succesful-contenido'
        }
      });

      return { success: true, data: response };
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || error.message || 'Error al crear el proyecto',
        background: '#fff',
        color: '#333',
        customClass: {
          popup: 'swal-popup',
          title: 'swal-title'
        }
      });

      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al crear el proyecto'
      };
    }
  },

  async handleGetAllProjects() {
    try {
      const response = await projectService.getAllProjects();
      allProjects = response;
      filteredProjects = [...allProjects];
      return { success: true, data: filteredProjects };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al obtener los proyectos',
      };
    }
  },

  async handleGetProjectById(id) {
    try {
      const response = await projectService.getProjectById(id);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al obtener el proyecto',
      };
    }
  },

  handleSelectProject(id, navigate) {
    selectedProjectId = id;
    navigate(`/dashboard/detalles/${id}`);
  },

  getSelectedProjectId() {
    return selectedProjectId;
  },

  handleCamera(navigate) {
    navigate('takephoto');
  },

  sortProjectsByDate(type, projects) {
    let sorted;
    if (type === "antiguos") {
      sorted = [...projects].sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));
    } else if (type === "recientes") {
      sorted = [...projects].sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));
    }
    return sorted;
  },

  handleSearchChange(value) {
    searchTerm = value.toLowerCase();
    projectViewModel.applyFilters();
    return filteredProjects;
  },

  handleFilterChange(value) {
    filterType = value;
    projectViewModel.applyFilters();
    return filteredProjects;
  },

  applyFilters() {
    let result = [...allProjects];

    if (searchTerm) {
      result = result.filter(p =>
        p.NombreProyecto.toLowerCase().includes(searchTerm) ||
        p.Categoria.toLowerCase().includes(searchTerm)
      );
    }

    if (filterType === 'recientes' || filterType === 'antiguos') {
      result = projectViewModel.sortProjectsByDate(filterType, result);
    }

    filteredProjects = result;
  },

  filterAndSortProjects(projects, searchTerm, sortOption) {
    let result = [...projects];

    if (searchTerm.trim()) {
      result = result.filter((project) =>
        project.NombreProyecto.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortOption === 'az') {
      result.sort((a, b) =>
        a.NombreProyecto.localeCompare(b.NombreProyecto)
      );
    } else if (sortOption === 'recientes') {
      result.sort((a, b) => new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime());
    } else if (sortOption === 'antiguos') {
      result.sort((a, b) => new Date(a.Fecha).getTime() - new Date(b.Fecha).getTime());
    }

    return result;
  },

  handleIrregularidades(navigate, id) {
    navigate(`/dashboard/detalles/${id}/irregularidades`);
  }
};
