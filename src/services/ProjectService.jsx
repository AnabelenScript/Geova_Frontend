import axios from 'axios';

const API_URL = 'https://go.geova.pro/projects';
const API_URL_LOCAL2 = 'http://localhost:8000';

//https://geova-api1.namixcode.cc/projects

export const projectService = {
  getCountLastWeek(id) {
    //const response = await axios.get(`${API_URL}/stats/${id}`)
    return {
      mon: 1,
      tue: 2,
      wed: 1,
      thu: 4,
      fri: 2,
      sat: 2,
      sun: 6
    }
  },

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

  async checkSensorData(sensorType, projectId) {
    try {
      let endpoint = '';
      switch (sensorType) {
        case 'tfluna':
          endpoint = `${API_URL_LOCAL2}/tfluna/sensor/${projectId}`;
          break;
        case 'imx477':
          endpoint = `${API_URL_LOCAL2}/imx477/sensor/${projectId}`;
          break;
        case 'mpu':
          endpoint = `${API_URL_LOCAL2}/mpu/sensor/${projectId}`;
          break;
        default:
          return { exists: false };
      }
      
      const response = await axios.get(endpoint, { timeout: 3000 });
      // Verificar si hay datos en la respuesta
      const data = response.data?.data || response.data;
      const hasData = Array.isArray(data) ? data.length > 0 : !!data;
      return { exists: hasData };
    } catch (error) {
      // Si es 404 o cualquier error, asumimos que no hay datos
      return { exists: false };
    }
  },

  async deleteProjectByTFLuna(id) {
    const response = await axios.delete(`${API_URL_LOCAL2}/tfluna/sensor/project/${id}`);
    return response.data;
  },

  async deleteProjectByIMX477(id) {
    const response = await axios.delete(`${API_URL_LOCAL2}/imx477/sensor/project/${id}`);
    return response.data;
  },

  async deleteProjectByMPU6050(id) {
    const response = await axios.delete(`${API_URL_LOCAL2}/mpu/sensor/project/${id}`);
    return response.data;
  },

};