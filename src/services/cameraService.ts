// src/services/cameraService.ts - Versión simplificada
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001';

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
      return false;
    }
  }

  /**
   * Inicia el streaming de la cámara - simplificado
   */
  async startStreaming(): Promise<ApiResponse> {
    try {
      console.log(`📷 Iniciando streaming en: ${this.baseUrl}/imx477/streaming/start`);
      const response = await axios.post(`${this.baseUrl}/imx477/streaming/start`, {}, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('📷 Respuesta del servidor:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al iniciar streaming:', error);
      throw new Error(`No se pudo iniciar el streaming: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Detiene el streaming de la cámara
   */
  async stopStreaming(): Promise<ApiResponse> {
    try {
      console.log(`⏹️ Deteniendo streaming en: ${this.baseUrl}/imx477/streaming/stop`);
      const response = await axios.post(`${this.baseUrl}/imx477/streaming/stop`, {}, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('⏹️ Streaming detenido correctamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error al detener streaming:', error);
      // No es crítico si falla al detener
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