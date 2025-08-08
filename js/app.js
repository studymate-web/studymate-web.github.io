// StudyMate IA - Aplicación JavaScript

// Configuración de la API
const API_BASE_URL = 'https://studymate-back.onrender.com/api';

// Estado de la aplicación
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let inactivityTimer = null;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos

// Elementos del DOM
const authModal = new bootstrap.Modal(document.getElementById('authModal'));
const chatbotModal = new bootstrap.Modal(document.getElementById('chatbotModal'));
const planModal = new bootstrap.Modal(document.getElementById('planModal'));
const pdfModal = new bootstrap.Modal(document.getElementById('pdfModal'));
const notesModal = new bootstrap.Modal(document.getElementById('notesModal'));
const tasksModal = new bootstrap.Modal(document.getElementById('tasksModal'));
const subjectsModal = new bootstrap.Modal(document.getElementById('subjectsModal'));

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// Inicializar la aplicación
function initializeApp() {
    if (authToken) {
        // Verificar si el token es válido
        checkAuthStatus();
    } else {
        showAuthModal();
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Auth form
    document.getElementById('authForm').addEventListener('submit', handleAuth);
    document.getElementById('toggleAuthMode').addEventListener('click', toggleAuthMode);
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Chat
    document.getElementById('sendChatBtn').addEventListener('click', sendChatMessage);
    document.getElementById('chatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    // Plan form
    document.getElementById('planForm').addEventListener('submit', handlePlanGeneration);

    // PDF form
    document.getElementById('pdfForm').addEventListener('submit', handlePdfSummary);

    // Notes form
    document.getElementById('createNoteForm').addEventListener('submit', handleCreateNote);

    // Tasks form
    document.getElementById('createTaskForm').addEventListener('submit', handleCreateTask);

    // Subjects form
    document.getElementById('createSubjectForm').addEventListener('submit', handleCreateSubject);

    // Event listeners para resetear timer de inactividad
    document.addEventListener('mousemove', resetInactivityTimer);
    document.addEventListener('keypress', resetInactivityTimer);
    document.addEventListener('click', resetInactivityTimer);
    document.addEventListener('scroll', resetInactivityTimer);
}

// Manejar autenticación
async function handleAuth(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const isRegisterMode = document.getElementById('authModalTitle').textContent.includes('Registro');
    
    if (isRegisterMode && password !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }

    try {
        showLoading();
        
        const endpoint = isRegisterMode ? '/auth/registro' : '/auth/login';
        const requestBody = isRegisterMode ? {
            nombre: nombre,
            apellido: apellido,
            email: email,
            password: password
        } : {
            email: email,
            password: password
        };
        
        console.log('Sending request to:', `${API_BASE_URL}${endpoint}`);
        console.log('Request body:', requestBody);
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', data);

        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            currentUser = data.usuario;
            localStorage.setItem('currentUser', JSON.stringify(data.usuario));
            
            hideLoading();
            authModal.hide();
            showMainContent();
            showNotification('¡Bienvenido a StudyMate IA!', 'success');
        } else {
            hideLoading();
            console.error('Error response:', data);
            showNotification(data.message || data.error || 'Error de autenticación', 'error');
        }
    } catch (error) {
        hideLoading();
        showNotification('Error de conexión', 'error');
        console.error('Auth error:', error);
    }
}

// Verificar estado de autenticación
async function checkAuthStatus() {
    try {
        // Intentar obtener usuario desde localStorage primero
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            showMainContent();
            return;
        }

        // Si no hay usuario en localStorage, verificar con el servidor
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.usuario; // Now /me returns user data in the usuario field
            localStorage.setItem('currentUser', JSON.stringify(data.usuario));
            showMainContent();
        } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            authToken = null;
            currentUser = null;
            showAuthModal();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showAuthModal();
    }
}

// Mostrar contenido principal
function showMainContent() {
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('userName').textContent = currentUser?.nombre || 'Usuario';
    loadRecentActivity();
    resetInactivityTimer(); // Iniciar timer de inactividad
}

// Mostrar modal de autenticación
function showAuthModal() {
    document.getElementById('mainContent').style.display = 'none';
    authModal.show();
}

// Cambiar modo de autenticación
function toggleAuthMode() {
    const title = document.getElementById('authModalTitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const toggleLink = document.getElementById('toggleAuthMode');
    const confirmPasswordDiv = document.getElementById('confirmPasswordDiv');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const nombreDiv = document.getElementById('nombreDiv');
    const apellidoDiv = document.getElementById('apellidoDiv');
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');

    if (title.textContent.includes('Iniciar Sesión')) {
        title.textContent = 'Registro';
        submitBtn.textContent = 'Registrarse';
        toggleLink.textContent = '¿Ya tienes cuenta? Inicia sesión';
        confirmPasswordDiv.style.display = 'block';
        confirmPasswordInput.required = true;
        nombreDiv.style.display = 'block';
        apellidoDiv.style.display = 'block';
        nombreInput.required = true;
        apellidoInput.required = true;
    } else {
        title.textContent = 'Iniciar Sesión';
        submitBtn.textContent = 'Iniciar Sesión';
        toggleLink.textContent = '¿No tienes cuenta? Regístrate';
        confirmPasswordDiv.style.display = 'none';
        confirmPasswordInput.required = false;
        nombreDiv.style.display = 'none';
        apellidoDiv.style.display = 'none';
        nombreInput.required = false;
        apellidoInput.required = false;
    }
}

// Función para reiniciar el timer de inactividad
function resetInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    if (authToken) {
        inactivityTimer = setTimeout(() => {
            showNotification('Sesión cerrada por inactividad', 'warning');
            logout();
        }, INACTIVITY_TIMEOUT);
    }
}

// Cerrar sesión
function logout() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    showAuthModal();
    showNotification('Sesión cerrada', 'info');
}

// Abrir funcionalidad
async function openFeature(feature) {
    switch(feature) {
        case 'chatbot':
            chatbotModal.show();
            break;
        case 'plan':
            planModal.show();
            break;
        case 'pdf':
            pdfModal.show();
            break;
        case 'notes':
            notesModal.show();
            await loadNotes();
            break;
        case 'tasks':
            tasksModal.show();
            await loadTasks();
            break;
        case 'subjects':
            subjectsModal.show();
            await loadSubjects();
            break;
        default:
            showNotification('Funcionalidad no disponible', 'warning');
    }
}

// Enviar mensaje de chat
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;

    // Agregar mensaje del usuario
    addChatMessage(message, 'user');
    input.value = '';

    try {
        showChatLoading();
        
        const response = await fetch(`${API_BASE_URL}/ai/chatbot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                pregunta: message,
                contexto: 'Chat académico'
            })
        });

        const data = await response.json();
        hideChatLoading();

        if (response.ok) {
            addChatMessage(data.respuesta, 'bot');
            await addRecentActivity('chat', `Pregunta: ${message.substring(0, 50)}...`);
        } else {
            addChatMessage('Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta de nuevo.', 'bot');
        }
    } catch (error) {
        hideChatLoading();
        addChatMessage('Error de conexión. Por favor, verifica tu conexión a internet.', 'bot');
        console.error('Chat error:', error);
    }
}

// Agregar mensaje al chat
function addChatMessage(content, type) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message fade-in`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (type === 'bot') {
        contentDiv.innerHTML = `<i class="fas fa-robot me-2"></i>${content}`;
    } else {
        contentDiv.textContent = content;
    }
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Mostrar/ocultar loading del chat
function showChatLoading() {
    const sendBtn = document.getElementById('sendChatBtn');
    sendBtn.innerHTML = '<div class="loading"></div>';
    sendBtn.disabled = true;
}

function hideChatLoading() {
    const sendBtn = document.getElementById('sendChatBtn');
    sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    sendBtn.disabled = false;
}

// Manejar generación de plan de estudio
async function handlePlanGeneration(e) {
    e.preventDefault();
    
    const subjects = document.getElementById('planSubjects').value;
    const hours = document.getElementById('planHours').value;
    
    if (!subjects || !hours) {
        showNotification('Por favor, completa todos los campos', 'error');
        return;
    }

    try {
        showLoading();
        
        const subjectsList = subjects.split(',').map(s => s.trim()).filter(s => s);
        
        const response = await fetch(`${API_BASE_URL}/ai/plan-estudio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                materias: subjectsList,
                horasDisponibles: parseInt(hours)
            })
        });

        const data = await response.json();
        hideLoading();

        if (response.ok) {
            document.getElementById('planContent').textContent = data.plan;
            document.getElementById('planResult').style.display = 'block';
            await addRecentActivity('plan', `Generado para ${subjectsList.length} materias`);
        } else {
            showNotification(data.error || 'Error al generar el plan', 'error');
        }
    } catch (error) {
        hideLoading();
        showNotification('Error de conexión', 'error');
        console.error('Plan generation error:', error);
    }
}

// Manejar resumen de PDF
async function handlePdfSummary(e) {
    e.preventDefault();
    
    const pdfFile = document.getElementById('pdfFile').files[0];
    const content = document.getElementById('pdfContent').value.trim();
    
    if (!pdfFile && !content) {
        showNotification('Por favor, sube un archivo PDF o ingresa contenido para resumir', 'error');
        return;
    }

    try {
        showLoading();
        
        let requestBody;
        let endpoint = '/ai/resumir-pdf';
        
        if (pdfFile) {
            // Si hay archivo PDF, usar endpoint para archivos
            endpoint = '/ai/resumir-pdf-archivo';
            const formData = new FormData();
            formData.append('archivo', pdfFile);
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });
            
            const data = await response.json();
            hideLoading();

            if (response.ok) {
                document.getElementById('pdfSummary').textContent = data.resumen;
                document.getElementById('pdfResult').style.display = 'block';
                await addRecentActivity('pdf', `Resumen generado de archivo: ${pdfFile.name}`);
            } else {
                showNotification(data.error || 'Error al generar el resumen', 'error');
            }
        } else {
            // Si solo hay contenido de texto
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    contenido: content
                })
            });

            const data = await response.json();
            hideLoading();

            if (response.ok) {
                document.getElementById('pdfSummary').textContent = data.resumen;
                document.getElementById('pdfResult').style.display = 'block';
                await addRecentActivity('pdf', `Resumen generado (${content.length} caracteres)`);
            } else {
                showNotification(data.error || 'Error al generar el resumen', 'error');
            }
        }
    } catch (error) {
        hideLoading();
        showNotification('Error de conexión', 'error');
        console.error('PDF summary error:', error);
    }
}

// Cargar actividad reciente
async function loadRecentActivity() {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/actividad`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

            if (response.ok) {
        const data = await response.json();
        displayRecentActivity(data.actividades || []);
    }
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

// Mostrar actividad reciente
function displayRecentActivity(activities) {
    const container = document.getElementById('recentActivity');
    
    if (!activities || activities.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay actividad reciente</p>';
        return;
    }

    const activityHTML = activities.map(activity => `
        <div class="activity-item d-flex align-items-center">
            <div class="activity-icon bg-primary text-white">
                <i class="fas fa-${getActivityIcon(activity.tipo)}"></i>
            </div>
            <div>
                <div class="fw-bold">${activity.descripcion}</div>
                <small class="text-muted">${new Date(activity.fecha).toLocaleString()}</small>
            </div>
        </div>
    `).join('');

    container.innerHTML = activityHTML;
}

// Obtener icono para actividad
function getActivityIcon(type) {
    const icons = {
        'chat': 'comments',
        'plan': 'calendar-alt',
        'pdf': 'file-pdf',
        'note': 'sticky-note',
        'task': 'tasks',
        'subject': 'book'
    };
    return icons[type] || 'info-circle';
}

// Agregar actividad reciente
async function addRecentActivity(type, description) {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/actividad`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                tipo: type,
                descripcion: description
            })
        });
        
        if (response.ok) {
            // Recargar la actividad reciente después de agregar una nueva
            loadRecentActivity();
        }
    } catch (error) {
        console.error('Error adding activity:', error);
    }
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Mostrar/ocultar loading global
function showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="loading-spinner"></div>';
    overlay.id = 'loadingOverlay';
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Utilidades
function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ========================================
// FUNCIONES PARA NOTAS
// ========================================

// Mostrar formulario de crear nota
async function showCreateNoteForm() {
    document.getElementById('noteForm').style.display = 'block';
    document.getElementById('createNoteForm').reset();
    await populateSubjectDropdown('noteSubject');
}

// Ocultar formulario de crear nota
function hideCreateNoteForm() {
    document.getElementById('noteForm').style.display = 'none';
}

// Cargar notas
async function loadNotes() {
    try {
        const response = await fetch(`${API_BASE_URL}/notas`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayNotes(data.notas || []);
        } else {
            console.error('Error loading notes');
        }
    } catch (error) {
        console.error('Error loading notes:', error);
    }
}

// Mostrar notas
function displayNotes(notes) {
    const container = document.getElementById('notesList');
    
    if (!notes || notes.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay notas disponibles</p>';
        return;
    }

    const notesHTML = notes.map(note => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="card-title">${note.titulo}</h6>
                        <p class="card-text">${note.contenido}</p>
                        ${note.materia ? `<small class="text-muted">Materia: ${note.materia}</small>` : ''}
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-warning" onclick="editNote(${note.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteNote(${note.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = notesHTML;
}

// Crear nota
async function handleCreateNote(e) {
    e.preventDefault();
    
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const subject = document.getElementById('noteSubject').value;
    const editId = document.getElementById('createNoteForm').getAttribute('data-edit-id');

    try {
        showLoading();
        
        const method = editId ? 'PUT' : 'POST';
        const url = editId ? `${API_BASE_URL}/notas/${editId}` : `${API_BASE_URL}/notas`;
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                titulo: title,
                contenido: content,
                materia: subject
            })
        });

        const data = await response.json();
        hideLoading();

        if (response.ok) {
            const message = editId ? 'Nota actualizada exitosamente' : 'Nota creada exitosamente';
            showNotification(message, 'success');
            hideCreateNoteForm();
            loadNotes();
            await addRecentActivity('note', editId ? `Nota actualizada: ${title}` : `Nota creada: ${title}`);
            
            // Limpiar modo edición
            document.getElementById('createNoteForm').removeAttribute('data-edit-id');
            // No cambiar el texto del botón ya que no tiene ID específico
        } else {
            showNotification(data.error || 'Error al procesar nota', 'error');
        }
    } catch (error) {
        hideLoading();
        showNotification('Error de conexión', 'error');
        console.error('Create/Update note error:', error);
    }
}

// ========================================
// FUNCIONES PARA TAREAS
// ========================================

// Mostrar formulario de crear tarea
async function showCreateTaskForm() {
    document.getElementById('taskForm').style.display = 'block';
    document.getElementById('createTaskForm').reset();
    await populateSubjectDropdown('taskSubject');
}

// Ocultar formulario de crear tarea
function hideCreateTaskForm() {
    document.getElementById('taskForm').style.display = 'none';
}

// Cargar tareas
async function loadTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/tareas`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayTasks(data.tareas || []);
        } else {
            console.error('Error loading tasks');
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

// Mostrar tareas
function displayTasks(tasks) {
    const container = document.getElementById('tasksList');
    
    if (!tasks || tasks.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay tareas disponibles</p>';
        return;
    }

    const tasksHTML = tasks.map(task => `
        <div class="card mb-3 ${task.completada ? 'border-success' : ''}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center">
                            <h6 class="card-title ${task.completada ? 'text-decoration-line-through' : ''}">${task.titulo}</h6>
                            <span class="badge bg-${getPriorityColor(task.prioridad)} ms-2">${task.prioridad}</span>
                        </div>
                        <p class="card-text">${task.descripcion || ''}</p>
                        <div class="small text-muted">
                            ${task.materia ? `<span class="me-3">Materia: ${task.materia}</span>` : ''}
                            ${task.fechaVencimiento ? `<span>Límite: ${new Date(task.fechaVencimiento).toLocaleString()}</span>` : ''}
                        </div>
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-success" onclick="completeTask(${task.id})">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="editTask(${task.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteTask(${task.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = tasksHTML;
}

// Obtener color de prioridad
function getPriorityColor(priority) {
    const colors = {
        'baja': 'success',
        'media': 'warning',
        'alta': 'danger',
        'urgente': 'dark'
    };
    return colors[priority] || 'secondary';
}

// Crear tarea
async function handleCreateTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const subject = document.getElementById('taskSubject').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;
    const editId = document.getElementById('createTaskForm').getAttribute('data-edit-id');

    try {
        showLoading();
        
        const method = editId ? 'PUT' : 'POST';
        const url = editId ? `${API_BASE_URL}/tareas/${editId}` : `${API_BASE_URL}/tareas`;
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                titulo: title,
                descripcion: description,
                materia: subject,
                fechaVencimiento: dueDate,
                prioridad: priority
            })
        });

        const data = await response.json();
        hideLoading();

        if (response.ok) {
            const message = editId ? 'Tarea actualizada exitosamente' : 'Tarea creada exitosamente';
            showNotification(message, 'success');
            hideCreateTaskForm();
            loadTasks();
            await addRecentActivity('task', editId ? `Tarea actualizada: ${title}` : `Tarea creada: ${title}`);
            
            // Limpiar modo edición
            document.getElementById('createTaskForm').removeAttribute('data-edit-id');
            // No cambiar el texto del botón ya que no tiene ID específico
        } else {
            showNotification(data.error || 'Error al procesar tarea', 'error');
        }
    } catch (error) {
        hideLoading();
        showNotification('Error de conexión', 'error');
        console.error('Create/Update task error:', error);
    }
}

// ========================================
// FUNCIONES PARA MATERIAS
// ========================================

// Mostrar formulario de crear materia
function showCreateSubjectForm() {
    document.getElementById('subjectForm').style.display = 'block';
    document.getElementById('createSubjectForm').reset();
    clearScheduleForm();
}

// Ocultar formulario de crear materia
function hideCreateSubjectForm() {
    document.getElementById('subjectForm').style.display = 'none';
}

// Cargar materias
async function loadSubjects() {
    try {
        const response = await fetch(`${API_BASE_URL}/materias`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displaySubjects(data.materias || []);
        } else {
            console.error('Error loading subjects');
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

// Mostrar materias
function displaySubjects(subjects) {
    const container = document.getElementById('subjectsList');
    
    if (!subjects || subjects.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay materias disponibles</p>';
        return;
    }

    const subjectsHTML = subjects.map(subject => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center">
                            <div class="color-dot me-2" style="background-color: ${subject.color || '#6c757d'}"></div>
                            <h6 class="card-title">${subject.nombre}</h6>
                            ${subject.activa ? '<span class="badge bg-success ms-2">Activa</span>' : '<span class="badge bg-secondary ms-2">Inactiva</span>'}
                        </div>
                        <p class="card-text">${subject.descripcion || ''}</p>
                        <div class="small text-muted">
                            ${subject.profesor ? `<span class="me-3">Profesor: ${subject.profesor}</span>` : ''}
                            ${subject.horario ? `<span>Horario: ${subject.horario}</span>` : ''}
                        </div>
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary" onclick="editSubject(${subject.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteSubject(${subject.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = subjectsHTML;
}

// Crear materia
async function handleCreateSubject(e) {
    e.preventDefault();
    
    const name = document.getElementById('subjectName').value;
    const description = document.getElementById('subjectDescription').value;
    const professor = document.getElementById('subjectProfessor').value;
    const color = document.getElementById('subjectColor').value;
    const editId = document.getElementById('createSubjectForm').getAttribute('data-edit-id');
    
    // Obtener horarios del formulario dinámico
    const scheduleItems = document.querySelectorAll('.schedule-item');
    const schedules = [];
    
    scheduleItems.forEach(item => {
        const day = item.querySelector('.schedule-day').value;
        const start = item.querySelector('.schedule-start').value;
        const end = item.querySelector('.schedule-end').value;
        
        if (day && start && end) {
            schedules.push(`${day} ${start}-${end}`);
        }
    });
    
    const schedule = schedules.join(', ');

    try {
        showLoading();
        
        const method = editId ? 'PUT' : 'POST';
        const url = editId ? `${API_BASE_URL}/materias/${editId}` : `${API_BASE_URL}/materias`;
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                nombre: name,
                descripcion: description,
                profesor: professor,
                horario: schedule,
                color: color
            })
        });

        const data = await response.json();
        hideLoading();

        if (response.ok) {
            const message = editId ? 'Materia actualizada exitosamente' : 'Materia creada exitosamente';
            showNotification(message, 'success');
            hideCreateSubjectForm();
            loadSubjects();
            await addRecentActivity('subject', editId ? `Materia actualizada: ${name}` : `Materia creada: ${name}`);
            
            // Limpiar modo edición
            document.getElementById('createSubjectForm').removeAttribute('data-edit-id');
            // No cambiar el texto del botón ya que no tiene ID específico
        } else {
            showNotification(data.error || 'Error al procesar materia', 'error');
        }
    } catch (error) {
        hideLoading();
        showNotification('Error de conexión', 'error');
        console.error('Create/Update subject error:', error);
    }
}

// Funciones para manejar horarios dinámicos
function addScheduleItem() {
    const container = document.getElementById('scheduleContainer');
    const newItem = document.createElement('div');
    newItem.className = 'schedule-item mb-2';
    newItem.innerHTML = `
        <div class="row">
            <div class="col-md-4">
                <select class="form-control schedule-day">
                    <option value="">Seleccionar día</option>
                    <option value="Lunes">Lunes</option>
                    <option value="Martes">Martes</option>
                    <option value="Miércoles">Miércoles</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                    <option value="Sábado">Sábado</option>
                    <option value="Domingo">Domingo</option>
                </select>
            </div>
            <div class="col-md-3">
                <input type="time" class="form-control schedule-start" placeholder="Inicio">
            </div>
            <div class="col-md-3">
                <input type="time" class="form-control schedule-end" placeholder="Fin">
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-outline-danger btn-sm remove-schedule">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(newItem);
    
    // Agregar event listener para el botón de eliminar
    newItem.querySelector('.remove-schedule').addEventListener('click', function() {
        newItem.remove();
    });
}

function clearScheduleForm() {
    const container = document.getElementById('scheduleContainer');
    container.innerHTML = `
        <div class="schedule-item mb-2">
            <div class="row">
                <div class="col-md-4">
                    <select class="form-control schedule-day">
                        <option value="">Seleccionar día</option>
                        <option value="Lunes">Lunes</option>
                        <option value="Martes">Martes</option>
                        <option value="Miércoles">Miércoles</option>
                        <option value="Jueves">Jueves</option>
                        <option value="Viernes">Viernes</option>
                        <option value="Sábado">Sábado</option>
                        <option value="Domingo">Domingo</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <input type="time" class="form-control schedule-start" placeholder="Inicio">
                </div>
                <div class="col-md-3">
                    <input type="time" class="form-control schedule-end" placeholder="Fin">
                </div>
                <div class="col-md-2">
                    <button type="button" class="btn btn-outline-danger btn-sm remove-schedule">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Agregar event listener para el botón de eliminar inicial
    const removeBtn = container.querySelector('.remove-schedule');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            container.querySelector('.schedule-item').remove();
        });
    }
}

// Funciones de acción para notas, tareas y materias
async function editNote(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/notas/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const note = await response.json();
            
            // Cambiar el formulario a modo edición
            document.getElementById('createNoteForm').setAttribute('data-edit-id', id);
            // No cambiar el texto del botón ya que no tiene ID específico
            showCreateNoteForm();
            
            // Llenar el formulario con los datos de la nota DESPUÉS de mostrar el formulario
            document.getElementById('noteTitle').value = note.titulo || '';
            document.getElementById('noteContent').value = note.contenido || '';
            
            // Poblar dropdown de materias y luego establecer el valor
            await populateSubjectDropdown('noteSubject');
            document.getElementById('noteSubject').value = note.materia || '';
        } else {
            showNotification('Error al cargar la nota', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Edit note error:', error);
    }
}

async function deleteNote(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/notas/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                showNotification('Nota eliminada correctamente', 'success');
                loadNotes();
                await addRecentActivity('note', 'Nota eliminada');
            } else {
                showNotification('Error al eliminar la nota', 'error');
            }
        } catch (error) {
            showNotification('Error de conexión', 'error');
            console.error('Delete note error:', error);
        }
    }
}

async function editTask(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/tareas/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const task = await response.json();
            
            // Cambiar el formulario a modo edición
            document.getElementById('createTaskForm').setAttribute('data-edit-id', id);
            // No cambiar el texto del botón ya que no tiene ID específico
            showCreateTaskForm();
            
            // Llenar el formulario con los datos de la tarea DESPUÉS de mostrar el formulario
            document.getElementById('taskTitle').value = task.titulo || '';
            document.getElementById('taskDescription').value = task.descripcion || '';
            // Formatear la fecha para datetime-local
            let formattedDate = '';
            if (task.fechaVencimiento) {
                const date = new Date(task.fechaVencimiento);
                formattedDate = date.toISOString().slice(0, 16); // Formato YYYY-MM-DDTHH:MM
            }
            document.getElementById('taskDueDate').value = formattedDate;
            document.getElementById('taskPriority').value = task.prioridad || 'media';
            
            // Poblar dropdown de materias y luego establecer el valor
            await populateSubjectDropdown('taskSubject');
            document.getElementById('taskSubject').value = task.materia || '';
        } else {
            showNotification('Error al cargar la tarea', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Edit task error:', error);
    }
}

async function deleteTask(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/tareas/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                showNotification('Tarea eliminada correctamente', 'success');
                loadTasks();
                await addRecentActivity('task', 'Tarea eliminada');
            } else {
                showNotification('Error al eliminar la tarea', 'error');
            }
        } catch (error) {
            showNotification('Error de conexión', 'error');
            console.error('Delete task error:', error);
        }
    }
}

async function completeTask(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/tareas/${id}/completar`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            showNotification('Tarea marcada como completada', 'success');
            loadTasks();
            await addRecentActivity('task', 'Tarea completada');
        } else {
            showNotification('Error al completar la tarea', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Complete task error:', error);
    }
}

async function editSubject(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/materias/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const subject = await response.json();
            
            // Cambiar el formulario a modo edición
            document.getElementById('createSubjectForm').setAttribute('data-edit-id', id);
            // No cambiar el texto del botón ya que no tiene ID específico
            showCreateSubjectForm();
            
            // Llenar el formulario con los datos de la materia DESPUÉS de mostrar el formulario
            document.getElementById('subjectName').value = subject.nombre || '';
            document.getElementById('subjectDescription').value = subject.descripcion || '';
            document.getElementById('subjectProfessor').value = subject.profesor || '';
            document.getElementById('subjectColor').value = subject.color || '#6c757d';
            
            // Limpiar y llenar horarios
            clearScheduleForm();
            if (subject.horario) {
                const schedules = subject.horario.split(', ');
                schedules.forEach(schedule => {
                    const parts = schedule.split(' ');
                    if (parts.length >= 2) {
                        const day = parts[0];
                        const timeRange = parts[1];
                        const times = timeRange.split('-');
                        if (times.length >= 2) {
                            addScheduleItem();
                            const lastItem = document.querySelector('.schedule-item:last-child');
                            lastItem.querySelector('.schedule-day').value = day;
                            lastItem.querySelector('.schedule-start').value = times[0];
                            lastItem.querySelector('.schedule-end').value = times[1];
                        }
                    }
                });
            }
        } else {
            showNotification('Error al cargar la materia', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Edit subject error:', error);
    }
}

async function deleteSubject(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta materia?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/materias/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                showNotification('Materia eliminada correctamente', 'success');
                loadSubjects();
                await addRecentActivity('subject', 'Materia eliminada');
            } else {
                showNotification('Error al eliminar la materia', 'error');
            }
        } catch (error) {
            showNotification('Error de conexión', 'error');
            console.error('Delete subject error:', error);
        }
    }
}

// Función para poblar dropdown de materias
async function populateSubjectDropdown(dropdownId) {
    try {
        const response = await fetch(`${API_BASE_URL}/materias`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const subjects = data.materias || [];
            const dropdown = document.getElementById(dropdownId);
            
            // Limpiar opciones existentes excepto la primera
            dropdown.innerHTML = '<option value="">Seleccionar materia</option>';
            
            // Agregar materias
            subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.nombre;
                option.textContent = subject.nombre;
                dropdown.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading subjects for dropdown:', error);
    }
}

// Exportar funciones para uso global
window.openFeature = openFeature;
window.logout = logout;
window.showCreateNoteForm = showCreateNoteForm;
window.hideCreateNoteForm = hideCreateNoteForm;
window.showCreateTaskForm = showCreateTaskForm;
window.hideCreateTaskForm = hideCreateTaskForm;
window.showCreateSubjectForm = showCreateSubjectForm;
window.hideCreateSubjectForm = hideCreateSubjectForm;
window.addScheduleItem = addScheduleItem;
window.editNote = editNote;
window.deleteNote = deleteNote;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.completeTask = completeTask;
window.editSubject = editSubject;
window.deleteSubject = deleteSubject;
