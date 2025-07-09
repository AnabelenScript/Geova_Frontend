import { projectService } from '../services/ProjectService';
import { ProjectModel } from '../models/ProjectModel';

let selectedProjectId = null;

export const projectViewModel = {
  async handleCreateProject(nombreProyecto, categoria, descripcion, imgFile, lat, lng) {
  try {
    const formData = new FormData();
    formData.append("nombreProyecto", nombreProyecto);
    formData.append("categoria", categoria);
    formData.append("descripcion", descripcion);
    formData.append("fecha", new Date().toISOString());
    formData.append("lat", parseFloat(lat));
    formData.append("lng", parseFloat(lng));
    formData.append("img", imgFile); // archivo real

    const response = await projectService.createProject(formData);
    return { success: true, data: response };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al crear el proyecto',
    };
  }
},


  async handleGetAllProjects() {
    try {
      const response = await projectService.getAllProjects();
      return { success: true, data: response };
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
    navigate(`/detalles/${id}`);
  },

  getSelectedProjectId() {
    return selectedProjectId;
  },

  handleCamera(navigate){
    navigate('/takephoto')
  }
};
