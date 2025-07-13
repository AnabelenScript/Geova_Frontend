import axios from 'axios';

const API_URL = 'https://geova-api1.namixcode.cc/projects';

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
};
