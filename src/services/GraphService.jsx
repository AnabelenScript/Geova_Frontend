import axios from 'axios';

const API_URL = 'http://localhost:8000/graphs'; 

export const graphService = {
  async createGraph(data) {
    const response = await axios.post(API_URL, data);
    return response.data;
  },

  async getAllGraphs() {
    const response = await axios.get(API_URL);
    return response.data;
  },

  async getGraphById(id) {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  async updateGraph(id, data) {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  async deleteGraph(id) {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  },
};
