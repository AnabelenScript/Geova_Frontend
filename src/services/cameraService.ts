
// ============================================
// src/services/cameraService.ts
// ============================================
import axios from 'axios';
import { showErrorAlert } from '../utils/alerts';

const API_BASE_URL = 'http://localhost:8000';

export interface StreamingStatus {
  active: boolean;
  fps: number;
}

export interface ApiResponse {
  status: 'success' | 'error';
  message: string;
  active?: boolean;
}

class CameraService {
  private baseUrl: string = API_BASE_URL;

  constructor() {
    console.log(`🔗 Camera Service inicializado con URL: ${this.baseUrl}`);
  }

  /**
   * Verifica la conectividad con el servidor
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/imx477/streaming/status`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.warn('⚠️ No se pudo conectar con raspberrypi.local');
      await showErrorAlert('No se pudo conectar con el servidor de la cámara');
      return false;
    }
  }

  /**
   * Inicia el streaming de la cámara
   */
  async startStreaming(): Promise<ApiResponse> {
    try {
      console.log(`📷 Iniciando streaming en: ${this.baseUrl}/imx477/streaming/start`);
      
      const response = await axios.post(
        `${this.baseUrl}/imx477/streaming/start`,
        {},
        {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      console.log('📷 Respuesta del servidor:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al iniciar streaming:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // El servidor respondió con un código de error
          const status = error.response.status;
          
          if (status === 404) {
            await showErrorAlert('Endpoint no encontrado (404). Verifica la URL del servidor.');
          } else if (status === 500) {
            await showErrorAlert('Error interno del servidor (500). La cámara puede estar ocupada.');
          } else if (status === 502) {
            await showErrorAlert('Bad Gateway (502). El servidor no está disponible.');
          } else if (status === 503) {
            await showErrorAlert('Servicio no disponible (503). Intenta nuevamente en unos segundos.');
          } else if (status === 522) {
            await showErrorAlert('Timeout de conexión (522). El servidor no responde.');
          } else {
            await showErrorAlert(`Error del servidor (${status}). No se pudo iniciar el streaming.`);
          }
        } else if (error.request) {
          // La petición se hizo pero no hubo respuesta
          await showErrorAlert('No se recibió respuesta del servidor. Verifica tu conexión de red.');
        } else {
          await showErrorAlert('Error al configurar la petición. Intenta nuevamente.');
        }
      } else {
        await showErrorAlert('Error inesperado al iniciar el streaming.');
      }
      
      throw new Error(`No se pudo iniciar el streaming: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Detiene el streaming de la cámara
   */
  async stopStreaming(): Promise<ApiResponse> {
    try {
      console.log(`⏹️ Deteniendo streaming en: ${this.baseUrl}/imx477/streaming/stop`);
      
      const response = await axios.post(
        `${this.baseUrl}/imx477/streaming/stop`,
        {},
        {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      console.log('⏹️ Streaming detenido correctamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al detener streaming:', error);
      // No es crítico si falla al detener, solo mostramos advertencia
      return {
        status: 'success',
        message: 'Streaming detenido (con advertencias)',
        active: false
      };
    }
  }

  /**
   * Obtiene el estado del streaming
   */
  async getStreamingStatus(): Promise<StreamingStatus> {
    try {
      const response = await axios.get(`${this.baseUrl}/imx477/streaming/status`, {
        timeout: 3000
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener estado del streaming:', error);
      return { active: false, fps: 0 };
    }
  }

  /**
   * Obtiene la URL del video stream
   */
  getStreamUrl(): string {
    return `${this.baseUrl}/imx477/streaming/video`;
  }

  /**
   * Obtiene la URL base actual
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const cameraService = new CameraService();

// ============================================
// WebSocket para gráficas (graphService)
// ============================================
let socket: WebSocket | null = null;
let isConnected = false;
const listeners = new Set<(data: any) => void>();

export const graphService = {
  connectToGraphWebSocket(url: string) {
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
      showErrorAlert('Conexión WebSocket cerrada. Recarga la página para reconectar.');
    };

    socket.onerror = (error) => {
      console.error('❌ Error en WebSocket:', error);
      showErrorAlert('Error en la conexión WebSocket. Verifica tu red.');
    };
  },

  subscribe(callback: (data: any) => void) {
    listeners.add(callback);
  },

  unsubscribe(callback: (data: any) => void) {
    listeners.delete(callback);
  },

  isConnected() {
    return isConnected;
  }
};