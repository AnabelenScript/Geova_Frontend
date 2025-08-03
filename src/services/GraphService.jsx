let socket = null;
let isConnected = false;

const listeners = new Set();

export const graphService = {
  connectToGraphWebSocket(url) {
    if (socket && isConnected) return;

    socket = new WebSocket(url);

    socket.onopen = () => {
      isConnected = true;
      console.log('✅ WebSocket conectado');
    };

    socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    listeners.forEach((callback) => callback(data));
  } catch (e) {
    listeners.forEach((callback) => callback({ raw: event.data }));
  }
};


    socket.onclose = () => {
      isConnected = false;
      console.log('❌ WebSocket cerrado');
    };
  },

  subscribe(callback) {
    listeners.add(callback);
  },

  unsubscribe(callback) {
    listeners.delete(callback);
  },

  isConnected() {
    return isConnected;
  }
};
