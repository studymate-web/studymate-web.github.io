# StudyMate IA - Frontend

## Descripción

Frontend moderno y responsive para StudyMate IA, una plataforma de asistente académico inteligente.

## Características

### 🎨 Diseño Moderno
- **Bootstrap 5** para diseño responsive
- **Font Awesome** para iconos
- **Gradientes y animaciones** personalizadas
- **Efectos hover** en tarjetas y botones

### 🔐 Autenticación
- **Login/Registro** con modal dinámico
- **JWT Token** almacenado en localStorage
- **Verificación automática** de sesión
- **Cerrar sesión** con limpieza de datos

### 🤖 Funcionalidades de IA
- **Chatbot Académico** con chat en tiempo real
- **Generador de Planes de Estudio** personalizados
- **Resumidor de PDF** con IA
- **Integración completa** con OpenRouter API

### 📱 Responsive Design
- **Mobile-first** approach
- **Adaptable** a todos los dispositivos
- **Navegación optimizada** para móviles

## Estructura de Archivos

```
frontend/
├── index.html          # Página principal
├── css/
│   └── style.css      # Estilos personalizados
├── js/
│   └── app.js         # Lógica de la aplicación
└── README.md          # Este archivo
```

## Configuración

### 1. Requisitos
- Servidor backend corriendo en `http://localhost:8080`
- Navegador web moderno
- Conexión a internet (para CDNs)

### 2. Instalación
1. Coloca los archivos en tu servidor web
2. Asegúrate de que el backend esté corriendo
3. Abre `index.html` en tu navegador

### 3. Configuración de API
El frontend está configurado para conectarse a:
- **Base URL**: `http://localhost:8080/api`
- **Endpoints principales**:
  - `/auth/login` - Iniciar sesión
  - `/auth/register` - Registrarse
  - `/ai/chatbot` - Chatbot académico
  - `/ai/plan-estudio` - Generar plan de estudio
  - `/ai/resumir-pdf` - Resumir contenido

## Funcionalidades

### 🔐 Autenticación
- **Login**: Email y contraseña
- **Registro**: Email, contraseña y confirmación
- **Persistencia**: Token JWT en localStorage
- **Verificación**: Comprobación automática de sesión

### 🤖 Chatbot Académico
- **Chat en tiempo real** con IA
- **Interfaz tipo WhatsApp** con burbujas
- **Loading animations** durante respuestas
- **Scroll automático** a nuevos mensajes
- **Soporte para Enter** para enviar mensajes

### 📅 Plan de Estudio
- **Formulario intuitivo** para materias y horas
- **Generación con IA** de planes personalizados
- **Visualización estructurada** del resultado
- **Validación de campos** obligatorios

### 📄 Resumen de PDF
- **Área de texto** para pegar contenido
- **Resumen inteligente** con IA
- **Formato preservado** en la salida
- **Contador de caracteres** en actividad

### 📊 Actividad Reciente
- **Registro automático** de acciones
- **Iconos descriptivos** por tipo de actividad
- **Fechas formateadas** en español
- **Vista previa** de contenido

## Tecnologías Utilizadas

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos y animaciones
- **JavaScript ES6+** - Lógica de aplicación
- **Bootstrap 5** - Framework CSS
- **Font Awesome 6** - Iconografía

### Integración
- **Fetch API** - Comunicación con backend
- **JWT** - Autenticación segura
- **LocalStorage** - Persistencia de datos
- **Bootstrap Modals** - Interfaces modales

## Personalización

### Colores
Los colores principales están definidos en CSS variables:
```css
:root {
    --primary-color: #007bff;
    --secondary-color: #6c757d;
    --success-color: #28a745;
    --danger-color: #dc3545;
    --warning-color: #ffc107;
    --info-color: #17a2b8;
}
```

### Animaciones
- **Fade-in** para nuevos elementos
- **Hover effects** en tarjetas
- **Loading spinners** personalizados
- **Slide-in** para notificaciones

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 992px
- **Desktop**: > 992px

## Funcionalidades Futuras

### 🚧 En Desarrollo
- **Gestión de Notas** - CRUD completo
- **Gestión de Tareas** - Con recordatorios
- **Gestión de Materias** - Organización académica
- **Calendario Integrado** - Vista de eventos

### 🔮 Próximas Características
- **Tema oscuro** - Modo nocturno
- **Notificaciones push** - Alertas en tiempo real
- **Exportar datos** - PDF, Excel
- **Compartir planes** - Enlaces públicos

## Solución de Problemas

### Error de Conexión
- Verifica que el backend esté corriendo en puerto 8080
- Revisa la consola del navegador para errores CORS
- Asegúrate de que la API esté accesible

### Problemas de Autenticación
- Limpia el localStorage: `localStorage.clear()`
- Verifica que el token JWT sea válido
- Revisa los logs del backend

### Problemas de IA
- Verifica la configuración de OpenRouter
- Revisa los logs del backend para errores de API
- Confirma que la API key esté configurada

## Contribución

Para contribuir al frontend:

1. **Fork** el repositorio
2. **Crea una rama** para tu feature
3. **Haz los cambios** necesarios
4. **Prueba** todas las funcionalidades
5. **Envía un pull request**

## Licencia

Este proyecto está bajo la licencia MIT.

---

**StudyMate IA** - Tu asistente académico inteligente 🧠✨
