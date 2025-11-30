import { showErrorAlert } from "../utils/alerts";


let socket = null;
let isConnected = false;

const listeners = new Set();

export const graphService = {

 
  connectToGraphWebSocket(url) {
    if (socket && isConnected) return;

    try {
      socket = new WebSocket(url);
    } catch (err) {
      console.error("No se pudo crear WebSocket:", err);
      showErrorAlert("No se pudo crear la conexión WebSocket.");
      return;
    }

    socket.onopen = () => {
      isConnected = true;
      console.log("WebSocket conectado");
    };

  
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        listeners.forEach((cb) => cb(data));
      } catch (e) {
        listeners.forEach((cb) => cb({ raw: event.data }));
      }
    };

    socket.onclose = () => {
      isConnected = false;
      console.log("WebSocket cerrado");
      showErrorAlert("Conexión WebSocket cerrada. Recarga la página para reconectar.");
    };

  
    socket.onerror = (error) => {
      console.error("Error en WebSocket:", error);
      showErrorAlert("Error en la conexión WebSocket. Verifica tu red.");
    };
  },

  subscribe(callback) {
    if (typeof callback !== "function") {
      console.error("❌ graphService.subscribe recibió algo que NO es función");
      return;
    }
    listeners.add(callback);
  },

  unsubscribe(callback) {
    listeners.delete(callback);
  },

  isConnected() {
    return isConnected;
  },

  close() {
    if (socket) {
      socket.close();
      socket = null;
      isConnected = false;
    }
  }
};
