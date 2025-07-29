import axios from 'axios';

const API_URL = 'https://geova-api1.namixcode.cc/projects';
const API_URL_LOCAL2 = 'http://localhost:8000';

//https://geova-api1.namixcode.cc/projects

export const projectService = {
  async createProject(formData) {
    const response = await axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getAllProjects() {
    const response = await axios.get(API_URL);
    return response.data;
  },

  async getProjectById(id) {
    const response = await axios.get(`${API_URL}/id/${id}`);
    return response.data;
  },
  
  async updateProject(id, formData) {
    const response = await axios.put(`${API_URL}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getAllProjectsByIdUser(idUser) {
    const response = await axios.get(`${API_URL}/user/${idUser}`);
    return response.data;
  },

  // Función para verificar si la API local está disponible
  async checkLocalAPIAvailability() {
    try {
      const response = await axios.get(`${API_URL_LOCAL2}/health`, {
        timeout: 3000, // 3 segundos de timeout
      });
      return response.status === 200;
    } catch (error) {
      // Si hay cualquier error (conexión, timeout, etc.), consideramos que no está disponible
      return false;
    }
  },

  // Función alternativa si no tienes endpoint /health
  async checkLocalAPIAvailabilityAlt() {
    try {
      // Intenta hacer una petición simple a un endpoint que sepas que existe
      const response = await axios.get(`${API_URL_LOCAL2}`, {
        timeout: 3000,
      });
      return true;
    } catch (error) {
      return false;
    }
  },

  async deleteProject(id) {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  },

  async deleteProjectByTFLuna(id) {
    const response = await axios.delete(`${API_URL}/tfluna/sensor/project/${id}`);
    return response.data;
  },

  async deleteProjectByIMX477(id) {
    const response = await axios.delete(`${API_URL}/imx477/sensor/project/${id}`);
    return response.data;
  },

  async deleteProjectByMPU6050(id) {
    const response = await axios.delete(`${API_URL}/mpu/sensor/project/${id}`);
    return response.data;
  },

};