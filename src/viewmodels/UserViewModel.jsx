import Swal from 'sweetalert2';
import { userService } from '../services/UserService';
import alerticon from '../assets/alerticon.svg'
import erroricon from '../assets/erroricon.svg'
import succesfulicon from '../assets/sucessfulicon.svg';
import './alerts.css'

export const usersViewModel = {
    async handleRegister(username, nombre, apellidos, email, password) {
        try {
            const user = { username, nombre, apellidos, email, password };
            const response = await userService.register(user);
             await Swal.fire({
      title: '¡Registro exitoso!',
      text: 'Tu cuenta ha sido creada correctamente.',
      imageUrl: succesfulicon,
      imageWidth: 200,
      imageHeight: 200,
      showConfirmButton: false,
      timer: 2000,
      customClass: {
        popup: 'succesful-popup',
        title: 'succesful-titulo',
        htmlContainer: 'succesful-contenido'
      },
      buttonsStyling: false
    }); 
     
    return { success: true, data: response };
   
    
  } catch (error) {
    await Swal.fire({
      title: 'Error',
      text: error.response?.data || error.message,
      icon: 'error',
      customClass: {
        popup: 'error-popup',
        title: 'error-titulo',
        confirmButton: 'error-confirmar',
        content: 'error-contenido'
      },
      buttonsStyling: false
    });
    return { success: false, error };
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

        await Swal.fire({
            title: '¡Inicio de sesión exitoso!',
            text: `Bienvenid@, ${response.user?.nombre || 'usuario'}`,
            confirmButton: false,
            imageUrl: succesfulicon, 
            imageWidth: 200,
            timer: 1500,
            showConfirmButton: false, 
            imageHeight: 200,
            customClass: {
                popup: 'succesful-popup',
                title: 'succesful-titulo',
                confirmButton: 'succesful-confirmar',
                 htmlContainer: 'succesful-contenido'

            },
        });
        window.location.href = '#/menu';
        return { success: true, data: response };

    } catch (error) {
        await Swal.fire({
            title: 'Error de inicio de sesión',
            text: 'Datos incorrectos',
            confirmButton: false,
            imageUrl: erroricon, 
            imageWidth: 200,
            timer: 2000,
            showConfirmButton: false, 
            imageHeight: 200,
            customClass: {
                popup: 'succesful-popup',
                title: 'succesful-titulo',
                confirmButton: 'succesful-confirmar',
                 htmlContainer: 'succesful-contenido'

            },
            buttonsStyling: false
        });

        return { success: false, error: error.response?.data || error.message };
    }
},

    async handleGetLoggedUser() {
        try {
            const key = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
            if (!key) {
                return { success: false, error: 'Usuario no encontrado en localStorage' };
            }

            const userId = key.split(':')[1];
            const response = await userService.getUserById(userId);
            return { success: true, data: response };
        } catch (error) {
            return { success: false, error: error.response?.data || error.message };
        }
    },

    async handleUpdateUser(id, updatedUser) {
        try {
            const response = await userService.updateUser(id, updatedUser);
            return { success: true, data: response };
        } catch (error) {
            return { success: false, error: error.response?.data || error.message };
        }
    },

    async handleDeleteUser(id) {
        try {
            const response = await userService.deleteUser(id);
            return { success: true, data: response };
        } catch (error) {
            return { success: false, error: error.response?.data || error.message };
        }
    },

    
async handleUpdateUserWithAlert(id, updatedUser, setUser, setEditMode) {
    const result = await usersViewModel.handleUpdateUser(id, updatedUser);
    if (result.success) {
        Swal.fire({
            title: '¡Actualizado!',
            text: 'Tu perfil se ha actualizado correctamente.',
            imageUrl: succesfulicon, 
            imageWidth: 200,
            showConfirmButton: false, 
            imageHeight: 200,
            customClass: {
                popup: 'succesful-popup',
                title: 'succesful-titulo',
                confirmButton: 'succesful-confirmar',
                 htmlContainer: 'succesful-contenido'

            },
            buttonsStyling: false
        });
        setUser(updatedUser);
        setEditMode(false);
    } else {
        Swal.fire({
            title: 'Error',
            text: result.error,
            icon: 'error',
            
            customClass: {
                popup: 'error-popup',
                title: 'error-titulo',
                confirmButton: 'error-confirmar',
                content: 'error-contenido',
            },
            buttonsStyling: false
        });
    }
},

    async handleDeleteUserWithAlert(id) {
    const confirm = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción eliminará tu cuenta permanentemente.',
        imageUrl: alerticon, 
        imageWidth: 200,
        imageHeight: 200,
        imageAlt: 'Alerta de eliminación',
        showCancelButton: true,
        showConfirmButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        background: '#ffffffff',
        color: '#333',
        customClass: {
            popup: 'custom-swal-popup',
            confirmButton: 'custom-swal-confirm',
            cancelButton: 'custom-swal-cancel',
            actions: 'custom-swal-actions',
            title: 'custom-swal-title'
        },
        buttonsStyling: false,
    });

    if (confirm.isConfirmed) {
        const response = await usersViewModel.handleDeleteUser(id);
        if (response.success) {
            await Swal.fire({
                title: '¡Eliminado!',
                text: 'Tu cuenta ha sido eliminada.',
                icon: 'success',
                confirmButtonColor: '#3085d6'
            });
            localStorage.clear();
            window.location.href = '/login';
        } else {
            Swal.fire('Error', response.error, 'error');
        }
    }
}


};
