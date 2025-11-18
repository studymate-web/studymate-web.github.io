// Módulo de Autenticación
class AuthModule {
    constructor() {
        this.currentUser = null;
        this.authToken = localStorage.getItem('authToken');
        this.inactivityTimer = null;
        this.INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos
        this.API_BASE_URL = 'https://studymate-back.onrender.com/api';
    }

    // Inicializar módulo de autenticación
    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    // Configurar event listeners
    setupEventListeners() {
        const authForm = document.getElementById('authForm');
        const toggleAuthMode = document.getElementById('toggleAuthMode');
        const logoutBtn = document.getElementById('logoutBtn');

        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuth(e));
        }
        if (toggleAuthMode) {
            toggleAuthMode.addEventListener('click', () => this.toggleAuthMode());
        }
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Event listeners para resetear timer de inactividad
        document.addEventListener('mousemove', () => this.resetInactivityTimer());
        document.addEventListener('keypress', () => this.resetInactivityTimer());
        document.addEventListener('click', () => this.resetInactivityTimer());
        document.addEventListener('scroll', () => this.resetInactivityTimer());
    }

    // Manejar autenticación
    async handleAuth(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const nombre = document.getElementById('nombre').value;
        const apellido = document.getElementById('apellido').value;
        const isRegisterMode = document.getElementById('authModalTitle').textContent.includes('Registro');
        
        if (isRegisterMode && password !== confirmPassword) {
            this.showNotification('Las contraseñas no coinciden', 'error');
            return;
        }

        try {
            this.showLoading();
            
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
            
            const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.ok) {
                this.authToken = data.token;
                localStorage.setItem('authToken', this.authToken);
                this.currentUser = data.usuario;
                localStorage.setItem('currentUser', JSON.stringify(data.usuario));
                
                this.hideLoading();
                this.hideAuthModal();
                this.showMainContent();
                this.showNotification('¡Bienvenido a StudyMate IA!', 'success');
            } else {
                this.hideLoading();
                this.showNotification(data.message || data.error || 'Error de autenticación', 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('Error de conexión', 'error');
            console.error('Auth error:', error);
        }
    }

    // Verificar estado de autenticación
    async checkAuthStatus() {
        try {
            // Verificar si hay token
            if (!this.authToken) {
                console.log('No hay token de autenticación');
                this.showAuthModal();
                return;
            }

            // Validar SIEMPRE el token contra el servidor
            const response = await fetch(`${this.API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.usuario;
                localStorage.setItem('currentUser', JSON.stringify(data.usuario));
                this.showMainContent();
            } else {
                console.log('Token inválido o expirado');
                this.clearAuthData();
                this.showAuthModal();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.clearAuthData();
            this.showAuthModal();
        }
    }

    // Mostrar contenido principal
    showMainContent() {
        const mainContent = document.getElementById('mainContent');
        const userName = document.getElementById('userName');
        
        if (mainContent) mainContent.style.display = 'block';
        if (userName) userName.textContent = this.currentUser?.nombre || 'Usuario';
        
        this.loadRecentActivity();
        this.resetInactivityTimer();
    }

    // Mostrar modal de autenticación
    showAuthModal() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) mainContent.style.display = 'none';
        
        const authModal = new bootstrap.Modal(document.getElementById('authModal'));
        authModal.show();
    }

    // Ocultar modal de autenticación
    hideAuthModal() {
        const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
        if (authModal) authModal.hide();
    }

    // Cambiar modo de autenticación
    toggleAuthMode() {
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

    // Reiniciar timer de inactividad
    resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        if (this.authToken) {
            this.inactivityTimer = setTimeout(() => {
                this.showNotification('Sesión cerrada por inactividad', 'warning');
                this.logout();
            }, this.INACTIVITY_TIMEOUT);
        }
    }

    // Cerrar sesión
    logout() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
        this.clearAuthData();
        this.showAuthModal();
        this.showNotification('Sesión cerrada', 'info');
    }

    // Limpiar datos de autenticación
    clearAuthData() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        this.authToken = null;
        this.currentUser = null;
    }

    // Cargar actividad reciente
    async loadRecentActivity() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/usuarios/actividad`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayRecentActivity(data.actividades || []);
            }
        } catch (error) {
            console.error('Error loading activity:', error);
        }
    }

    // Mostrar actividad reciente
    displayRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        
        if (!activities || activities.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay actividad reciente</p>';
            return;
        }

        const activityHTML = activities.map(activity => `
            <div class="activity-item d-flex align-items-center">
                <div class="activity-icon bg-primary text-white">
                    <i class="fas fa-${this.getActivityIcon(activity.tipo)}"></i>
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
    getActivityIcon(type) {
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
    async addRecentActivity(type, description) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/usuarios/actividad`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    tipo: type,
                    descripcion: description
                })
            });
            
            if (response.ok) {
                this.loadRecentActivity();
            }
        } catch (error) {
            console.error('Error adding activity:', error);
        }
    }

    // Mostrar notificación
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Mostrar/ocultar loading global
    showLoading() {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="loading-spinner"></div>';
        overlay.id = 'loadingOverlay';
        document.body.appendChild(overlay);
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // Getters
    getCurrentUser() {
        return this.currentUser;
    }

    getAuthToken() {
        return this.authToken;
    }

    isAuthenticated() {
        return !!this.authToken;
    }
}

// Exportar para uso global
window.AuthModule = AuthModule;