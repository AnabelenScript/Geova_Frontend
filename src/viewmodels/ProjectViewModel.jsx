import { projectService } from '../services/ProjectService';
import { imxService } from '../services/imx.Service';
import Swal from 'sweetalert2';
import alerticon from '../assets/alerticon.svg'; 
import succesfulicon from '../assets/sucessfulicon.svg'
import './alerts.css'
import { showSuccessAlert, showErrorAlert, showConfirmAlert, showCautionAlert} from '../utils/alerts';

let selectedProjectId = null;
let allProjects = [];
let filteredProjects = [];
let searchTerm = '';
let filterType = '';

export const projectViewModel = {
  async handleCreateProject(nombreProyecto, categoria, descripcion, imgFile, lat, lng) {
    if (!nombreProyecto || !categoria || !descripcion || !imgFile || lat == null || lng == null) {
      await showConfirmAlert(
        'Campos obligatorios',
        'Todos los campos son obligatorios, incluyendo imagen y ubicación.'
      );
      return { success: false, error: 'Faltan campos obligatorios' };
    }
    const userKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
    if (!userKey) {
      await showErrorAlert('No se encontró información del usuario. Por favor, inicie sesión de nuevo.');
      return { success: false, error: 'Usuario no autenticado' };
    }

    const user = JSON.parse(localStorage.getItem(userKey));
    const userId = user.id;

    try {
      const formData = new FormData();
      formData.append('nombreProyecto', nombreProyecto);
      formData.append('categoria', categoria);
      formData.append('descripcion', descripcion);
      formData.append('fecha', new Date().toISOString());
      formData.append('lat', parseFloat(lat));
      formData.append('lng', parseFloat(lng));
      formData.append('img', imgFile);
      formData.append('userId', userId);

      const response = await projectService.createProject(formData);

      await showSuccessAlert('Proyecto creado exitosamente.');
      return { success: true, data: response };
    } catch (error) {
      await showErrorAlert(error.response?.data?.error || error.message || 'Error al crear el proyecto');
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al crear el proyecto'
      };
    }
  },

  async handleGetAllProjects() {
    try {
      const userKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
      if (!userKey) {
        throw new Error('Usuario no autenticado');
      }
      const user = JSON.parse(localStorage.getItem(userKey));
      const userId = user?.id;
      if (!userId) {
        throw new Error('No se pudo obtener el ID del usuario');
      }
      const response = await projectService.getAllProjectsByIdUser(userId);
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
  },

  async handleUpdateProject(id, nombreProyecto, categoria, descripcion, imgFile, lat, lng) {
    try {
      const userKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
      if (!userKey) throw new Error('Usuario no autenticado');

      const user = JSON.parse(localStorage.getItem(userKey));
      const userId = user?.id;
      if (!userId) throw new Error('No se pudo obtener el ID del usuario');

      const formData = new FormData();
      formData.append('nombreProyecto', nombreProyecto);
      formData.append('categoria', categoria);
      formData.append('descripcion', descripcion);
      formData.append('fecha', new Date().toISOString());
      formData.append('lat', parseFloat(lat));
      formData.append('lng', parseFloat(lng));
      formData.append('userId', userId);

      if (imgFile) {
        formData.append('img', imgFile);
      }

      const response = await projectService.updateProject(id, formData);
      await showSuccessAlert('El proyecto ha sido actualizado exitosamente.');
      return { success: true, data: response };
    } catch (error) {
      await showErrorAlert(error.response?.data?.error || error.message || 'Error al actualizar el proyecto');
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al actualizar el proyecto'
      };
    }
  },

  async handleDeleteProject(id, navigate) {
    try {
      // Primero verificar si la API local está disponible
      const isLocalAPIAvailable = await projectService.checkLocalAPIAvailability();
      
      if (!isLocalAPIAvailable) {
        await showErrorAlert(
          'API Local No Disponible',
          'No se puede eliminar el proyecto porque la API local (Raspberry Pi) no está disponible. ' +
          'Para eliminar un proyecto, necesitas estar conectado a la Raspberry Pi para eliminar ' +
          'también los datos de los sensores asociados.'
        );
        return { success: false, error: 'API local no disponible' };
      }

      // Si la API local está disponible, mostrar confirmación
      const confirm = await showConfirmAlert(
        '¿Estás seguro?',
        'Este proyecto se eliminará permanentemente.',
        'Los datos de los sensores asociados al proyecto también serán eliminados.',
        'Esta acción no se puede deshacer.'
      );

      if (!confirm.isConfirmed) return { success: false };

      // Proceder con la eliminación
      await projectService.deleteProject(id);
      await projectService.deleteProjectByTFLuna(id);
      await projectService.deleteProjectByIMX477(id);
      await projectService.deleteProjectByMPU6050(id);
      
      await showSuccessAlert('Proyecto eliminado exitosamente.');
      await projectViewModel.handleGetAllProjects();
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      await showErrorAlert(error.response?.data?.error || error.message || 'Error al eliminar el proyecto');
      return { success: false };
    }
  },

  async handlePostSensorIMX(sensorData) {
    try {
      const response = await imxService.enviarDatos(sensorData);
      await showSuccessAlert('Datos del sensor guardados correctamente.');
      return { success: true, data: response };
    } catch (error) {
      await showErrorAlert(error.response?.data?.error || error.message || 'Error al guardar datos del sensor');
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al guardar datos del sensor'
      };
    }
  },

  async handleGetSensorIMXByProjectId(id_project) {
    try {
      const response = await imxService.getSensorIMXByProjectId(id_project);
      return { success: true, data: response };
    } catch (error) {
      await showErrorAlert(error.response?.data?.error || error.message || 'Error al obtener datos del sensor');
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al obtener datos del sensor'
      };
    }
  }
};