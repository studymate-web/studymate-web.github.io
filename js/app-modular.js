// StudyMate IA - Aplicación Principal Modularizada

// Configuración global
const CONFIG = {
    INACTIVITY_TIMEOUT: 30 * 60 * 1000 // 30 minutos
};

// Función global para limpiar backdrop (disponible desde cualquier lugar)
window.clearModalBackdrop = function() {
    // Limpiar todos los backdrops
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    
    // Remover clases del body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Limpiar cualquier padding residual
    const style = document.createElement('style');
    style.textContent = 'body { padding-right: 0 !important; }';
    document.head.appendChild(style);
    setTimeout(() => style.remove(), 100);
};

// Nueva: sincronizar backdrop según modales abiertos
window.syncModalBackdrop = function() {
    const openModals = document.querySelectorAll('.modal.show').length;
    if (openModals === 0) {
        window.clearModalBackdrop();
        return;
    }
    // Asegurar cuerpo en estado modal
    document.body.classList.add('modal-open');
    // Asegurar que exista 1 backdrop si falta (Bootstrap lo gestiona, esto es fallback)
    let backdrop = document.querySelector('.modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
    }
};

// Clase principal de la aplicación
class StudyMateApp {
    constructor() {
        this.API_BASE_URL = this.getApiBaseUrl();
        this.modules = {};
        this.initialized = false;
    }

    getApiBaseUrl() {
        // En desarrollo, usar localhost
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8080/api';
        }
        // En producción, usar la URL de Render
        return 'https://studymate-back.onrender.com/api';
    }

    // Inicializar la aplicación
    async init() {
        try {
            console.log('🚀 Inicializando StudyMate IA...');
            
            // Inicializar módulos en orden de dependencia
            await this.initializeModules();
            
            // Configurar event listeners globales
            this.setupGlobalEventListeners();
            
            this.initialized = true;
            console.log('✅ StudyMate IA inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error al inicializar StudyMate IA:', error);
            this.showError('Error al inicializar la aplicación');
        }
    }

    // Inicializar módulos
    async initializeModules() {
        // 1. Módulo de autenticación (base para otros módulos)
        this.modules.auth = new AuthModule();
        this.modules.auth.init();
        window.authModule = this.modules.auth; // Referencia global

        // 2. Módulo de IA
        this.modules.ai = new AIModule();
        this.modules.ai.init();

        // 3. Módulo de notas
        this.modules.notes = new NotesModule(this.modules.auth);
        this.modules.notes.init();
        window.notesModule = this.modules.notes; // Referencia global

        // 4. Módulo de tareas
        this.modules.tasks = new TasksModule(this.modules.auth);
        this.modules.tasks.init();
        window.tasksModule = this.modules.tasks; // Referencia global

        // 5. Módulo de materias
        this.modules.subjects = new SubjectsModule(this.modules.auth);
        this.modules.subjects.init();
        window.subjectsModule = this.modules.subjects; // Referencia global
    }

    // Función global para limpiar backdrop
    static clearBackdrop() {
        if (window.clearModalBackdrop) {
            window.clearModalBackdrop();
        } else {
            // Fallback si la función global no está disponible
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
    }

    setupGlobalEventListeners() {
        // Event listeners para funcionalidades principales
        document.addEventListener('click', (e) => {
            // Manejar clicks en tarjetas de funcionalidades
            if (e.target.closest('.feature-card')) {
                const feature = e.target.closest('.feature-card').dataset.feature;
                if (feature) {
                    this.openFeature(feature);
                }
            }
        });

        // Event listeners para botones de acción
        document.addEventListener('click', (e) => {
            // Botones de formularios
            if (e.target.matches('[onclick*="showCreateNoteForm"]')) {
                e.preventDefault();
                this.modules.notes.showCreateNoteForm();
            }
            if (e.target.matches('[onclick*="hideCreateNoteForm"]')) {
                e.preventDefault();
                this.modules.notes.hideCreateNoteForm();
            }
            if (e.target.matches('[onclick*="showCreateTaskForm"]')) {
                e.preventDefault();
                this.modules.tasks.showCreateTaskForm();
            }
            if (e.target.matches('[onclick*="hideCreateTaskForm"]')) {
                e.preventDefault();
                this.modules.tasks.hideCreateTaskForm();
            }
            if (e.target.matches('[onclick*="showCreateSubjectForm"]')) {
                e.preventDefault();
                this.modules.subjects.showCreateSubjectForm();
            }
            if (e.target.matches('[onclick*="hideCreateSubjectForm"]')) {
                e.preventDefault();
                this.modules.subjects.hideCreateSubjectForm();
            }
        });

        // Event listener para manejar cierre de modales
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-bs-dismiss="modal"]') || e.target.matches('.btn-close')) {
                // Sincronizar backdrop inmediatamente y después de un delay
                window.syncModalBackdrop();
                setTimeout(() => window.syncModalBackdrop(), 150);
            }
        });

        // Event listener para modales que se cierran con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.syncModalBackdrop();
                setTimeout(() => window.syncModalBackdrop(), 150);
            }
        });

        // Event listener para cuando se cierra un modal (evento hidden.bs.modal)
        document.addEventListener('hidden.bs.modal', (e) => {
            // Sincronizar backdrop
            window.syncModalBackdrop();
            setTimeout(() => window.syncModalBackdrop(), 100);
            setTimeout(() => window.syncModalBackdrop(), 300);
            setTimeout(() => window.syncModalBackdrop(), 500);
        });

        // Event listener para cuando se está cerrando un modal (evento hide.bs.modal)
        document.addEventListener('hide.bs.modal', (e) => {
            // Sincronizar backdrop inmediatamente
            window.syncModalBackdrop();
        });

        // Event listener para cuando se muestra un modal (evento shown.bs.modal)
        document.addEventListener('shown.bs.modal', (e) => {
            // Sincronizar backdrop por si había residuo
            setTimeout(() => window.syncModalBackdrop(), 50);
        });

        // Event listener para cuando se previene el cierre de un modal (evento hidePrevented.bs.modal)
        document.addEventListener('hidePrevented.bs.modal', (e) => {
            // Sincronizar backdrop si se previene el cierre
            window.syncModalBackdrop();
        });

        // Event listener adicional para botones de cancelar
        document.addEventListener('click', (e) => {
            if (e.target.textContent.includes('Cancelar') && e.target.closest('.modal')) {
                window.syncModalBackdrop();
                setTimeout(() => window.syncModalBackdrop(), 150);
            }
        });

        // Event listener para cuando se hace clic en el backdrop
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                window.syncModalBackdrop();
                setTimeout(() => window.syncModalBackdrop(), 150);
            }
        });

        // Event listener adicional para cualquier cierre de modal
        document.addEventListener('click', (e) => {
            // Detectar cualquier clic que pueda cerrar un modal
            if (e.target.matches('[data-bs-dismiss="modal"]') || 
                e.target.matches('.btn-close') || 
                e.target.textContent.includes('Cancelar') ||
                e.target.classList.contains('modal-backdrop')) {
                
                // Limpiar backdrop después de un breve delay
                setTimeout(() => window.syncModalBackdrop(), 100);
                setTimeout(() => window.syncModalBackdrop(), 300);
            }
        });
    }

    // Abrir funcionalidad
    async openFeature(feature) {
        const modals = {
            'chatbot': 'chatbotModal',
            'plan': 'planModal',
            'pdf': 'pdfModal',
            'notes': 'notesModal',
            'tasks': 'tasksModal',
            'subjects': 'subjectsModal'
        };

        const modalId = modals[feature];
        if (modalId) {
            // No eliminar backdrop existente aquí; sincronizar después
            const modal = new bootstrap.Modal(document.getElementById(modalId));
            modal.show();
            // Sincronizar backdrop
            window.syncModalBackdrop();

            // Cargar datos específicos según la funcionalidad
            switch (feature) {
                case 'notes':
                    await this.modules.notes.loadNotes();
                    break;
                case 'tasks':
                    await this.modules.tasks.loadTasks();
                    break;
                case 'subjects':
                    await this.modules.subjects.loadSubjects();
                    break;
            }
        } else {
            this.modules.auth.showNotification('Funcionalidad no disponible', 'warning');
        }
    }

    // Mostrar error
    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Obtener módulo
    getModule(name) {
        return this.modules[name];
    }

    // Verificar si está inicializado
    isInitialized() {
        return this.initialized;
    }
}

// Módulo de Tareas (simplificado para el ejemplo)
class TasksModule {
    constructor(authModule) {
        this.authModule = authModule;
        this.API_BASE_URL = window.studyMateApp ? window.studyMateApp.API_BASE_URL : 'https://studymate-back.onrender.com/api';
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Los event listeners se configuran dinámicamente en showCreateTaskForm()
        // No es necesario configurar aquí ya que los formularios se crean dinámicamente
    }

    async showCreateTaskForm() {
        // Crear un modal temporal para el formulario de tareas
        const modalHtml = `
            <div class="modal fade" id="taskFormModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-tasks me-2"></i>
                                Nueva Tarea
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="createTaskForm" onsubmit="return false;">
                                <div class="mb-3">
                                    <label for="taskTitle" class="form-label">Título</label>
                                    <input type="text" class="form-control" id="taskTitle">
                                </div>
                                <div class="mb-3">
                                    <label for="taskDescription" class="form-label">Descripción</label>
                                    <textarea class="form-control" id="taskDescription" rows="3"></textarea>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="taskSubject" class="form-label">Materia</label>
                                            <select class="form-control" id="taskSubject">
                                                <option value="">Seleccionar materia</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="taskPriority" class="form-label">Prioridad</label>
                                            <select class="form-control" id="taskPriority">
                                                <option value="BAJA">Baja</option>
                                                <option value="MEDIA" selected>Media</option>
                                                <option value="ALTA">Alta</option>
                                                <option value="URGENTE">Urgente</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="taskDueDate" class="form-label">Fecha de Vencimiento</label>
                                    <input type="datetime-local" class="form-control" id="taskDueDate">
                                </div>
                                <div class="d-flex gap-2">
                                    <button type="button" class="btn btn-info" id="saveTaskBtn">
                                        <i class="fas fa-save me-2"></i>
                                        Guardar Tarea
                                    </button>
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar el modal al body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('taskFormModal'));
        modal.show();
        
        // Poblar dropdown de materias
        await this.populateSubjectDropdown('taskSubject');
        
        // Refrescar todos los dropdowns si la función existe
        if (window.refreshAllSubjectDropdowns) {
            await window.refreshAllSubjectDropdowns();
        }
        
        // Configurar event listener para el botón DESPUÉS de que el modal esté visible
        setTimeout(() => {
            const saveBtn = document.getElementById('saveTaskBtn');
            if (saveBtn) {
                // Limpiar event listeners existentes
                const newSaveBtn = saveBtn.cloneNode(true);
                saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
                
                // Agregar el event listener
                newSaveBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleCreateTask(e);
                });
            }
        }, 200);
        
        // Limpiar el modal cuando se cierre
        const modalElement = document.getElementById('taskFormModal');
        if (modalElement) {
            modalElement.addEventListener('hidden.bs.modal', function() {
                // Remover el modal del DOM
                this.remove();
                // Sincronizar backdrop
                window.syncModalBackdrop();
                setTimeout(() => window.syncModalBackdrop(), 150);
            });
        }
    }

    hideCreateTaskForm() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('taskFormModal'));
        if (modal) {
            modal.hide();
        }
        
        // Sincronizar backdrop usando la función global
        window.syncModalBackdrop();
        setTimeout(() => window.syncModalBackdrop(), 150);
    }

    async loadTasks() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/tareas`, {
                headers: {
                    'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayTasks(data.tareas || []);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    displayTasks(tasks) {
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
                                <span class="badge bg-${this.getPriorityColor(task.prioridad)} ms-2">${task.prioridad}</span>
                            </div>
                            <p class="card-text">${task.descripcion || ''}</p>
                            <div class="small text-muted">
                                ${task.materia ? `<span class="me-3">Materia: ${task.materia}</span>` : ''}
                                ${task.fechaVencimiento ? `<span>Límite: ${new Date(task.fechaVencimiento).toLocaleString()}</span>` : ''}
                            </div>
                        </div>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-success" onclick="tasksModule.completeTask(${task.id})">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-outline-info" onclick="tasksModule.editTask(${task.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="tasksModule.deleteTask(${task.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = tasksHTML;
    }

    getPriorityColor(priority) {
        const colors = {
            'BAJA': 'success',
            'MEDIA': 'warning',
            'ALTA': 'danger',
            'URGENTE': 'dark'
        };
        return colors[priority] || 'secondary';
    }

    async handleCreateTask(e) {
        e.preventDefault();
        
        // Buscar elementos dentro del modal específico
        const modal = document.getElementById('taskFormModal');
        if (!modal) {
            console.error('❌ Modal de tarea no encontrado');
            if (this.authModule) {
                this.authModule.showNotification('Error: Formulario no encontrado', 'error');
            }
            return;
        }
        
        // Buscar elementos dentro del modal
        const titleElement = modal.querySelector('#taskTitle');
        const descriptionElement = modal.querySelector('#taskDescription');
        const subjectElement = modal.querySelector('#taskSubject');
        const dueDateElement = modal.querySelector('#taskDueDate');
        const priorityElement = modal.querySelector('#taskPriority');
        const formElement = modal.querySelector('#createTaskForm');
        
        if (!titleElement || !descriptionElement || !subjectElement || !dueDateElement || !priorityElement) {
            console.error('❌ Elementos del formulario de tarea no encontrados:', {
                titleElement: !!titleElement,
                descriptionElement: !!descriptionElement,
                subjectElement: !!subjectElement,
                dueDateElement: !!dueDateElement,
                priorityElement: !!priorityElement
            });
            if (this.authModule) {
                this.authModule.showNotification('Error: Formulario de tarea no cargado correctamente', 'error');
            }
            return;
        }
        
        const title = titleElement.value.trim();
        const description = descriptionElement.value.trim();
        const subject = subjectElement.value;
        const dueDate = dueDateElement.value;
        const priority = priorityElement.value;
        const editId = formElement ? formElement.getAttribute('data-edit-id') : null;
        
        // Validación manual
        if (!title) {
            if (this.authModule) {
                this.authModule.showNotification('El título de la tarea es obligatorio', 'error');
            }
            return;
        }

        try {
            if (this.authModule) {
                this.authModule.showLoading();
            }
            
            const method = editId ? 'PUT' : 'POST';
            const url = editId ? `${this.API_BASE_URL}/tareas/${editId}` : `${this.API_BASE_URL}/tareas`;
            
            // Validar campos requeridos
            if (!title || title.trim() === '') {
                if (this.authModule) {
                    this.authModule.showNotification('El título es obligatorio', 'error');
                }
                return;
            }
            
            const payload = {
                titulo: title.trim(),
                descripcion: description || '',
                prioridad: priority || 'MEDIA'
            };
            
            // Convertir fecha de vencimiento a formato correcto
            if (dueDate) {
                try {
                    const date = new Date(dueDate);
                    if (!isNaN(date.getTime())) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        payload.fechaLimite = `${year}-${month}-${day}T${hours}:${minutes}:00`;
                        console.log('Fecha formateada:', payload.fechaLimite);
                    } else {
                        console.warn('Fecha inválida:', dueDate);
                    }
                } catch (error) {
                    console.error('Error al formatear fecha:', error);
                }
            }
            
            // Agregar materia si está seleccionada
            if (subject) {
                payload.materia = { id: Number(subject) };
            }
            
            // Log para debugging
            console.log('Payload a enviar:', payload);
            console.log('URL:', url);
            console.log('Método:', method);
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (this.authModule) {
                this.authModule.hideLoading();
            }

            // Log de la respuesta para debugging
            console.log('Respuesta del servidor:', {
                status: response.status,
                statusText: response.statusText,
                data: data
            });

            if (response.ok) {
                const message = editId ? 'Tarea actualizada exitosamente' : 'Tarea creada exitosamente';
                if (this.authModule) {
                    this.authModule.showNotification(message, 'success');
                }
                this.hideCreateTaskForm();
                this.loadTasks();
                
                if (this.authModule) {
                    await this.authModule.addRecentActivity('task', editId ? `Tarea actualizada: ${title}` : `Tarea creada: ${title}`);
                }
                
                // Limpiar modo edición
                if (formElement) {
                    formElement.removeAttribute('data-edit-id');
                }
            } else {
                console.error('Error en la respuesta:', data);
                if (this.authModule) {
                    this.authModule.showNotification(data.message || data.error || 'Error al procesar tarea', 'error');
                }
            }
        } catch (error) {
            if (this.authModule) {
                this.authModule.hideLoading();
                this.authModule.showNotification('Error de conexión', 'error');
            }
            console.error('❌ Create/Update task error:', error);
        }
    }

    async populateSubjectDropdown(dropdownId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/materias`, {
                headers: {
                    'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const dropdown = document.getElementById(dropdownId);
                if (dropdown) {
                    // Limpiar opciones existentes excepto la primera
                    dropdown.innerHTML = '<option value="">Seleccionar materia</option>';
                    
                    // Agregar materias
                    data.materias.forEach(subject => {
                        const option = document.createElement('option');
                        option.value = subject.id;
                        option.textContent = subject.nombre;
                        dropdown.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading subjects for dropdown:', error);
        }
    }

    // Métodos adicionales para tareas (simplificados)
    async editTask(id) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/tareas/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
                }
            });
            
            if (response.ok) {
                const task = await response.json();
                
                // Mostrar el formulario primero
                await this.showCreateTaskForm();
                
                // Esperar a que el modal esté visible y luego llenar los campos
                setTimeout(() => {
                    const modal = document.getElementById('taskFormModal');
                    if (!modal) {
                        console.error('❌ Modal de tarea no encontrado para edición');
                        return;
                    }
                    
                    // Cambiar el formulario a modo edición
                    const formElement = modal.querySelector('#createTaskForm');
                    if (formElement) {
                        formElement.setAttribute('data-edit-id', id);
                    }
                    
                    // Llenar el formulario con los datos de la tarea
                    const titleField = modal.querySelector('#taskTitle');
                    const descField = modal.querySelector('#taskDescription');
                    const priorityField = modal.querySelector('#taskPriority');
                    const dueDateField = modal.querySelector('#taskDueDate');
                    const subjectField = modal.querySelector('#taskSubject');
                    
                    if (titleField) titleField.value = task.titulo || '';
                    if (descField) descField.value = task.descripcion || '';
                    if (priorityField) priorityField.value = task.prioridad || 'MEDIA';
                    
                    // Formatear fecha límite para el input datetime-local
                    if (dueDateField && task.fechaLimite) {
                        const fecha = new Date(task.fechaLimite);
                        const year = fecha.getFullYear();
                        const month = String(fecha.getMonth() + 1).padStart(2, '0');
                        const day = String(fecha.getDate()).padStart(2, '0');
                        const hours = String(fecha.getHours()).padStart(2, '0');
                        const minutes = String(fecha.getMinutes()).padStart(2, '0');
                        dueDateField.value = `${year}-${month}-${day}T${hours}:${minutes}`;
                    }
                    
                    // Asignar el ID de la materia, no el objeto completo
                    if (subjectField) subjectField.value = task.materia ? task.materia.id : '';
                }, 200);
            } else {
                if (this.authModule) {
                    this.authModule.showNotification('Error al cargar la tarea', 'error');
                }
            }
        } catch (error) {
            if (this.authModule) {
                this.authModule.showNotification('Error de conexión', 'error');
            }
            console.error('Edit task error:', error);
        }
    }

    async deleteTask(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
            try {
                const response = await fetch(`${this.API_BASE_URL}/tareas/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
                    }
                });
                
                if (response.ok) {
                    if (this.authModule) {
                        this.authModule.showNotification('Tarea eliminada correctamente', 'success');
                    }
                    this.loadTasks();
                    if (this.authModule) {
                        await this.authModule.addRecentActivity('task', 'Tarea eliminada');
                    }
                } else {
                    if (this.authModule) {
                        this.authModule.showNotification('Error al eliminar la tarea', 'error');
                    }
                }
            } catch (error) {
                if (this.authModule) {
                    this.authModule.showNotification('Error de conexión', 'error');
                }
                console.error('Delete task error:', error);
            }
        }
    }

    async completeTask(id) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/tareas/${id}/completar`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                if (this.authModule) {
                    this.authModule.showNotification('Tarea marcada como completada', 'success');
                }
                this.loadTasks();
                if (this.authModule) {
                    await this.authModule.addRecentActivity('task', 'Tarea completada');
                }
            } else {
                if (this.authModule) {
                    this.authModule.showNotification('Error al completar la tarea', 'error');
                }
            }
        } catch (error) {
            if (this.authModule) {
                this.authModule.showNotification('Error de conexión', 'error');
            }
            console.error('Complete task error:', error);
        }
    }
}

// Módulo de Materias (simplificado)
class SubjectsModule {
    constructor(authModule) {
        this.authModule = authModule;
        this.API_BASE_URL = window.studyMateApp ? window.studyMateApp.API_BASE_URL : 'https://studymate-back.onrender.com/api';
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Los event listeners se configuran dinámicamente en showCreateSubjectForm()
        // No es necesario configurar aquí ya que los formularios se crean dinámicamente
    }

    showCreateSubjectForm() {
        console.log('🔍 showCreateSubjectForm llamado');
        
        // Crear un modal temporal para el formulario de materias
        const modalHtml = `
            <div class="modal fade" id="subjectFormModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-book me-2"></i>
                                Nueva Materia
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="createSubjectForm" onsubmit="return false;">
                                <div class="mb-3">
                                    <label for="subjectName" class="form-label">Nombre de la Materia</label>
                                    <input type="text" class="form-control" id="subjectName">
                                </div>
                                <div class="mb-3">
                                    <label for="subjectDescription" class="form-label">Descripción</label>
                                    <textarea class="form-control" id="subjectDescription" rows="3"></textarea>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="subjectProfessor" class="form-label">Profesor</label>
                                            <input type="text" class="form-control" id="subjectProfessor" placeholder="Nombre del profesor">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="subjectColor" class="form-label">Color</label>
                                            <input type="color" class="form-control" id="subjectColor" value="#6c757d">
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Horario</label>
                                    <div id="scheduleContainer">
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
                                    </div>
                                    <button type="button" class="btn btn-outline-info btn-sm mt-2" onclick="addScheduleItem()">
                                        <i class="fas fa-plus me-1"></i>
                                        Agregar Horario
                                    </button>
                                </div>
                                <div class="d-flex gap-2">
                                    <button type="button" class="btn btn-secondary" id="saveSubjectBtn">
                                        <i class="fas fa-save me-2"></i>
                                        Guardar Materia
                                    </button>
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar el modal al body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('subjectFormModal'));
        modal.show();
        
        // Configurar event listener para el botón de guardar
        setTimeout(() => {
            console.log('🔍 Configurando event listener para materias');
            const saveBtn = document.getElementById('saveSubjectBtn');
            if (saveBtn) {
                console.log('✅ Botón de guardar encontrado, agregando event listener');
                
                // Limpiar event listeners existentes
                const newSaveBtn = saveBtn.cloneNode(true);
                saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
                
                // Agregar el event listener
                newSaveBtn.addEventListener('click', (e) => {
                    e.preventDefault(); // Ensure default behavior is prevented
                    e.stopPropagation(); // Prevent event bubbling
                    console.log('🔍 Botón de guardar materia clickeado');
                    this.handleCreateSubject(e);
                });
            } else {
                console.error('❌ Botón de guardar materia no encontrado');
            }
        }, 200); // Aumentado de 100 a 200ms
        
        // Limpiar el modal cuando se cierre
        const modalElement = document.getElementById('subjectFormModal');
        if (modalElement) {
            modalElement.addEventListener('hidden.bs.modal', function() {
                // Remover el modal del DOM
                this.remove();
                
                // Sincronizar backdrop usando la función global
                window.syncModalBackdrop();
                setTimeout(() => window.syncModalBackdrop(), 150);
            });
        }
    }

    hideCreateSubjectForm() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('subjectFormModal'));
        if (modal) {
            modal.hide();
        }
        
        // Sincronizar backdrop usando la función global
        window.syncModalBackdrop();
        setTimeout(() => window.syncModalBackdrop(), 150);
    }

    async loadSubjects() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/materias`, {
                headers: {
                    'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displaySubjects(data.materias || []);
            }
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    }

    displaySubjects(subjects) {
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
                            <button class="btn btn-outline-secondary" onclick="subjectsModule.editSubject(${subject.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="subjectsModule.deleteSubject(${subject.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = subjectsHTML;
    }

    async handleCreateSubject(e) {
        e.preventDefault();
        
        // Buscar elementos dentro del modal específico
        const modal = document.getElementById('subjectFormModal');
        if (!modal) {
            console.error('❌ Modal de materia no encontrado');
            if (this.authModule) {
                this.authModule.showNotification('Error: Formulario no encontrado', 'error');
            }
            return;
        }
        
        // Buscar elementos dentro del modal
        const nameElement = modal.querySelector('#subjectName');
        const descriptionElement = modal.querySelector('#subjectDescription');
        const professorElement = modal.querySelector('#subjectProfessor');
        const colorElement = modal.querySelector('#subjectColor');
        const formElement = modal.querySelector('#createSubjectForm');
        
        if (!nameElement || !descriptionElement || !professorElement || !colorElement) {
            console.error('❌ Elementos del formulario no encontrados:', {
                nameElement: !!nameElement,
                descriptionElement: !!descriptionElement,
                professorElement: !!professorElement,
                colorElement: !!colorElement
            });
            if (this.authModule) {
                this.authModule.showNotification('Error: Formulario no cargado correctamente', 'error');
            }
            return;
        }
        
        const name = nameElement.value.trim();
        const description = descriptionElement.value.trim();
        const professor = professorElement.value.trim();
        const color = colorElement.value;
        const editId = formElement ? formElement.getAttribute('data-edit-id') : null;
        
        // Validación manual
        if (!name) {
            if (this.authModule) {
                this.authModule.showNotification('El nombre de la materia es obligatorio', 'error');
            }
            return;
        }
        
        const scheduleItems = modal.querySelectorAll('.schedule-item');
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
            if (this.authModule) {
                this.authModule.showLoading();
            }
            
            const method = editId ? 'PUT' : 'POST';
            const url = editId ? `${this.API_BASE_URL}/materias/${editId}` : `${this.API_BASE_URL}/materias`;
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
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
            if (this.authModule) {
                this.authModule.hideLoading();
            }

            if (response.ok) {
                const message = editId ? 'Materia actualizada exitosamente' : 'Materia creada exitosamente';
                if (this.authModule) {
                    this.authModule.showNotification(message, 'success');
                }
                this.hideCreateSubjectForm();
                this.loadSubjects();
                
                // Refrescar todos los dropdowns de materias abiertos
                if (window.refreshAllSubjectDropdowns) {
                    await window.refreshAllSubjectDropdowns();
                }
                
                if (this.authModule) {
                    await this.authModule.addRecentActivity('subject', editId ? `Materia actualizada: ${name}` : `Materia creada: ${name}`);
                }
                
                if (formElement) {
                    formElement.removeAttribute('data-edit-id');
                }
            } else {
                if (this.authModule) {
                    this.authModule.showNotification(data.error || 'Error al procesar materia', 'error');
                }
            }
        } catch (error) {
            if (this.authModule) {
                this.authModule.hideLoading();
                this.authModule.showNotification('Error de conexión', 'error');
            }
            console.error('❌ Create/Update subject error:', error);
        }
    }

    clearScheduleForm() {
        const modal = document.getElementById('subjectFormModal');
        if (!modal) {
            console.error('Modal de materia no encontrado para limpiar horario');
            return;
        }
        
        const container = modal.querySelector('#scheduleContainer');
        if (!container) {
            console.error('Container de horario no encontrado');
            return;
        }
        
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
        
        const removeBtn = container.querySelector('.remove-schedule');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                container.querySelector('.schedule-item').remove();
            });
        }
    }

    // Cargar horario en el formulario
    loadScheduleFromString(scheduleString) {
        const modal = document.getElementById('subjectFormModal');
        if (!modal) {
            console.error('Modal de materia no encontrado para cargar horario');
            return;
        }
        
        const container = modal.querySelector('#scheduleContainer');
        if (!container) {
            console.error('Container de horario no encontrado');
            return;
        }
        
        container.innerHTML = '';
        
        // Verificar que scheduleString sea un string
        if (typeof scheduleString !== 'string' || scheduleString.trim() === '') {
            return;
        }
        
        const scheduleItems = scheduleString.split(',').map(item => item.trim());
        
        scheduleItems.forEach(item => {
            // Parsear el formato "Día HH:MM-HH:MM"
            const parts = item.split(' ');
            if (parts.length >= 2) {
                const day = parts[0];
                const timeRange = parts[1];
                const times = timeRange.split('-');
                
                if (times.length >= 2) {
                    const startTime = times[0];
                    const endTime = times[1];
                    
                    const scheduleItem = document.createElement('div');
                    scheduleItem.className = 'schedule-item mb-2';
                    scheduleItem.innerHTML = `
                        <div class="row">
                            <div class="col-md-4">
                                <select class="form-control schedule-day">
                                    <option value="">Seleccionar día</option>
                                    <option value="Lunes" ${day === 'Lunes' ? 'selected' : ''}>Lunes</option>
                                    <option value="Martes" ${day === 'Martes' ? 'selected' : ''}>Martes</option>
                                    <option value="Miércoles" ${day === 'Miércoles' ? 'selected' : ''}>Miércoles</option>
                                    <option value="Jueves" ${day === 'Jueves' ? 'selected' : ''}>Jueves</option>
                                    <option value="Viernes" ${day === 'Viernes' ? 'selected' : ''}>Viernes</option>
                                    <option value="Sábado" ${day === 'Sábado' ? 'selected' : ''}>Sábado</option>
                                    <option value="Domingo" ${day === 'Domingo' ? 'selected' : ''}>Domingo</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <input type="time" class="form-control schedule-start" value="${startTime}" placeholder="Inicio">
                            </div>
                            <div class="col-md-3">
                                <input type="time" class="form-control schedule-end" value="${endTime}" placeholder="Fin">
                            </div>
                            <div class="col-md-2">
                                <button type="button" class="btn btn-outline-danger btn-sm remove-schedule">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    
                    container.appendChild(scheduleItem);
                    
                    // Agregar event listener para el botón de eliminar
                    const removeBtn = scheduleItem.querySelector('.remove-schedule');
                    if (removeBtn) {
                        removeBtn.addEventListener('click', function() {
                            scheduleItem.remove();
                        });
                    }
                }
            }
        });
    }

    // Métodos adicionales para materias (simplificados)
    async editSubject(id) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/materias/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
                }
            });
            
            if (response.ok) {
                const subject = await response.json();
                
                // Primero mostrar el formulario
                this.showCreateSubjectForm();
                
                // Esperar un momento para que el formulario se muestre
                setTimeout(() => {
                    const modal = document.getElementById('subjectFormModal');
                    if (!modal) {
                        console.error('❌ Modal de materia no encontrado para edición');
                        return;
                    }
                    
                    // Cambiar el formulario a modo edición
                    const formElement = modal.querySelector('#createSubjectForm');
                    if (formElement) {
                        formElement.setAttribute('data-edit-id', id);
                    }
                    
                    // Llenar el formulario con los datos de la materia
                    const nameField = modal.querySelector('#subjectName');
                    const descField = modal.querySelector('#subjectDescription');
                    const profField = modal.querySelector('#subjectProfessor');
                    const colorField = modal.querySelector('#subjectColor');
                    
                    if (nameField) nameField.value = subject.nombre || '';
                    if (descField) descField.value = subject.descripcion || '';
                    if (profField) profField.value = subject.profesor || '';
                    if (colorField) colorField.value = subject.color || '#6c757d';
                    
                    // Cargar horario si existe
                    if (subject.horario) {
                        this.loadScheduleFromString(subject.horario);
                    } else {
                        console.log('No hay horario para cargar');
                    }
                }, 200);
            } else {
                if (this.authModule) {
                    this.authModule.showNotification('Error al cargar la materia', 'error');
                }
            }
        } catch (error) {
            if (this.authModule) {
                this.authModule.showNotification('Error de conexión', 'error');
            }
            console.error('Edit subject error:', error);
        }
    }

    async deleteSubject(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta materia?')) {
            try {
                const response = await fetch(`${this.API_BASE_URL}/materias/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
                    }
                });
                
                if (response.ok) {
                    if (this.authModule) {
                        this.authModule.showNotification('Materia eliminada correctamente', 'success');
                    }
                    this.loadSubjects();
                    if (this.authModule) {
                        await this.authModule.addRecentActivity('subject', 'Materia eliminada');
                    }
                } else {
                    if (this.authModule) {
                        this.authModule.showNotification('Error al eliminar la materia', 'error');
                    }
                }
            } catch (error) {
                if (this.authModule) {
                    this.authModule.showNotification('Error de conexión', 'error');
                }
                console.error('Delete subject error:', error);
            }
        }
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Crear instancia de la aplicación
        window.studyMateApp = new StudyMateApp();
        
        // Inicializar la aplicación
        await window.studyMateApp.init();
        
        // Hacer openFeature disponible globalmente
        window.openFeature = function(feature) {
            if (window.studyMateApp && window.studyMateApp.isInitialized()) {
                return window.studyMateApp.openFeature(feature);
            } else {
                console.error('StudyMateApp no está inicializado');
            }
        };

        // Hacer funciones de módulos disponibles globalmente
        window.showCreateNoteForm = function() {
            if (window.studyMateApp && window.studyMateApp.modules.notes) {
                return window.studyMateApp.modules.notes.showCreateNoteForm();
            }
        };

        window.hideCreateNoteForm = function() {
            if (window.studyMateApp && window.studyMateApp.modules.notes) {
                window.studyMateApp.modules.notes.hideCreateNoteForm();
            }
            // Eliminar backdrop si existe
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            // Remover clase modal-open del body
            document.body.classList.remove('modal-open');
        };

        window.showCreateTaskForm = function() {
            if (window.studyMateApp && window.studyMateApp.modules.tasks) {
                return window.studyMateApp.modules.tasks.showCreateTaskForm();
            }
        };

        window.hideCreateTaskForm = function() {
            if (window.studyMateApp && window.studyMateApp.modules.tasks) {
                window.studyMateApp.modules.tasks.hideCreateTaskForm();
            }
            // Eliminar backdrop si existe
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            // Remover clase modal-open del body
            document.body.classList.remove('modal-open');
        };

        window.showCreateSubjectForm = function() {
            if (window.studyMateApp && window.studyMateApp.modules.subjects) {
                return window.studyMateApp.modules.subjects.showCreateSubjectForm();
            }
        };

        window.hideCreateSubjectForm = function() {
            if (window.studyMateApp && window.studyMateApp.modules.subjects) {
                window.studyMateApp.modules.subjects.hideCreateSubjectForm();
            }
            // Eliminar backdrop si existe
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            // Remover clase modal-open del body
            document.body.classList.remove('modal-open');
        };

        // Función global para limpiar modales
        window.cleanupModals = function() {
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
        };

        // Función global para agregar elementos de horario
        window.addScheduleItem = function() {
            const modal = document.getElementById('subjectFormModal');
            if (!modal) {
                console.error('Modal de materia no encontrado para agregar horario');
                return;
            }
            
            const container = modal.querySelector('#scheduleContainer');
            if (container) {
                const scheduleItem = document.createElement('div');
                scheduleItem.className = 'schedule-item mb-2';
                scheduleItem.innerHTML = `
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
                
                container.appendChild(scheduleItem);
                
                // Agregar event listener para el botón de eliminar
                const removeBtn = scheduleItem.querySelector('.remove-schedule');
                if (removeBtn) {
                    removeBtn.addEventListener('click', function() {
                        scheduleItem.remove();
                    });
                }
            }
        };
        
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
    }
});

// Exportar para uso global
window.StudyMateApp = StudyMateApp;
window.TasksModule = TasksModule;
window.SubjectsModule = SubjectsModule;

// Función global para refrescar todos los dropdowns de materias
window.refreshAllSubjectDropdowns = async function() {
    // Refrescar dropdown de tareas si el modal está abierto
    const taskModal = document.getElementById('taskFormModal');
    if (taskModal && taskModal.classList.contains('show')) {
        const taskDropdown = document.getElementById('taskSubject');
        if (taskDropdown && window.tasksModule) {
            await window.tasksModule.populateSubjectDropdown('taskSubject');
        }
    }
    
    // Refrescar dropdown de notas si el modal está abierto
    const noteModal = document.getElementById('noteFormModal');
    if (noteModal && noteModal.classList.contains('show')) {
        const noteDropdown = document.getElementById('noteSubject');
        if (noteDropdown && window.notesModule) {
            await window.notesModule.populateSubjectDropdown('noteSubject');
        }
    }
    
    // Refrescar dropdown de materias si el modal está abierto
    const subjectModal = document.getElementById('subjectFormModal');
    if (subjectModal && subjectModal.classList.contains('show')) {
        const subjectDropdown = document.getElementById('subjectName');
        if (subjectDropdown) {
            // console.log('✅ Modal de materias está abierto'); // Removed debug
        }
    }
}

// Función de debug para verificar dropdowns
window.debugDropdowns = function() {
    // console.log('🔍 === DEBUG DROPDOWNS ==='); // Removed debug
    
    const taskDropdown = document.getElementById('taskSubject');
    const noteDropdown = document.getElementById('noteSubject');
    
    // console.log('📋 Task Dropdown:', taskDropdown); // Removed debug
    if (taskDropdown) {
        // console.log('   - Visible:', taskDropdown.offsetParent !== null); // Removed debug
        // console.log('   - Opciones:', taskDropdown.options.length); // Removed debug
        // console.log('   - HTML:', taskDropdown.innerHTML); // Removed debug
        // console.log('   - CSS Display:', taskDropdown.style.display); // Removed debug
        // console.log('   - CSS Visibility:', taskDropdown.style.visibility); // Removed debug
        
        // Verificar opciones manualmente
        const options = taskDropdown.querySelectorAll('option');
        // console.log('   - Opciones encontradas:', options.length); // Removed debug
        // options.forEach((opt, idx) => { // Removed debug
        //     console.log(`     Opción ${idx}: "${opt.textContent}" (valor: "${opt.value}")`); // Removed debug
        // }); // Removed debug
    }
    
    // console.log('📋 Note Dropdown:', noteDropdown); // Removed debug
    if (noteDropdown) {
        // console.log('   - Visible:', noteDropdown.offsetParent !== null); // Removed debug
        // console.log('   - Opciones:', noteDropdown.options.length); // Removed debug
        // console.log('   - HTML:', noteDropdown.innerHTML); // Removed debug
        // console.log('   - CSS Display:', noteDropdown.style.display); // Removed debug
        // console.log('   - CSS Visibility:', noteDropdown.style.visibility); // Removed debug
        
        // Verificar opciones manualmente
        const options = noteDropdown.querySelectorAll('option');
        // console.log('   - Opciones encontradas:', options.length); // Removed debug
        // options.forEach((opt, idx) => { // Removed debug
        //     console.log(`     Opción ${idx}: "${opt.textContent}" (valor: "${opt.value}")`); // Removed debug
        // }); // Removed debug
    }
    
    // Verificar formularios
    const taskForm = document.getElementById('taskForm');
    const noteForm = document.getElementById('noteForm');
    
    // console.log('📋 Task Form:', taskForm); // Removed debug
    if (taskForm) {
        // console.log('   - Visible:', taskForm.offsetParent !== null); // Removed debug
        // console.log('   - CSS Display:', taskForm.style.display); // Removed debug
        // console.log('   - CSS Visibility:', taskForm.style.visibility); // Removed debug
    }
    
    // console.log('📋 Note Form:', noteForm); // Removed debug
    if (noteForm) {
        // console.log('   - Visible:', noteForm.offsetParent !== null); // Removed debug
        // console.log('   - CSS Display:', noteForm.style.display); // Removed debug
        // console.log('   - CSS Visibility:', noteForm.style.visibility); // Removed debug
    }
    
    // console.log('🔍 === FIN DEBUG ==='); // Removed debug
}

// Función para poblar dropdown manualmente
window.populateDropdownManually = function(dropdownId) {
    // console.log(`🔧 Poblando dropdown ${dropdownId} manualmente...`); // Removed debug
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
        // Agregar una opción de prueba
        const testOption = document.createElement('option');
        testOption.value = 'TEST_MATERIA';
        testOption.textContent = 'Materia de Prueba';
        dropdown.appendChild(testOption);
        // console.log(`✅ Opción de prueba agregada a ${dropdownId}`); // Removed debug
    } else {
        // console.log(`❌ Dropdown ${dropdownId} no encontrado`); // Removed debug
    }
}

// Función para forzar visibilidad de dropdown
window.forceDropdownVisibility = function(dropdownId) {
    // console.log(`🔧 Forzando visibilidad de dropdown ${dropdownId}...`); // Removed debug
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
        // Aplicar estilos forzados
        dropdown.style.setProperty('display', 'block', 'important');
        dropdown.style.setProperty('visibility', 'visible', 'important');
        dropdown.style.setProperty('opacity', '1', 'important');
        dropdown.style.setProperty('position', 'relative', 'important');
        dropdown.style.setProperty('z-index', '9999', 'important');
        
        // Verificar opciones
        const options = dropdown.querySelectorAll('option');
        // console.log(`👁️ Opciones en ${dropdownId}:`, options.length); // Removed debug
        // options.forEach((opt, idx) => { // Removed debug
        //     console.log(`   Opción ${idx}: "${opt.textContent}" (valor: "${opt.value}")`); // Removed debug
        // }); // Removed debug
        
        // console.log(`✅ Visibilidad forzada para ${dropdownId}`); // Removed debug
    } else {
        // console.log(`❌ Dropdown ${dropdownId} no encontrado`); // Removed debug
    }
}

// Función para verificar elementos duplicados
window.checkDuplicateElements = function() {
    // console.log('🔍 === VERIFICANDO ELEMENTOS DUPLICADOS ==='); // Removed debug
    
    // Verificar taskSubject
    const taskSubjects = document.querySelectorAll('#taskSubject');
    // console.log(`📋 Elementos con id="taskSubject": ${taskSubjects.length}`); // Removed debug
    // taskSubjects.forEach((el, idx) => { // Removed debug
    //     console.log(`   Elemento ${idx}:`, el); // Removed debug
    //     console.log(`   - Visible:`, el.offsetParent !== null); // Removed debug
    //     console.log(`   - Display:`, el.style.display); // Removed debug
    //     console.log(`   - Parent:`, el.parentElement); // Removed debug
    // }); // Removed debug
    
    // Verificar noteSubject
    const noteSubjects = document.querySelectorAll('#noteSubject');
    // console.log(`📋 Elementos con id="noteSubject": ${noteSubjects.length}`); // Removed debug
    // noteSubjects.forEach((el, idx) => { // Removed debug
    //     console.log(`   Elemento ${idx}:`, el); // Removed debug
    //     console.log(`   - Visible:`, el.offsetParent !== null); // Removed debug
    //     console.log(`   - Display:`, el.style.display); // Removed debug
    //     console.log(`   - Parent:`, el.parentElement); // Removed debug
    // }); // Removed debug
    
    // console.log('🔍 === FIN VERIFICACIÓN ==='); // Removed debug
}
