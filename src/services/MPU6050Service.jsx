
import axios from 'axios';
import { showErrorAlert } from '../utils/alerts';

const API_URL = 'http://localhost:8000/mpu/sensor';

export const mpuSensorService = {
  async postSensorMPU(data) {
    try {
      const tokenKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
      if (!tokenKey) {
        await showErrorAlert('Usuario no autenticado. Inicia sesión nuevamente.');
        throw new Error('Usuario no autenticado');
      }

      const user = JSON.parse(localStorage.getItem(tokenKey));
      const token = user?.token;

      const response = await axios.post(API_URL, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error en postSensorMPU:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          
          if (status === 400) {
            await showErrorAlert('Datos inválidos (400). Verifica la información del sensor MPU.');
          } else if (status === 401) {
            await showErrorAlert('No autorizado (401). Tu sesión expiró. Inicia sesión nuevamente.');
          } else if (status === 404) {
            await showErrorAlert('Endpoint no encontrado (404). Contacta al administrador.');
          } else if (status === 500) {
            await showErrorAlert('Error interno del servidor (500). Intenta nuevamente.');
          } else if (status === 502) {
            await showErrorAlert('Bad Gateway (502). El servidor no está disponible.');
          } else if (status === 503) {
            await showErrorAlert('Servicio no disponible (503). Intenta más tarde.');
          } else if (status === 522) {
            await showErrorAlert('Timeout de conexión (522). El servidor no responde.');
          } else {
            await showErrorAlert(`Error del servidor (${status}). No se pudo guardar la información del MPU.`);
          }
        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor. Verifica tu conexión de red.');
        } else {
          await showErrorAlert('Error al configurar la petición.');
        }
      }

      throw error;
    }
  },

  async getSensorMPUByProjectId(id_project) {
    try {
      const tokenKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
      if (!tokenKey) {
        await showErrorAlert('Usuario no autenticado. Inicia sesión nuevamente.');
        throw new Error('Usuario no autenticado');
      }

      const user = JSON.parse(localStorage.getItem(tokenKey));
      const token = user?.token;

      const response = await axios.get(`${API_URL}/${id_project}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error en getSensorMPUByProjectId:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          
          if (status === 404) {
            return null; // No hay datos para este proyecto
          } else if (status === 401) {
            await showErrorAlert('No autorizado (401). Tu sesión expiró.');
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudieron obtener los datos del MPU.`);
          }
        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor.');
        }
      }

      throw error;
    }
  },

  async updateSensorMPU(sensor_id, data) {
    try {
      const tokenKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
      if (!tokenKey) {
        await showErrorAlert('Usuario no autenticado. Inicia sesión nuevamente.');
        throw new Error('Usuario no autenticado');
      }

      const user = JSON.parse(localStorage.getItem(tokenKey));
      const token = user?.token;

      const response = await axios.put(`${API_URL}/${sensor_id}`, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error en updateSensorMPU:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          
          if (status === 400) {
            await showErrorAlert('Datos inválidos (400). Verifica la información.');
          } else if (status === 401) {
            await showErrorAlert('No autorizado (401). Tu sesión expiró.');
          } else if (status === 404) {
            await showErrorAlert('Sensor MPU no encontrado (404).');
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudo actualizar el sensor MPU.`);
          }
        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor.');
        }
      }

      throw error;
    }
  },

  async updateDualSensorMPU(sensor_id, data) {
    try {
      const tokenKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
      if (!tokenKey) {
        await showErrorAlert('Usuario no autenticado. Inicia sesión nuevamente.');
        throw new Error('Usuario no autenticado');
      }

      const user = JSON.parse(localStorage.getItem(tokenKey));
      const token = user?.token;

      const response = await axios.put(`${API_URL}/${sensor_id}/dual`, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error en updateDualSensorMPU:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          
          if (status === 400) {
            await showErrorAlert('Datos inválidos (400). Verifica la información.');
          } else if (status === 401) {
            await showErrorAlert('No autorizado (401). Tu sesión expiró.');
          } else if (status === 404) {
            await showErrorAlert('Sensor MPU no encontrado (404).');
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudo actualizar el sensor dual MPU.`);
          }
        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor.');
        }
      }

      throw error;
    }
  },
};