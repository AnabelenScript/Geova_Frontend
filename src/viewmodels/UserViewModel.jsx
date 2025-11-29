import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmAlert,
  showDeleteConfirmAlert,
  showLoadingAlert,
  closeLoadingAlert,
} from "../utils/alerts";

import { userService } from "../services/UserService";

export const usersViewModel = {
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

      const backendMsg =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message;

      await showErrorAlert(backendMsg);

      return { success: false, error: backendMsg };
    }
  },

  async handleLogin(email, password) {
  try {
    showLoadingAlert();

    const response = await userService.login(email, password);

    closeLoadingAlert();

    localStorage.setItem("token", response.token);

    if (response.user?.id) {
      const userKey = `loggeduser:${response.user.id}`;
      localStorage.setItem(userKey, JSON.stringify(response.user));
    }

    await showSuccessAlert(`Bienvenid@, ${response.user?.nombre || "usuario"}`);

    window.location.href = "#/menu";

    return { success: true, data: response };

  } catch (error) {

    closeLoadingAlert();

    const backendMsg =
      error?.response?.data?.error ||
      error?.response?.data?.details ||
      error?.message ||
      "Error inesperado";

    await showErrorAlert(backendMsg);

    return { success: false, error: backendMsg };
  }
},



  async handleGetLoggedUser() {
    try {
      const key = Object.keys(localStorage).find((k) =>
        k.startsWith("loggeduser:")
      );
      if (!key)
        return {
          success: false,
          error: "Usuario no encontrado en localStorage",
        };

      const userId = key.split(":")[1];
      const response = await userService.getUserById(userId);

      return { success: true, data: response };
    } catch (error) {
      const msg = error.response?.data?.details || error.message;
      return { success: false, error: msg };
    }
  },

  async handleUpdateUser(id, updatedUser) {
    try {
      const response = await userService.updateUser(id, updatedUser);
      return { success: true, data: response };
    } catch (error) {
      const msg =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message;
      return { success: false, error: msg };
    }
  },

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

  async handleDeleteUser(id) {
    try {
      const response = await userService.deleteUser(id);
      return { success: true, data: response };
    } catch (error) {
      const msg =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.message;
      return { success: false, error: msg };
    }
  },

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

    if (isLogin) {
      if (!form.email.trim()) {
        errors.email = "Este campo es obligatorio.";
        ok = false;
      } else if (!emailRegex.test(form.email)) {
        errors.email = "Formato de correo inválido.";
        ok = false;
      }

      if (!form.password.trim()) {
        errors.password = "Este campo es obligatorio.";
        ok = false;
      }

      return { ok, errors };
    }

    if (!form.email.trim()) {
      errors.email = "Este campo es obligatorio.";
      ok = false;
    } else if (!emailRegex.test(form.email)) {
      errors.email = "Formato de correo inválido.";
      ok = false;
    }

    if (!form.password.trim()) {
      errors.password = "Este campo es obligatorio.";
      ok = false;
    } else if (form.password.length < 8) {
      errors.password = "Debe tener al menos 8 caracteres.";
      ok = false;
    } else if (!/[A-Z]/.test(form.password)) {
      errors.password = "Debe incluir al menos una mayúscula.";
      ok = false;
    } else if (!/[0-9]/.test(form.password)) {
      errors.password = "Debe incluir al menos un número.";
      ok = false;
    } else if (!/[!@#$%^&*(),.?\":{}|<>]/.test(form.password)) {
      errors.password = "Debe incluir un carácter especial.";
      ok = false;
    }

    if (!form.username.trim()) {
      errors.username = "Este campo es obligatorio.";
      ok = false;
    } else if (!usernameRegex.test(form.username)) {
      errors.username = "Mínimo 3 caracteres (solo letras, números o _).";
      ok = false;
    }

    if (!form.nombre.trim()) {
      errors.nombre = "Este campo es obligatorio.";
      ok = false;
    } else if (!nameRegex.test(form.nombre)) {
      errors.nombre = "Solo letras, mínimo 2 caracteres.";
      ok = false;
    }
    if (!form.apellidos.trim()) {
      errors.apellidos = "Este campo es obligatorio.";
      ok = false;
    } else if (!nameRegex.test(form.apellidos)) {
      errors.apellidos = "Solo letras, mínimo 2 caracteres.";
      ok = false;
    }
    return { ok, errors };
  },
};