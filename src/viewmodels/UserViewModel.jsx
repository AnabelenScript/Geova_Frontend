import { userService } from '../services/UserService';

export const usersViewModel = {
    async handleRegister(username, nombre, apellidos, email, password) {
        try {
            const user = { username, nombre, apellidos, email, password };
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

            if (response.user?.id) {
                const userKey = `loggeduser:${response.user.id}`;
                localStorage.setItem(userKey, JSON.stringify(response.user));
                console.log(`Usuario guardado en localStorage con clave ${userKey}`);
            }

            return { success: true, data: response };
        } catch (error) {
            return { success: false, error: error.response?.data || error.message };
        }
    },

    // ✅ Nuevo handler: obtiene automáticamente el ID del usuario desde localStorage
   async handleGetLoggedUser() {
    try {
        const key = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
        if (!key) {
            return { success: false, error: 'Usuario no encontrado en localStorage' };
        }

        const userId = key.split(':')[1];
        const response = await userService.getUserById(userId);
        
        console.log('👤 Usuario recibido desde la API:', response); // <-- MOVER AQUÍ
        
        return { success: true, data: response };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message };
    }
}

};
