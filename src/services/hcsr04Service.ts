// src/services/hcsr04Service.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export type HCSensorData = {
  id_project: number;
  distancia_cm: number;
  distancia_m?: number;
  tiempo_vuelo_us?: number;
  event: boolean;
  timestamp?: string;
}

export type MeasurementResponse = {
  project_id: number;
  total_measurements: number;
  measurements: HCSensorData[];
}

export type ApiResponse = {
  msg?: string;
  success?: boolean;
  error?: string;
}

export type ConnectionStatus = {
  isApiOnline: boolean;
  isEsp32Connected: boolean;
  lastError?: string;
}

export const hcsr04Service = {
  // Obtener una lectura en tiempo real
  async getCurrentReading(projectId: number = 1, event: boolean = false): Promise<HCSensorData | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
      
      const response = await fetch(
        `${API_BASE_URL}/hc/sensor?project_id=${projectId}&event=${event}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        return null; // No hay datos, pero no es un error crítico
      }
      
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('API_TIMEOUT');
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
        throw new Error('API_OFFLINE');
      }
      throw error;
    }
  },

  // Verificar conexión con timeout corto
  async checkConnection(projectId: number = 1): Promise<ConnectionStatus> {
    try {
      const reading = await this.getCurrentReading(projectId, false);
      return {
        isApiOnline: true,
        isEsp32Connected: reading !== null && reading.distancia_cm !== undefined,
      };
    } catch (error: any) {
      return {
        isApiOnline: error.message !== 'API_OFFLINE' && error.message !== 'API_TIMEOUT',
        isEsp32Connected: false,
        lastError: error.message
      };
    }
  },

  // Crear/guardar una medición manual
  async createMeasurement(data: HCSensorData): Promise<ApiResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(`${API_BASE_URL}/hc/sensor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error creando medición HC-SR04:', error);
      throw error;
    }
  },

  // Obtener todas las mediciones de un proyecto
  async getMeasurementsByProject(projectId: number): Promise<MeasurementResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE_URL}/hc/sensor/${projectId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No se encontraron mediciones para este proyecto');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error obteniendo mediciones por proyecto:', error);
      throw error;
    }
  },

  // Obtener la medición más reciente de un proyecto
  async getLatestMeasurement(projectId: number): Promise<HCSensorData> {
    try {
      const response = await fetch(`${API_BASE_URL}/hc/sensor/${projectId}/latest`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No se encontró ninguna medición para este proyecto');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error obteniendo última medición:', error);
      throw error;
    }
  },

  // Eliminar todas las mediciones de un proyecto
  async deleteMeasurements(projectId: number): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/hc/sensor/${projectId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error eliminando mediciones:', error);
      throw error;
    }
  },

  // WebSocket mejorado con reconexión inteligente
  createWebSocket(
    onMessage: (data: HCSensorData) => void, 
    onConnectionChange?: (connected: boolean) => void,
    maxRetries: number = 3
  ): WebSocket | null {
    let retryCount = 0;
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;
    let isIntentionalClose = false;

    const connect = (): WebSocket | null => {
      if (retryCount >= maxRetries) {
        console.warn(`WebSocket HC-SR04: Máximo de ${maxRetries} reintentos alcanzado`);
        onConnectionChange?.(false);
        return null;
      }

      const wsUrl = API_BASE_URL.replace('http', 'ws') + '/hc/sensor/ws';
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
          retryCount = 0; // Reset on successful message
          onConnectionChange?.(true);
        } catch (error) {
          console.warn('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.warn(`WebSocket warning (intento ${retryCount + 1}):`, 'Conexión falló');
        // No llamar onConnectionChange aquí para evitar spam
      };

      ws.onopen = () => {
        console.log('✅ WebSocket HC-SR04 conectado');
        retryCount = 0;
        onConnectionChange?.(true);
      };

      ws.onclose = (event) => {
        console.log('WebSocket HC-SR04 desconectado');
        onConnectionChange?.(false);
        
        // Solo reconectar si no fue intencional y no hemos superado los reintentos
        if (!isIntentionalClose && retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 Reintentando WebSocket en 3s... (${retryCount}/${maxRetries})`);
          reconnectTimeout = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      return ws;
    };

    const wsInstance = connect();
    
    // Método para cerrar intencionalmente
    if (wsInstance) {
      (wsInstance as any).closeIntentionally = () => {
        isIntentionalClose = true;
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        wsInstance.close();
      };
    }

    return wsInstance;
  }
};