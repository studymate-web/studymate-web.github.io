// Módulo de Gestión de Notas
class NotesModule {
    constructor(authModule) {
        this.authModule = authModule;
        this.API_BASE_URL = window.studyMateApp ? window.studyMateApp.API_BASE_URL : 'https://studymate-back.onrender.com/api';
    }

    // Inicializar módulo de notas
    init() {
        this.setupEventListeners();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Los event listeners se configuran dinámicamente en showCreateNoteForm()
        // No es necesario configurar aquí ya que los formularios se crean dinámicamente
    }

    // Mostrar formulario de crear nota
    async showCreateNoteForm() {
        // Crear un modal temporal para el formulario de notas
        const modalHtml = `
            <div class="modal fade" id="noteFormModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-sticky-note me-2"></i>
                                Nueva Nota
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="createNoteForm" onsubmit="return false;">
                                <div class="mb-3">
                                    <label for="noteTitle" class="form-label">Título</label>
                                    <input type="text" class="form-control" id="noteTitle">
                                </div>
                                <div class="mb-3">
                                    <label for="noteContent" class="form-label">Contenido</label>
                                    <textarea class="form-control" id="noteContent" rows="6"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="noteSubject" class="form-label">Materia (opcional)</label>
                                    <select class="form-control" id="noteSubject">
                                        <option value="">Seleccionar materia</option>
                                    </select>
                                </div>
                                <div class="d-flex gap-2">
                                    <button type="button" class="btn btn-warning" id="saveNoteBtn">
                                        <i class="fas fa-save me-2"></i>
                                        Guardar Nota
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
        const modal = new bootstrap.Modal(document.getElementById('noteFormModal'));
        modal.show();
        
        // Poblar dropdown de materias
        await this.populateSubjectDropdown('noteSubject');
        
        // Refrescar todos los dropdowns si la función existe
        if (window.refreshAllSubjectDropdowns) {
            await window.refreshAllSubjectDropdowns();
        }
        
        // Configurar event listener para el botón de guardar
        setTimeout(() => {
            const saveBtn = document.getElementById('saveNoteBtn');
            if (saveBtn) {
                // Limpiar event listeners existentes
                const newSaveBtn = saveBtn.cloneNode(true);
                saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
                
                // Agregar el event listener
                newSaveBtn.addEventListener('click', (e) => {
                    e.preventDefault(); // Ensure default behavior is prevented
                    e.stopPropagation(); // Prevent event bubbling
                    this.handleCreateNote(e);
                });
            }
        }, 200);
        
        // Limpiar el modal cuando se cierre
        const modalElement = document.getElementById('noteFormModal');
        if (modalElement) {
            modalElement.addEventListener('hidden.bs.modal', function() {
                // Remover el modal del DOM
                this.remove();
                
                // Sincronizar backdrop usando la función global
                if (window.syncModalBackdrop) {
                    window.syncModalBackdrop();
                    setTimeout(() => window.syncModalBackdrop(), 150);
                } else if (window.clearModalBackdrop) {
                    window.clearModalBackdrop();
                    setTimeout(() => window.clearModalBackdrop(), 150);
                }
            });
        }
    }

    // Ocultar formulario de crear nota
    hideCreateNoteForm() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('noteFormModal'));
        if (modal) {
            modal.hide();
        }
        
        // Sincronizar backdrop usando la función global
        if (window.syncModalBackdrop) {
            window.syncModalBackdrop();
            setTimeout(() => window.syncModalBackdrop(), 150);
        } else if (window.clearModalBackdrop) {
            window.clearModalBackdrop();
            setTimeout(() => window.clearModalBackdrop(), 150);
        }
    }

    // Cargar notas
    async loadNotes() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/notas`, {
                headers: {
                    'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayNotes(data.notas || []);
            } else {
                console.error('Error loading notes');
            }
        } catch (error) {
            console.error('Error loading notes:', error);
        }
    }

    // Mostrar notas
    displayNotes(notes) {
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
                            <button class="btn btn-outline-warning" onclick="notesModule.editNote(${note.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="notesModule.deleteNote(${note.id})">
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
    async handleCreateNote(e) {
        e.preventDefault();
        
        // Buscar elementos dentro del modal específico
        const modal = document.getElementById('noteFormModal');
        if (!modal) {
            console.error('❌ Modal de nota no encontrado');
            if (this.authModule) {
                this.authModule.showNotification('Error: Formulario no encontrado', 'error');
            }
            return;
        }
        
        // Buscar elementos dentro del modal
        const titleElement = modal.querySelector('#noteTitle');
        const contentElement = modal.querySelector('#noteContent');
        const subjectElement = modal.querySelector('#noteSubject');
        const formElement = modal.querySelector('#createNoteForm');
        
        if (!titleElement || !contentElement || !subjectElement) {
            console.error('❌ Elementos del formulario de nota no encontrados:', {
                titleElement: !!titleElement,
                contentElement: !!contentElement,
                subjectElement: !!subjectElement
            });
            if (this.authModule) {
                this.authModule.showNotification('Error: Formulario de nota no cargado correctamente', 'error');
            }
            return;
        }
        
        const title = titleElement.value.trim();
        const content = contentElement.value.trim();
        const subject = subjectElement.value;
        const editId = formElement ? formElement.getAttribute('data-edit-id') : null;
        
        // Validación manual
        if (!title) {
            if (this.authModule) {
                this.authModule.showNotification('El título de la nota es obligatorio', 'error');
            }
            return;
        }
        
        if (!content) {
            if (this.authModule) {
                this.authModule.showNotification('El contenido de la nota es obligatorio', 'error');
            }
            return;
        }

        try {
            if (this.authModule) {
                this.authModule.showLoading();
            }
            
            const method = editId ? 'PUT' : 'POST';
            const url = editId ? `${this.API_BASE_URL}/notas/${editId}` : `${this.API_BASE_URL}/notas`;
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
                },
                body: JSON.stringify({
                    titulo: title,
                    contenido: content,
                    materia: subject
                })
            });

            const data = await response.json();
            if (this.authModule) {
                this.authModule.hideLoading();
            }

            if (response.ok) {
                const message = editId ? 'Nota actualizada exitosamente' : 'Nota creada exitosamente';
                if (this.authModule) {
                    this.authModule.showNotification(message, 'success');
                }
                this.hideCreateNoteForm();
                this.loadNotes();
                if (this.authModule) {
                    await this.authModule.addRecentActivity('note', editId ? `Nota actualizada: ${title}` : `Nota creada: ${title}`);
                }
                
                // Limpiar modo edición
                if (formElement) {
                    formElement.removeAttribute('data-edit-id');
                }
            } else {
                if (this.authModule) {
                    this.authModule.showNotification(data.error || 'Error al procesar nota', 'error');
                }
            }
        } catch (error) {
            if (this.authModule) {
                this.authModule.hideLoading();
                this.authModule.showNotification('Error de conexión', 'error');
            }
            console.error('❌ Create/Update note error:', error);
        }
    }

    // Editar nota
    async editNote(id) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/notas/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
                }
            });
            
            if (response.ok) {
                const note = await response.json();
                
                // Mostrar el formulario primero
                await this.showCreateNoteForm();
                
                // Esperar a que el modal esté visible y luego llenar los campos
                setTimeout(() => {
                    const modal = document.getElementById('noteFormModal');
                    if (!modal) {
                        console.error('❌ Modal de nota no encontrado para edición');
                        return;
                    }
                    
                    // Cambiar el formulario a modo edición
                    const formElement = modal.querySelector('#createNoteForm');
                    if (formElement) {
                        formElement.setAttribute('data-edit-id', id);
                    }
                    
                    // Llenar el formulario con los datos de la nota
                    const titleField = modal.querySelector('#noteTitle');
                    const contentField = modal.querySelector('#noteContent');
                    const subjectField = modal.querySelector('#noteSubject');
                    
                    if (titleField) titleField.value = note.titulo || '';
                    if (contentField) contentField.value = note.contenido || '';
                    if (subjectField) subjectField.value = note.materia || '';
                }, 200);
            } else {
                if (this.authModule) {
                    this.authModule.showNotification('Error al cargar la nota', 'error');
                }
            }
        } catch (error) {
            if (this.authModule) {
                this.authModule.showNotification('Error de conexión', 'error');
            }
            console.error('Edit note error:', error);
        }
    }

    // Eliminar nota
    async deleteNote(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
            try {
                const response = await fetch(`${this.API_BASE_URL}/notas/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
                    }
                });
                
                if (response.ok) {
                    if (this.authModule) {
                        this.authModule.showNotification('Nota eliminada correctamente', 'success');
                    }
                    this.loadNotes();
                    if (this.authModule) {
                        await this.authModule.addRecentActivity('note', 'Nota eliminada');
                    }
                } else {
                    if (this.authModule) {
                        this.authModule.showNotification('Error al eliminar la nota', 'error');
                    }
                }
            } catch (error) {
                if (this.authModule) {
                    this.authModule.showNotification('Error de conexión', 'error');
                }
                console.error('Delete note error:', error);
            }
        }
    }

    // Función para poblar dropdown de materias
    async populateSubjectDropdown(dropdownId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/materias`, {
                headers: {
                    'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const subjects = data.materias || [];
                
                const dropdown = document.getElementById(dropdownId);
                
                if (dropdown) {
                    // Limpiar opciones existentes
                    dropdown.innerHTML = '<option value="">Seleccionar materia</option>';
                    
                    // Agregar materias
                    subjects.forEach(subject => {
                        const option = document.createElement('option');
                        option.value = subject.nombre;
                        option.textContent = subject.nombre;
                        dropdown.appendChild(option);
                    });
                    
                    // Forzar visibilidad del dropdown
                    dropdown.style.display = 'block';
                    dropdown.style.visibility = 'visible';
                    dropdown.style.opacity = '1';
                    dropdown.style.position = 'relative';
                    dropdown.style.zIndex = '9999';
                    
                    // Forzar un re-render
                    dropdown.style.display = 'none';
                    setTimeout(() => {
                        dropdown.style.display = 'block';
                    }, 10);
                }
            } else {
                console.error(`❌ Error al obtener materias: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error loading subjects for dropdown:', error);
        }
    }
}

// Exportar para uso global
window.NotesModule = NotesModule;
