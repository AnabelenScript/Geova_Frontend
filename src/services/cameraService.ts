// src/services/cameraService.ts
import axios from 'axios';

// URL fija del servidor de la Raspberry Pi
const API_BASE_URL = 'http://raspberrypi.local:8000';

export interface StreamingStatus {
  active: boolean;
  fps: number;
}

export interface ApiResponse {
  status: 'success' | 'error';
  message: string;
}

class CameraService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
    console.log(`🔗 Camera Service inicializado con URL: ${this.baseUrl}`);
  }

  /**
   * Verifica la conectividad con el servidor
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/imx477/streaming/status`, {
        timeout: 3000
      });
      return response.status === 200;
    } catch (error) {
      console.warn('⚠️ No se pudo conectar con raspberrypi.local, intentando con localhost...');
      
      // Fallback a localhost si raspberrypi.local no funciona
      try {
        this.baseUrl = 'http://localhost:8000';
        const fallbackResponse = await axios.get(`${this.baseUrl}/imx477/streaming/status`, {
          timeout: 3000
        });
        console.log('✅ Conectado a localhost como fallback');
        return fallbackResponse.status === 200;
      } catch (fallbackError) {
        console.error('❌ No se pudo conectar ni a raspberrypi.local ni a localhost');
        return false;
      }
    }
  }

  /**
   * Inicia el streaming de la cámara
   */
  async startStreaming(): Promise<ApiResponse> {
    try {
      // Verificar conexión antes de iniciar
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        throw new Error('No se puede conectar al servidor de la Raspberry Pi');
      }

      const response = await axios.post(`${this.baseUrl}/imx477/streaming/start`, {}, {
        timeout: 10000 // 10 segundos para iniciar streaming
      });
      
      console.log('📷 Streaming iniciado correctamente');
      return response.data;
    } catch (error) {
      console.error('Error al iniciar streaming:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ENOTFOUND') {
          throw new Error('No se pudo resolver raspberrypi.local. Verifique que la Raspberry Pi esté encendida y conectada a la red.');
        } else if (error.code === 'ECONNREFUSED') {
          throw new Error('Conexión rechazada. Verifique que el servidor FastAPI esté ejecutándose en la Raspberry Pi.');
        } else if (error.code === 'ETIMEDOUT') {
          throw new Error('Tiempo de espera agotado. La Raspberry Pi puede estar sobrecargada o la red es lenta.');
        }
      }
      throw new Error('No se pudo iniciar el streaming de la cámara');
    }
  }

  /**
   * Detiene el streaming de la cámara
   */
  async stopStreaming(): Promise<ApiResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/imx477/streaming/stop`, {}, {
        timeout: 5000
      });
      
      console.log('⏹️ Streaming detenido correctamente');
      return response.data;
    } catch (error) {
      console.error('Error al detener streaming:', error);
      throw new Error('No se pudo detener el streaming de la cámara');
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
      console.error('Error al obtener estado del streaming:', error);
      throw new Error('No se pudo obtener el estado del streaming');
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