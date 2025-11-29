import axios from 'axios';

const API_URL = 'https://go.geova.pro/projects'
const API_URL_LOCAL2 = 'http://localhost:8000';
//'https://go.geova.pro/projects';
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
async checkLocalAPIAvailability(signal) {
  try {
    console.log('🔍 Verificando conexión a:', `${API_URL_LOCAL2}/ping`);
    const response = await axios.get(`${API_URL_LOCAL2}/ping`, {
      timeout: 15000,
      signal: signal,
    });
    return response.data?.pong === true;
  } catch (error) {
    if (error.code === 'ERR_CANCELED' || 
        error.name === 'CanceledError' || 
        error.name === 'AbortError' ||
        axios.isCancel(error) ||
        signal?.aborted) {
      return false;
    }
    return false;
  }
},
  async checkLocalAPIAvailabilityAlt() {
    try {
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
      const endpoints = {
        'tfluna': `${API_URL_LOCAL2}/tfluna/sensor/${projectId}`,
        'imx477': `${API_URL_LOCAL2}/imx477/sensor/${projectId}`,
        'mpu': `${API_URL_LOCAL2}/mpu/sensor/${projectId}`
      };
    
      const response = await axios.get(endpoints[sensorType], { timeout: 3000 });
      return { exists: response.status === 200 && response.data };
    } catch (error) {
      if (error.response?.status === 404) {
        return { exists: false };
      }
      console.warn(`Error verificando ${sensorType}:`, error.message);
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