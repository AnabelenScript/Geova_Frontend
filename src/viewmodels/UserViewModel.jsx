
import { userService } from '../services/UserService';

export const usersViewModel = {
    async handleRegister(username, nombre, apellidos, email, password) {
        try {
            const user = { username, nombre, apellidos, email, password};
            const response = await userService.register(user);
            return { success: true, data: response };
        } catch (error) {
            return { success: false, error: error.response?.data || error.message };
        }
    },

    async handleLogin(email, password) {
        try {
            const response = await userService.login(email, password);
            localStorage.setItem('token', response.token);
            return { success: true, data: response };
        } catch (error) {
            return { success: false, error: error.response?.data || error.message };
        }
    }
};
