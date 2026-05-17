// ============================================
// src/services/HcService.js
// ============================================
class HcService {
  constructor() {
    this.baseUrl = 'http://localhost:8000';
    this.wsUrl = 'wss://socket.geova.pro/ws';
    this.websocket = null;
    this.subscribers = [];
    this.isWsConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  // Métodos HTTP
  async getMeasurements(projectId = 1) {
    try {
      const response = await fetch(`${this.baseUrl}/hc/sensor/${projectId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No hay datos
        } else if (response.status === 500) {
          await showErrorAlert('Error interno del servidor (500). Intenta nuevamente.');
        } else if (response.status === 502) {
          await showErrorAlert('Bad Gateway (502). El servidor no está disponible.');
        } else if (response.status === 503) {
          await showErrorAlert('Servicio no disponible (503). Intenta más tarde.');
        } else if (response.status === 522) {
          await showErrorAlert('Timeout de conexión (522). El servidor no responde.');
        } else {
          await showErrorAlert(`Error HTTP ${response.status}. No se pudieron obtener las mediciones.`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo mediciones HC-SR04:', error);
      if (error.message.includes('Failed to fetch')) {
        await showErrorAlert('No se pudo conectar con el servidor. Verifica tu conexión de red.');
      }
      throw error;
    }
  }

  async getLatestMeasurement(projectId = 1) {
    try {
      const response = await fetch(`${this.baseUrl}/hc/sensor/${projectId}/latest`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        } else if (response.status >= 500) {
          await showErrorAlert(`Error del servidor (${response.status}). Intenta nuevamente.`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo última medición HC-SR04:', error);
      if (error.message.includes('Failed to fetch')) {
        await showErrorAlert('No se pudo conectar con el servidor.');
      }
      throw error;
    }
  }

  async createMeasurement(measurementData) {
    try {
      const response = await fetch(`${this.baseUrl}/hc/sensor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(measurementData),
      });

      if (!response.ok) {
        if (response.status === 400) {
          await showErrorAlert('Datos inválidos (400). Verifica la información enviada.');
        } else if (response.status >= 500) {
          await showErrorAlert(`Error del servidor (${response.status}). No se pudo guardar la medición.`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creando medición HC-SR04:', error);
      if (error.message.includes('Failed to fetch')) {
        await showErrorAlert('No se pudo conectar con el servidor.');
      }
      throw error;
    }
  }

  async deleteMeasurements(projectId = 1) {
    try {
      const response = await fetch(`${this.baseUrl}/hc/sensor/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status >= 500) {
          await showErrorAlert(`Error del servidor (${response.status}). No se pudieron eliminar las mediciones.`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error eliminando mediciones HC-SR04:', error);
      if (error.message.includes('Failed to fetch')) {
        await showErrorAlert('No se pudo conectar con el servidor.');
      }
      throw error;
    }
  }

  // Métodos WebSocket
  connectToWebSocket() {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      console.log('WebSocket HC-SR04 ya está conectado');
      return;
    }

    try {
      this.websocket = new WebSocket(`${this.wsUrl}`);

      this.websocket.onopen = () => {
        console.log('✅ Conectado al WebSocket HC-SR04');
        this.isWsConnected = true;
        this.reconnectAttempts = 0;
        this.notifySubscribers({ type: 'connection', status: 'connected' });
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 Datos recibidos HC-SR04:', data);
          this.notifySubscribers({ type: 'data', payload: data });
        } catch (error) {
          console.error('Error parseando datos WebSocket HC-SR04:', error);
        }
      };

      this.websocket.onclose = (event) => {
        console.log('🔌 WebSocket HC-SR04 desconectado:', event.code, event.reason);
        this.isWsConnected = false;
        this.notifySubscribers({ type: 'connection', status: 'disconnected' });

        // Reconexión automática
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Reintentando conexión HC-SR04 en ${this.reconnectDelay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          setTimeout(() => this.connectToWebSocket(), this.reconnectDelay);
        } else {
          showErrorAlert('No se pudo reconectar al WebSocket después de varios intentos.');
        }
      };

      this.websocket.onerror = (error) => {
        console.error('❌ Error en WebSocket HC-SR04:', error);
        this.notifySubscribers({ type: 'error', payload: error });
        showErrorAlert('Error en la conexión WebSocket HC-SR04.');
      };
    } catch (error) {
      console.error('Error conectando WebSocket HC-SR04:', error);
      showErrorAlert('No se pudo establecer la conexión WebSocket.');
    }
  }

  disconnectWebSocket() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
      this.isWsConnected = false;
    }
  }

  isConnected() {
    return this.isWsConnected && this.websocket && this.websocket.readyState === WebSocket.OPEN;
  }

  subscribe(callback) {
    this.subscribers.push(callback);
  }

  unsubscribe(callback) {
    this.subscribers = this.subscribers.filter(sub => sub !== callback);
  }

  notifySubscribers(data) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error en callback de suscriptor HC-SR04:', error);
      }
    });
  }

  async waitForConnection(timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        resolve(true);
        return;
      }

      const checkConnection = () => {
        if (this.isConnected()) {
          resolve(true);
        }
      };

      this.subscribe(checkConnection);

      setTimeout(() => {
        this.unsubscribe(checkConnection);
        reject(new Error('Timeout esperando conexión WebSocket HC-SR04'));
        showErrorAlert('Timeout esperando conexión WebSocket.');
      }, timeout);
    });
  }
}

export const hcService = new HcService();