import axios from 'axios';

const API_URL = 'http://localhost:8000/projects';

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

  async deleteProject(id) {
          const response = await axios.delete(`${API_URL}/${id}`);
          return response.data;
      }

};
