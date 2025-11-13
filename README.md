# 🌍 GEOVA - Sistema de Medición Topográfica con Sensores IoT

<div align="center">

![GEOVA Banner](./public/Maquina.png)

**Sistema inteligente de medición y monitoreo topográfico en tiempo real**

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Características](#-características) • [Instalación](#-instalación) • [Uso](#-uso) • [Arquitectura](#-arquitectura) • [Tecnologías](#-tecnologías)

</div>

---

## Descripción

**GEOVA** es una plataforma web moderna diseñada para la medición, visualización y análisis de datos topográficos utilizando sensores IoT. El sistema permite monitorear terrenos en tiempo real mediante múltiples sensores especializados, ofreciendo una interfaz intuitiva para la gestión de proyectos, visualización de datos geográficos y análisis de irregularidades del terreno.

### Propósito

Facilitar el trabajo de ingenieros, topógrafos y profesionales del sector mediante:
- **Medición precisa** de distancias y elevaciones con sensores ultrasónicos y LiDAR
- **Monitoreo en tiempo real** de orientación y movimiento con giroscopios
- **Captura visual** del terreno con cámaras integradas
- **Visualización interactiva** de datos mediante gráficas y mapas
- **Gestión eficiente** de múltiples proyectos topográficos

---

## Características

### Funcionalidades Principales

- **Sistema de Autenticación**
  - Login seguro con gestión de sesiones
  - Perfiles de usuario personalizados
  - Control de acceso basado en roles

- **Dashboard Interactivo**
  - Vista general de proyectos activos
  - Estadísticas en tiempo real
  - Acceso rápido a funcionalidades principales

- **Gestión de Proyectos**
  - Crear, editar y eliminar proyectos topográficos
  - Visualización detallada con mapas interactivos (Leaflet)
  - Historial completo de mediciones

- **Medición de Terrenos**
  - **Modo Dual**: Medición simultánea con múltiples sensores
  - **Detección de Irregularidades**: Análisis automático del terreno
  - Integración con sensores:
    - HC-SR04 (Sensor ultrasónico)
    - TF-Luna (LiDAR)
    - MPU6050 (Giroscopio/Acelerómetro)
    - IMX477 (Cámara de alta resolución)

- **Visualización de Datos**
  - Gráficas interactivas con Recharts
  - Exportación de datos
  - Comparación entre mediciones
  - Análisis histórico

- **Captura de Imágenes**
  - Toma de fotografías del terreno
  - Galería de imágenes por proyecto
  - Metadatos georreferenciados

---

## Tecnologías

### Frontend Stack

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **React** | 19.1.0 | Framework UI principal |
| **TypeScript** | 5.8.3 | Tipado estático y desarrollo robusto |
| **Vite** | 6.3.5 | Build tool y dev server ultrarrápido |
| **React Router DOM** | 7.6.3 | Navegación y enrutamiento SPA |
| **Recharts** | 3.1.0 | Visualización de datos y gráficas |
| **Leaflet** | 1.9.4 | Mapas interactivos |
| **Axios** | 1.10.0 | Cliente HTTP para APIs |
| **SweetAlert2** | 11.22.2 | Notificaciones y alertas elegantes |

### Arquitectura

```
MVVM (Model-View-ViewModel)
├── Models/         - Definición de estructuras de datos
├── Views/          - Componentes de interfaz de usuario
├── ViewModels/     - Lógica de presentación y estado
└── Services/       - Comunicación con APIs y sensores
```

---

## Instalación

### Prerrequisitos

- **Node.js** >= 18.x
- **npm** >= 9.x o **yarn** >= 1.22.x
- **Git**

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/AnabelenScript/Geova_Frontend.git
cd Geova_Frontend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

4. **Acceder a la aplicación**
```
http://localhost:5173
```

---

## Uso

### Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Inicia el servidor de desarrollo

# Producción
npm run build            # Construye la aplicación para producción
npm run preview          # Preview de la build de producción

# Calidad de Código
npm run lint             # Ejecuta ESLint para verificar código
```

### Flujo de Trabajo Típico

1. **Iniciar Sesión** → Acceder con credenciales de usuario
2. **Dashboard** → Ver resumen de proyectos activos
3. **Crear Proyecto** → Definir nuevo proyecto topográfico
4. **Medir Terreno** → Seleccionar modo de medición (Dual/Irregularidades)
5. **Visualizar Datos** → Analizar gráficas y mapas interactivos

---

## Estructura del Proyecto

```
Geova_Frontend/
├── public/                  # Recursos estáticos
│   ├── Maquina.png
│   └── icono.ico
├── src/
│   ├── assets/             # Imágenes y recursos
│   ├── models/             # Modelos de datos (MVVM)
│   │   ├── ProjectModel.jsx
│   │   ├── UsersModel.jsx
│   │   └── [sensores].jsx
│   ├── services/           # Servicios de API
│   │   ├── ProjectService.jsx
│   │   ├── UserService.jsx
│   │   └── [sensores]Service.js
│   ├── viewmodels/         # Lógica de presentación
│   │   ├── ProjectViewModel.jsx
│   │   ├── UserViewModel.jsx
│   │   └── GraphViewModel.jsx
│   ├── views/              # Componentes de UI
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── CreateProject/
│   │   ├── MedirTerrenoDual/
│   │   ├── MedirIrregularidades/
│   │   ├── GraphViewer/
│   │   ├── VerCamara/
│   │   └── Profile/
│   ├── routes/             # Configuración de rutas
│   │   └── AppRoutes.tsx
│   ├── utils/              # Utilidades y helpers
│   │   └── alerts.jsx
│   ├── App.tsx             # Componente raíz
│   └── main.tsx            # Punto de entrada
├── vite.config.ts          # Configuración de Vite
├── tsconfig.json           # Configuración de TypeScript
└── package.json            # Dependencias del proyecto
```

---

## Integración con Sensores

### Sensores Soportados

| Sensor | Tipo | Función |
|--------|------|---------|
| **HC-SR04** | Ultrasónico | Medición de distancia (2cm - 4m) |
| **TF-Luna** | LiDAR | Medición de distancia precisa (0.2m - 8m) |
| **MPU6050** | Giroscopio/Acelerómetro | Orientación y movimiento 3D |
| **IMX477** | Cámara Sony| Captura de imágenes de alta resolución, y sirve para ver el puntero laser infrarrojo del sensor LIDAR|

### Comunicación

- Protocolo HTTP/HTTPS para APIs REST
- WebSockets para datos en tiempo real
- Formato JSON para intercambio de datos

---

## Capturas de Pantalla

### Dashboard Principal
Vista general del sistema con acceso rápido a proyectos y funcionalidades.

### Visualización de Mapas
Mapas interactivos con puntos de medición georreferenciados.

### Gráficas de Análisis
Representación visual de datos topográficos en tiempo real.

---

## Contribución

¡Las contribuciones son bienvenidas! Si deseas colaborar:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Convenciones de Código

- Seguir las reglas de ESLint configuradas
- Usar TypeScript para nuevos componentes
- Documentar funciones complejas
- Mantener la arquitectura MVVM

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👥 Autores

- **Equipo GEOVA** - *Desarrollo inicial* - [AnabelenScript](https://github.com/AnabelenScript) - [JosephAntony37900] (https://github.com/JosephAntony37900) - [alejandroimen] (https://github.com/alejandroimen)

---

## 📞 Contacto

- **Proyecto**: [Geova_Frontend](https://github.com/AnabelenScript/Geova_Frontend)
- **Issues**: [Reportar un problema](https://github.com/AnabelenScript/Geova_Frontend/issues)

<div align="center">

**Desarrollado con ❤️ para la medición topográfica del futuro**

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub! ⭐

</div>

