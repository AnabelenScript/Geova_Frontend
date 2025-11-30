import { projectService } from '../services/ProjectService';
import { imxService } from '../services/imx.Service';
import { tflunaService } from '../services/tflunaService';
import { mpuSensorService } from '../services/MPU6050Service';
import Swal from 'sweetalert2';
import alerticon from '../assets/alerticon.svg'; 
import succesfulicon from '../assets/sucessfulicon.svg'
import './alerts.css'
import { showSuccessAlert, showErrorAlert, showConfirmAlert, showCautionAlert} from '../utils/alerts';


let selectedProjectId = null;
let allProjects = [];
let filteredProjects = [];
let searchTerm = '';
let filterType = '';

export const projectViewModel = {
  async handleCreateProject(nombreProyecto, categoria, descripcion, imgFile, lat, lng) {
  if (!nombreProyecto || !categoria || !descripcion || !imgFile || lat == null || lng == null) {
    await showConfirmAlert(
      'Campos obligatorios',
      'Todos los campos son obligatorios, incluyendo imagen y ubicación.'
    );
    return { success: false, error: 'Faltan campos obligatorios' };
  }
  const userKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
  if (!userKey) {
    await showErrorAlert('No se encontró información del usuario. Por favor, inicie sesión de nuevo.');
    return { success: false, error: 'Usuario no autenticado' };
  }

  const user = JSON.parse(localStorage.getItem(userKey));
  const userId = user.id;

  try {
    const formData = new FormData();
    formData.append('nombreProyecto', nombreProyecto);
    formData.append('categoria', categoria);
    formData.append('descripcion', descripcion);
    formData.append('fecha', new Date().toISOString());
    formData.append('lat', parseFloat(lat));
    formData.append('lng', parseFloat(lng));
    formData.append('img', imgFile);
    formData.append('userId', userId);

    const response = await projectService.createProject(formData);

    await showSuccessAlert('Proyecto creado exitosamente.');
    return { success: true, data: response };
  } catch (error) {
    await showErrorAlert(error.response?.data?.error || error.message || 'Error al crear el proyecto');
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al crear el proyecto'
    };
  }
},


  async handleGetAllProjects() {
  try {
    const userKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
    if (!userKey) {
      throw new Error('Usuario no autenticado');
    }
    const user = JSON.parse(localStorage.getItem(userKey));
    const userId = user?.id;
    if (!userId) {
      throw new Error('No se pudo obtener el ID del usuario');
    }
    const response = await projectService.getAllProjectsByIdUser(userId);
    allProjects = response;
    filteredProjects = [...allProjects];
    return { success: true, data: filteredProjects };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al obtener los proyectos',
    };
  }
},


  async handleGetProjectById(id) {
    try {
      const response = await projectService.getProjectById(id);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al obtener el proyecto',
      };
    }
  },

  handleSelectProject(id, navigate) {
    selectedProjectId = id;
    navigate(`/dashboard/detalles/${id}`);
  },

  getSelectedProjectId() {
    return selectedProjectId;
  },

  handleCamera(navigate) {
    navigate('takephoto');
  },
  handleCameraDual(navigate) {
    navigate('takephotodual');
  },

  sortProjectsByDate(type, projects) {
    let sorted;
    if (type === "antiguos") {
      sorted = [...projects].sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));
    } else if (type === "recientes") {
      sorted = [...projects].sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));
    }
    return sorted;
  },

  handleSearchChange(value) {
    searchTerm = value.toLowerCase();
    projectViewModel.applyFilters();
    return filteredProjects;
  },

  handleFilterChange(value) {
    filterType = value;
    projectViewModel.applyFilters();
    return filteredProjects;
  },

  applyFilters() {
    let result = [...allProjects];

    if (searchTerm) {
      result = result.filter(p =>
        p.NombreProyecto.toLowerCase().includes(searchTerm) ||
        p.Categoria.toLowerCase().includes(searchTerm)
      );
    }

    if (filterType === 'recientes' || filterType === 'antiguos') {
      result = projectViewModel.sortProjectsByDate(filterType, result);
    }

    filteredProjects = result;
  },

  filterAndSortProjects(projects, searchTerm, sortOption) {
    let result = [...projects];

    if (searchTerm.trim()) {
      result = result.filter((project) =>
        project.NombreProyecto.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortOption === 'az') {
      result.sort((a, b) =>
        a.NombreProyecto.localeCompare(b.NombreProyecto)
      );
    } else if (sortOption === 'recientes') {
      result.sort((a, b) => new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime());
    } else if (sortOption === 'antiguos') {
      result.sort((a, b) => new Date(a.Fecha).getTime() - new Date(b.Fecha).getTime());
    }

    return result;
  },

  handleIrregularidades(navigate, id) {
    navigate(`/dashboard/detalles/${id}/irregularidades`);
  },

 async handleUpdateProject(id, nombreProyecto, categoria, descripcion, imgFile, lat, lng) {
    try {
      const userKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
      if (!userKey) throw new Error('Usuario no autenticado');

      const user = JSON.parse(localStorage.getItem(userKey));
      const userId = user?.id;
      if (!userId) throw new Error('No se pudo obtener el ID del usuario');

      const formData = new FormData();
      formData.append('nombreProyecto', nombreProyecto);
      formData.append('categoria', categoria);
      formData.append('descripcion', descripcion);
      formData.append('fecha', new Date().toISOString());
      formData.append('lat', parseFloat(lat));
      formData.append('lng', parseFloat(lng));
      formData.append('userId', userId);

      if (imgFile) {
        formData.append('img', imgFile);
      }

      const response = await projectService.updateProject(id, formData);
      await showSuccessAlert('El proyecto ha sido actualizado exitosamente.');
      return { success: true, data: response };
    } catch (error) {
      await showErrorAlert(error.response?.data?.error || error.message || 'Error al actualizar el proyecto');
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al actualizar el proyecto'
      };
    }
  },

  async handleDeleteProject(id, navigate, isLocalAPIAlreadyChecked = null) {
    try {
      // Usar el estado ya verificado si se proporciona, sino verificar de nuevo
      const isLocalAPIAvailable = isLocalAPIAlreadyChecked !== null 
        ? isLocalAPIAlreadyChecked 
        : await projectService.checkLocalAPIAvailability();
      
      if (!isLocalAPIAvailable) {
        await showErrorAlert(
          'No se puede eliminar el proyecto porque la Raspberry Pi no está conectada. ' +
          'Conéctate a la Raspberry Pi para verificar si hay datos de sensores asociados.'
        );
        return { success: false, error: 'API local no disponible' };
      }

      // Verificar si hay datos de sensores asociados al proyecto
      const [tfLunaData, imxData, mpuData] = await Promise.all([
        projectService.checkSensorData('tfluna', id),
        projectService.checkSensorData('imx477', id),
        projectService.checkSensorData('mpu', id)
      ]);

      const hasSensorData = tfLunaData.exists || imxData.exists || mpuData.exists;

      let confirmMessage = '¿Estás seguro?';
      let confirmText = 'Este proyecto se eliminará permanentemente.';
      
      if (hasSensorData) {
        confirmText += '\n\nSe encontraron datos de sensores asociados que también serán eliminados:';
        if (tfLunaData.exists) confirmText += '\n• TF-Luna';
        if (imxData.exists) confirmText += '\n• IMX477';
        if (mpuData.exists) confirmText += '\n• MPU6050';
      } else {
        confirmText += '\n\nNo se encontraron datos de sensores asociados.';
      }

      const confirm = await showConfirmAlert(
        confirmMessage,
        confirmText,
        'Esta acción no se puede deshacer.'
      );

      if (!confirm.isConfirmed) return { success: false };

      // Eliminar proyecto de la API de Go
      await projectService.deleteProject(id);

      // Solo intentar eliminar datos de sensores si existen
      if (hasSensorData) {
        const deletePromises = [];
        if (tfLunaData.exists) deletePromises.push(projectService.deleteProjectByTFLuna(id));
        if (imxData.exists) deletePromises.push(projectService.deleteProjectByIMX477(id));
        if (mpuData.exists) deletePromises.push(projectService.deleteProjectByMPU6050(id));
        
        await Promise.all(deletePromises);
      }
      
      await showSuccessAlert('Proyecto eliminado exitosamente.');
      await projectViewModel.handleGetAllProjects();
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      await showErrorAlert(error.response?.data?.error || error.message || 'Error al eliminar el proyecto');
      return { success: false };
    }
  },

  async handlePostSensorIMX(sensorData) {
    try {
        console.log('📤 Enviando datos al sensor IMX:', sensorData); // 🔍 DEBUG

    const response = await imxService.postSensorIMX(sensorData);

    return { success: true, data: response };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al guardar datos del sensor'
    };
  }
},



  async handleGetSensorIMXByProjectId(id_project) {
  try {
    const response = await imxService.getSensorIMXByProjectId(id_project);
    // La API devuelve {success, data}, extraemos el array de data
    const data = response?.data || response;
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (error) {
    return {
      success: false,
      data: []
    };
  }
},

async handlePostSensorTFLuna(sensorData) {
  try {
    console.log('📤 Enviando datos al sensor TfLuna:', sensorData);

    const response = await tflunaService.postSensortfluna(sensorData);

    return { success: true, data: response };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al guardar datos del sensor'
    };
  }
},

async handleGetSensorTFLunaByProjectId(id_project) {
  try {
    const response = await tflunaService.getSensorTFLunaByProjectId(id_project);
    // La API devuelve {success, data}, extraemos el array de data
    const data = response?.data || response;
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (error) {
    return {
      success: false,
      data: []
    };
  }
},

async handlePostSensorMPU(sensorData) {
  try {
    console.log('📤 Enviando datos al sensor MPU:', sensorData);

    const response = await mpuSensorService.postSensorMPU(sensorData);

    return { success: true, data: response };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al guardar datos del sensor'
    };
  }
},

async handleGetSensorMPUByProjectId(id_project) {
  try {
    const response = await mpuSensorService.getSensorMPUByProjectId(id_project);
    // La API devuelve {success, data}, extraemos el array de data
    const data = response?.data || response;
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (error) {
    return {
      success: false,
      data: []
    };
  }
},

async handleUpdateSensorTFLuna(sensor_id, sensorData) {
  try {
    console.log('📤 Actualizando datos del sensor TFLuna:', sensorData);
    const response = await tflunaService.updateSensorTFLuna(sensor_id, sensorData);
    return { success: true, data: response };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al actualizar datos del sensor TFLuna'
    };
  }
},

async handleUpdateDualSensorTFLuna(sensor_id, sensorData) {
  try {
    console.log('📤 Actualizando datos dual del sensor TFLuna:', sensorData);
    const response = await tflunaService.updateDualSensorTFLuna(sensor_id, sensorData);
    return { success: true, data: response };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al actualizar datos dual del sensor TFLuna'
    };
  }
},

async handleUpdateSensorMPU(sensor_id, sensorData) {
  try {
    console.log('📤 Actualizando datos del sensor MPU:', sensorData);
    const response = await mpuSensorService.updateSensorMPU(sensor_id, sensorData);
    return { success: true, data: response };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al actualizar datos del sensor MPU'
    };
  }
},

async handleUpdateDualSensorMPU(sensor_id, sensorData) {
  try {
    console.log('📤 Actualizando datos dual del sensor MPU:', sensorData);
    const response = await mpuSensorService.updateDualSensorMPU(sensor_id, sensorData);
    return { success: true, data: response };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al actualizar datos dual del sensor MPU'
    };
  }
},

async handleUpdateSensorIMX(sensor_id, sensorData) {
  try {
    console.log('📤 Actualizando datos del sensor IMX:', sensorData);
    const response = await imxService.updateSensorIMX(sensor_id, sensorData);
    return { success: true, data: response };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al actualizar datos del sensor IMX'
    };
  }
},

async handleUpdateDualSensorIMX(sensor_id, sensorData) {
  try {
    console.log('📤 Actualizando datos dual del sensor IMX:', sensorData);
    const response = await imxService.updateDualSensorIMX(sensor_id, sensorData);
    return { success: true, data: response };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error al actualizar datos dual del sensor IMX'
    };
  }
},

async handleGetWeeklyStats() {
  try {
    const userKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
    if (!userKey) {
      throw new Error('Usuario no autenticado');
    }
    const user = JSON.parse(localStorage.getItem(userKey));
    const userId = user?.id;

    if (!userId) {
      throw new Error('No se pudo obtener el ID del usuario');
    }

    const response = await projectService.getCountLastWeek(userId);
    
    if (!response.success || !response.data) {
      throw new Error('Respuesta inválida del servidor');
    }

    // Obtener los últimos 7 días
    const today = new Date();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]); // formato YYYY-MM-DD
    }

    // Crear un mapa de fechas con sus conteos
    const dailyMap = {};
    response.data.daily.forEach(item => {
      dailyMap[item.date] = item.count;
    });

    // Nombres de días en español
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    // Formatear datos para el gráfico
    const formattedData = last7Days.map(dateStr => {
      const date = new Date(dateStr + 'T00:00:00'); // Evitar problemas de zona horaria
      const diaNombre = diasSemana[date.getDay()];
      const count = dailyMap[dateStr] || 0;

      return {
        dia: diaNombre,
        proyectos: count,
        fecha: dateStr // Por si necesitas la fecha completa
      };
    });

    return { 
      success: true, 
      data: formattedData,
      total: response.data.total_count
    };
  } catch (error) {
    console.error('Error al obtener estadísticas semanales:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener estadísticas semanales',
      data: [],
      total: 0
    };
  }
} 
};
