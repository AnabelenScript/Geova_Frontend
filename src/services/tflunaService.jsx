import axios from 'axios';

const API_URL = 'http://localhost:8000/tfluna/sensor'; 

export const imxService = {
  async postSensorIMX(data) {
    const tokenKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
    if (!tokenKey) throw new Error('Usuario no autenticado');

    const user = JSON.parse(localStorage.getItem(tokenKey));
    const token = user?.token;

    const response = await axios.post(API_URL, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  async getSensorIMXByProjectId(id_project) {
    const tokenKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
    if (!tokenKey) throw new Error('Usuario no autenticado');

    const user = JSON.parse(localStorage.getItem(tokenKey));
    const token = user?.token;

    const response = await axios.get(`${API_URL}?id_project=${id_project}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },
};
