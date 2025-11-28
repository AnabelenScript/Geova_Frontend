import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmAlert,
  showDeleteConfirmAlert,
  showLoadingAlert,
  closeLoadingAlert
} from "../utils/alerts";

import { userService } from '../services/UserService';

export const usersViewModel = {

  // -----------------------------
  // REGISTRO
  // -----------------------------
  async handleRegister(username, nombre, apellidos, email, password) {
    try {
      const user = { username, nombre, apellidos, email, password };

      showLoadingAlert();
      const response = await userService.register(user);
      closeLoadingAlert();

      await showSuccessAlert("Tu cuenta ha sido creada correctamente.");

      return { success: true, data: response };

    } catch (error) {
      closeLoadingAlert();

      const backendMsg = error.response?.data?.details || error.response?.data?.error || error.message;

      await showErrorAlert(backendMsg);

      return { success: false, error: backendMsg };
    }
  },

  // -----------------------------
  // LOGIN
  // -----------------------------
  async handleLogin(email, password) {
    try {
      showLoadingAlert();
      const response = await userService.login(email, password);
      closeLoadingAlert();

      localStorage.setItem('token', response.token);

      if (response.user?.id) {
        const userKey = `loggeduser:${response.user.id}`;
        localStorage.setItem(userKey, JSON.stringify(response.user));
      }

      await showSuccessAlert(`Bienvenid@, ${response.user?.nombre || "usuario"}`);

      window.location.href = '#/menu';
      return { success: true, data: response };

    } catch (error) {
      closeLoadingAlert();

      const msg = error.response?.data?.details || "Datos incorrectos";
      await showErrorAlert(msg);

      return { success: false, error: msg };
    }
  },

  // -----------------------------
  // OBTENER USUARIO LOGGEADO
  // -----------------------------
  async handleGetLoggedUser() {
    try {
      const key = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
      if (!key) return { success: false, error: "Usuario no encontrado en localStorage" };

      const userId = key.split(":")[1];
      const response = await userService.getUserById(userId);

      return { success: true, data: response };

    } catch (error) {
      const msg = error.response?.data?.details || error.message;
      return { success: false, error: msg };
    }
  },

  // -----------------------------
  // ACTUALIZAR USUARIO
  // -----------------------------
  async handleUpdateUser(id, updatedUser) {
    try {
      const response = await userService.updateUser(id, updatedUser);
      return { success: true, data: response };
    } catch (error) {
      const msg = error.response?.data?.details || error.response?.data?.error || error.message;
      return { success: false, error: msg };
    }
  },

  // Con alerta integrada
  async handleUpdateUserWithAlert(id, updatedUser, setUser, setEditMode) {
    const result = await usersViewModel.handleUpdateUser(id, updatedUser);

    if (result.success) {
      await showSuccessAlert("Tu perfil se ha actualizado correctamente.");
      setUser(updatedUser);
      setEditMode(false);
    } else {
      await showErrorAlert(result.error);
    }
  },

  // -----------------------------
  // ELIMINAR USUARIO
  // -----------------------------
  async handleDeleteUser(id) {
    try {
      const response = await userService.deleteUser(id);
      return { success: true, data: response };
    } catch (error) {
      const msg = error.response?.data?.details || error.response?.data?.error || error.message;
      return { success: false, error: msg };
    }
  },

  // Con alerta integrada
  async handleDeleteUserWithAlert(id) {
    const confirm = await showDeleteConfirmAlert(
      "Esta acción eliminará tu cuenta permanentemente."
    );

    if (confirm.isConfirmed) {
      const response = await usersViewModel.handleDeleteUser(id);

      if (response.success) {
        await showSuccessAlert("Tu cuenta ha sido eliminada.");
        localStorage.clear();
        window.location.href = "/login";
      } else {
        await showErrorAlert(response.error);
      }
    }
  }, 

  async validateLoginOrRegister(form, isLogin) {
  let errors = {};
  let ok = true;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
  const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,}$/;

  // EMAIL
  if (!form.email.trim()) {
    errors.email = true;
    ok = false;
  } else if (!emailRegex.test(form.email)) {
    errors.email = true;
    ok = false;
  }

  // PASSWORD
  if (!form.password.trim() || form.password.length < 6) {
    errors.password = true;
    ok = false;
  }

  if (!isLogin) {
    // USERNAME
    if (!form.username.trim() || !usernameRegex.test(form.username)) {
      errors.username = true;
      ok = false;
    }

    // NAME
    if (!form.nombre.trim() || !nameRegex.test(form.nombre)) {
      errors.nombre = true;
      ok = false;
    }

    // LAST NAME
    if (!form.apellidos.trim() || !nameRegex.test(form.apellidos)) {
      errors.apellidos = true;
      ok = false;
    }
  }

  return { ok, errors };
}

};
