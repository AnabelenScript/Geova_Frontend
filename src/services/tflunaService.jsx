import axios from 'axios';
import { showErrorAlert } from '../utils/alerts';

const API_URL = 'http://localhost:8000/tfluna/sensor';

function getToken() {
  const tokenKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
  if (!tokenKey) throw new Error('Usuario no autenticado');

  const user = JSON.parse(localStorage.getItem(tokenKey));
  return user?.token;
}

export const tflunaService = {

  // ---------------------------------------------
  // POST SENSOR
  // ---------------------------------------------
  async postSensortfluna(data) {
    try {
      const token = getToken();

      const response = await axios.post(API_URL, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error en postSensortfluna:", error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;

          if (status === 400) {
            await showErrorAlert("Datos inválidos (400). Revisa la estructura del sensor.");
          } else if (status === 401) {
            await showErrorAlert("No autorizado (401). Inicia sesión nuevamente.");
          } else if (status === 404) {
            await showErrorAlert("Endpoint de TF-Luna no encontrado (404).");
          } else if (status === 409) {
            await showErrorAlert("Conflicto (409). El sensor ya existe o los datos son duplicados.");
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudo guardar el sensor.`);
          }
        } else if (error.request) {
          await showErrorAlert("El servidor no respondió. Verifica tu red o la API local.");
        }
      } else {
        await showErrorAlert("Error inesperado al registrar datos del sensor.");
      }

      throw error;
    }
  },

  // ---------------------------------------------
  // GET BY PROJECT ID
  // ---------------------------------------------
  async getSensorTFLunaByProjectId(id_project) {
    try {
      const token = getToken();

      const response = await axios.get(`${API_URL}/${id_project}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;

    } catch (error) {
      console.error("Error en getSensorTFLunaByProjectId:", error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;

          if (status === 404) {
            return []; // No hay sensores → solo regresa arreglo vacío igual que en projects
          } else if (status === 401) {
            await showErrorAlert("No autorizado (401). Tu sesión expiró.");
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudo obtener TF-Luna.`);
          }
        } else if (error.request) {
          await showErrorAlert("No se recibió respuesta del servidor.");
        }
      } else {
        await showErrorAlert("Error inesperado al obtener el sensor.");
      }

      throw error;
    }
  },

  // ---------------------------------------------
  // UPDATE SENSOR
  // ---------------------------------------------
  async updateSensorTFLuna(sensor_id, data) {
    try {
      const token = getToken();

      const response = await axios.put(`${API_URL}/${sensor_id}`, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;

    } catch (error) {
      console.error("Error en updateSensorTFLuna:", error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;

          if (status === 400) {
            await showErrorAlert("Datos inválidos (400). Revisa la información enviada.");
          } else if (status === 401) {
            await showErrorAlert("No autorizado (401). Inicia sesión nuevamente.");
          } else if (status === 404) {
            await showErrorAlert("Sensor no encontrado (404).");
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudo actualizar el sensor.`);
          }
        } else if (error.request) {
          await showErrorAlert("El servidor local no respondió.");
        }
      } else {
        await showErrorAlert("Error inesperado al actualizar el sensor.");
      }

      throw error;
    }
  },

  // ---------------------------------------------
  // UPDATE SENSOR DUAL
  // ---------------------------------------------
  async updateDualSensorTFLuna(sensor_id, data) {
    try {
      const token = getToken();

      const response = await axios.put(`${API_URL}/${sensor_id}/dual`, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;

    } catch (error) {
      console.error("Error en updateDualSensorTFLuna:", error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;

          if (status === 400) {
            await showErrorAlert("Datos inválidos (400). Revisa el formato del dual sensor.");
          } else if (status === 401) {
            await showErrorAlert("No autorizado (401). Inicia sesión nuevamente.");
          } else if (status === 404) {
            await showErrorAlert("Sensor dual no encontrado (404).");
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudo actualizar el dual sensor.`);
          }
        } else if (error.request) {
          await showErrorAlert("El servidor local no respondió.");
        }
      } else {
        await showErrorAlert("Error inesperado al actualizar el dual sensor.");
      }

      throw error;
    }
  },

};
