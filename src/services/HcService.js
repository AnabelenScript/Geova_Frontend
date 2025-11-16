// src/services/HcService.js
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
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo mediciones HC-SR04:', error);
      throw error;
    }
  }

  async getLatestMeasurement(projectId = 1) {
    try {
      const response = await fetch(`${this.baseUrl}/hc/sensor/${projectId}/latest`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo última medición HC-SR04:', error);
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creando medición HC-SR04:', error);
      throw error;
    }
  }

  async deleteMeasurements(projectId = 1) {
    try {
      const response = await fetch(`${this.baseUrl}/hc/sensor/${projectId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error eliminando mediciones HC-SR04:', error);
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
        }
      };

      this.websocket.onerror = (error) => {
        console.error('❌ Error en WebSocket HC-SR04:', error);
        this.notifySubscribers({ type: 'error', payload: error });
      };

    } catch (error) {
      console.error('Error conectando WebSocket HC-SR04:', error);
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

  // Patrón Observer para suscripciones
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

  // Utilidades
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
      }, timeout);
    });
  }
}

// Singleton
export const hcService = new HcService();