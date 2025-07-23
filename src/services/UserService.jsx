import axios from 'axios';

const API_URL = 'https://geova-api1.namixcode.cc/users';

export const userService = {
    async register(user) {
        const response = await axios.post(`${API_URL}`, user);
        return response.data;
    },

    async login(email, password) {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        return response.data;
    },

    async getUserById(id) {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    },

    // 🔹 Nuevo método para actualizar usuario
    async updateUser(id, updatedUser) {
        const response = await axios.put(`${API_URL}/${id}`, updatedUser);
        return response.data;
    },

    // 🔹 Nuevo método para eliminar usuario
    async deleteUser(id) {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    }
};
