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
    }
};
