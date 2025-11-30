import axios from 'axios';
import { showErrorAlert } from '../utils/alerts';

const API_URL = 'https://go.geova.pro/projects';
const API_URL_LOCAL2 = 'http://localhost:8000';

export const projectService = {
  getCountLastWeek(id) {
    return {
      mon: 1,
      tue: 2,
      wed: 1,
      thu: 4,
      fri: 2,
      sat: 2,
      sun: 6
    };
  },

  async createProject(formData) {
    try {
      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error en createProject:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          
          if (status === 400) {
            await showErrorAlert('Datos inválidos (400). Verifica la información del proyecto.');
          } else if (status === 401) {
            await showErrorAlert('No autorizado (401). Inicia sesión nuevamente.');
          } else if (status === 413) {
            await showErrorAlert('Archivo demasiado grande (413). Reduce el tamaño del archivo.');
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudo crear el proyecto.`);
          }
        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor. Verifica tu conexión.');
        }
      } else {
        await showErrorAlert('Error inesperado al crear el proyecto.');
      }

      throw error;
    }
  },

  async getAllProjects() {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error('Error en getAllProjects:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          
          if (status === 401) {
            await showErrorAlert('No autorizado (401). Inicia sesión nuevamente.');
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudieron obtener los proyectos.`);
          }
        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor.');
        }
      } else {
        await showErrorAlert('Error inesperado al obtener los proyectos.');
      }

      throw error;
    }
  },

  async getProjectById(id) {
    try {
      const response = await axios.get(`${API_URL}/id/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error en getProjectById:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          
          if (status === 404) {
            await showErrorAlert('Proyecto no encontrado (404).');
          } else if (status === 401) {
            await showErrorAlert('No autorizado (401). Inicia sesión nuevamente.');
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudo obtener el proyecto.`);
          }
        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor.');
        }
      } else {
        await showErrorAlert('Error inesperado al obtener el proyecto.');
      }

      throw error;
    }
  },

  async updateProject(id, formData) {
    try {
      const response = await axios.put(`${API_URL}/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error en updateProject:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          
          if (status === 400) {
            await showErrorAlert('Datos inválidos (400). Verifica la información.');
          } else if (status === 401) {
            await showErrorAlert('No autorizado (401). Tu sesión expiró.');
          } else if (status === 404) {
            await showErrorAlert('Proyecto no encontrado (404).');
          } else if (status === 413) {
            await showErrorAlert('Archivo demasiado grande (413).');
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudo actualizar el proyecto.`);
          }
        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor.');
        }
      } else {
        await showErrorAlert('Error inesperado al actualizar el proyecto.');
      }

      throw error;
    }
  },

  async getAllProjectsByIdUser(idUser) {
    try {
      const response = await axios.get(`${API_URL}/user/${idUser}`);
      return response.data;
    } catch (error) {
      console.error('Error en getAllProjectsByIdUser:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          
          if (status === 404) {
            await showErrorAlert('Error en servidor, direccion url incorrecta');
          } else if (status === 401) {
            await showErrorAlert('No autorizado (401). Tu sesión expiró.');
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudieron obtener los proyectos del usuario.`);
          }
        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor.');
        }
      } else {
        await showErrorAlert('Error inesperado al obtener los proyectos del usuario.');
      }

      throw error;
    }
  },

  async checkLocalAPIAvailability() {
    try {
      const response = await axios.get(`${API_URL_LOCAL2}/health`, {
        timeout: 3000,
      });
      return response.status === 200;
    } catch (error) {
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
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error en deleteProject:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          
          if (status === 404) {
            await showErrorAlert('Proyecto no encontrado (404).');
          } else if (status === 401) {
            await showErrorAlert('No autorizado (401). Tu sesión expiró.');
          } else if (status === 403) {
            await showErrorAlert('Sin permisos (403). No puedes eliminar este proyecto.');
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudo eliminar el proyecto.`);
          }
        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor.');
        }
      } else {
        await showErrorAlert('Error inesperado al eliminar el proyecto.');
      }

      throw error;
    }
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
    try {
      const response = await axios.delete(`${API_URL_LOCAL2}/tfluna/sensor/project/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error en deleteProjectByTFLuna:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          
          if (status === 404) {
            return { success: true, message: 'No hay datos TF-Luna para eliminar' };
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudieron eliminar los datos TF-Luna.`);
          }
        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor local.');
        }
      }

      throw error;
    }
  },

  async deleteProjectByIMX477(id) {
    try {
      const response = await axios.delete(`${API_URL_LOCAL2}/imx477/sensor/project/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error en deleteProjectByIMX477:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          
          if (status === 404) {
            return { success: true, message: 'No hay datos IMX477 para eliminar' };
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudieron eliminar los datos IMX477.`);
          }
        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor local.');
        }
      }

      throw error;
    }
  },

  async deleteProjectByMPU6050(id) {
    try {
      const response = await axios.delete(`${API_URL_LOCAL2}/mpu/sensor/project/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error en deleteProjectByMPU6050:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          
          if (status === 404) {
            return { success: true, message: 'No hay datos MPU6050 para eliminar' };
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudieron eliminar los datos MPU6050.`);
          }
        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor local.');
        }
      }

      throw error;
    }
  },
};
