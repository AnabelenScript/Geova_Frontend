import axios from 'axios';
import { showErrorAlert } from '../utils/alerts';

const API_URL = 'https://go.geova.pro/users';
// http://localhost:8000/users
// https://geova-api1.namixcode.cc/users

export const userService = {
  
  async register(user) {
    try {
      const response = await axios.post(`${API_URL}`, user);
      return response.data;

    } catch (error) {
      console.error('Error en register:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;

          if (status === 400) {
            await showErrorAlert('Datos inválidos (400). Verifica la información del registro.');
          } else if (status === 409) {
            await showErrorAlert('Este correo ya está registrado (409).');
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudo completar el registro.`);
          }

        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor. Verifica tu conexión.');
        }
      } else {
        await showErrorAlert('Error inesperado al registrar usuario.');
      }

      throw error;
    }
  },

  
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      return response.data;

    } catch (error) {
      console.error('Error en login:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;

          if (status === 400) {
            await showErrorAlert('Credenciales inválidas (400).');
          } else if (status === 401) {
            await showErrorAlert('No autorizado (401). Email o contraseña incorrectos.');
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudo iniciar sesión.`);
          }

        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor.');
        }
      } else {
        await showErrorAlert('Error inesperado al iniciar sesión.');
      }

      throw error;
    }
  },


  async getUserById(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;

    } catch (error) {
      console.error('Error en getUserById:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;

          if (status === 404) {
            await showErrorAlert('Usuario no encontrado (404).');
          } else if (status === 401) {
            await showErrorAlert('No autorizado (401). Inicia sesión nuevamente.');
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudo obtener el usuario.`);
          }

        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor.');
        }
      } else {
        await showErrorAlert('Error inesperado al obtener usuario.');
      }

      throw error;
    }
  },

  
  async updateUser(id, updatedUser) {
    try {
      const response = await axios.put(`${API_URL}/${id}`, updatedUser);
      return response.data;

    } catch (error) {
      console.error('Error en updateUser:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;

          if (status === 400) {
            await showErrorAlert('Datos inválidos (400).');
          } else if (status === 401) {
            await showErrorAlert('No autorizado (401).');
          } else if (status === 404) {
            await showErrorAlert('Usuario no encontrado (404).');
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudo actualizar el usuario.`);
          }

        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor.');
        }
      } else {
        await showErrorAlert('Error inesperado al actualizar usuario.');
      }

      throw error;
    }
  },


  async deleteUser(id) {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      return response.data;

    } catch (error) {
      console.error('Error en deleteUser:', error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;

          if (status === 401) {
            await showErrorAlert('No autorizado (401).');
          } else if (status === 403) {
            await showErrorAlert('No tienes permisos (403) para eliminar este usuario.');
          } else if (status === 404) {
            await showErrorAlert('Usuario no encontrado (404).');
          } else if (status >= 500) {
            await showErrorAlert(`Error del servidor (${status}). No se pudo eliminar el usuario.`);
          }

        } else if (error.request) {
          await showErrorAlert('No se recibió respuesta del servidor.');
        }
      } else {
        await showErrorAlert('Error inesperado al eliminar usuario.');
      }

      throw error;
    }
  }

};
