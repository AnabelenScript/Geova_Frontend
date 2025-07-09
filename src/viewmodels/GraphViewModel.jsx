import { graphService } from '../services/GraphService';

export const graphViewModel = {
  async handleGetGraphsByProjectId(projectId) {
    try {
      const allGraphs = await graphService.getAllGraphs();
      const filtered = allGraphs.filter(graph => graph.project_id === projectId);
      return { success: true, data: filtered };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener gráficas',
      };
    }
  },
};
