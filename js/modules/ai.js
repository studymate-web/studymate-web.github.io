// Módulo de Inteligencia Artificial
class AIModule {
    constructor() {
        this.API_BASE_URL = 'https://studymate-back.onrender.com/api';
        this.authModule = window.authModule; // Referencia al módulo de autenticación
    }

    // Inicializar módulo de IA
    init() {
        this.setupEventListeners();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Chat
        const sendChatBtn = document.getElementById('sendChatBtn');
        const chatInput = document.getElementById('chatInput');

        if (sendChatBtn) {
            sendChatBtn.addEventListener('click', () => this.sendChatMessage());
        }
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });
        }

        // Plan form
        const planForm = document.getElementById('planForm');
        if (planForm) {
            planForm.addEventListener('submit', (e) => this.handlePlanGeneration(e));
        }

        // PDF form
        const pdfForm = document.getElementById('pdfForm');
        if (pdfForm) {
            pdfForm.addEventListener('submit', (e) => this.handlePdfSummary(e));
        }
    }

    // Enviar mensaje de chat
    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;

        // Agregar mensaje del usuario
        this.addChatMessage(message, 'user');
        input.value = '';

        try {
            this.showChatLoading();
            
            const response = await fetch(`${this.API_BASE_URL}/ai/chatbot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
                },
                body: JSON.stringify({
                    pregunta: message,
                    contexto: 'Chat académico'
                })
            });

            const data = await response.json();
            this.hideChatLoading();

            if (response.ok) {
                this.addChatMessage(data.respuesta, 'bot');
                if (this.authModule) {
                    await this.authModule.addRecentActivity('chat', `Pregunta: ${message.substring(0, 50)}...`);
                }
            } else {
                this.addChatMessage('Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta de nuevo.', 'bot');
            }
        } catch (error) {
            this.hideChatLoading();
            this.addChatMessage('Error de conexión. Por favor, verifica tu conexión a internet.', 'bot');
            console.error('Chat error:', error);
        }
    }

    // Agregar mensaje al chat
    addChatMessage(content, type) {
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
    showChatLoading() {
        const sendBtn = document.getElementById('sendChatBtn');
        sendBtn.innerHTML = '<div class="loading"></div>';
        sendBtn.disabled = true;
    }

    hideChatLoading() {
        const sendBtn = document.getElementById('sendChatBtn');
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        sendBtn.disabled = false;
    }

    // Manejar generación de plan de estudio
    async handlePlanGeneration(e) {
        e.preventDefault();
        
        const subjects = document.getElementById('planSubjects').value;
        const hours = document.getElementById('planHours').value;
        
        if (!subjects || !hours) {
            if (this.authModule) {
                this.authModule.showNotification('Por favor, completa todos los campos', 'error');
            }
            return;
        }

        try {
            if (this.authModule) {
                this.authModule.showLoading();
            }
            
            const subjectsList = subjects.split(',').map(s => s.trim()).filter(s => s);
            
            const response = await fetch(`${this.API_BASE_URL}/ai/plan-estudio`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
                },
                body: JSON.stringify({
                    materias: subjectsList,
                    horasDisponibles: parseInt(hours)
                })
            });

            const data = await response.json();
            if (this.authModule) {
                this.authModule.hideLoading();
            }

            if (response.ok) {
                document.getElementById('planContent').textContent = data.plan;
                document.getElementById('planResult').style.display = 'block';
                if (this.authModule) {
                    await this.authModule.addRecentActivity('plan', `Generado para ${subjectsList.length} materias`);
                }
            } else {
                if (this.authModule) {
                    this.authModule.showNotification(data.error || 'Error al generar el plan', 'error');
                }
            }
        } catch (error) {
            if (this.authModule) {
                this.authModule.hideLoading();
                this.authModule.showNotification('Error de conexión', 'error');
            }
            console.error('Plan generation error:', error);
        }
    }

    // Manejar resumen de PDF
    async handlePdfSummary(e) {
        e.preventDefault();
        
        const pdfFile = document.getElementById('pdfFile').files[0];
        const content = document.getElementById('pdfContent').value.trim();
        
        if (!pdfFile && !content) {
            if (this.authModule) {
                this.authModule.showNotification('Por favor, sube un archivo PDF o ingresa contenido para resumir', 'error');
            }
            return;
        }

        try {
            if (this.authModule) {
                this.authModule.showLoading();
            }
            
            let requestBody;
            let endpoint = '/ai/resumir-pdf';
            
            if (pdfFile) {
                // Si hay archivo PDF, usar endpoint para archivos
                endpoint = '/ai/resumir-pdf-archivo';
                const formData = new FormData();
                formData.append('archivo', pdfFile);
                
                const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
                    },
                    body: formData
                });
                
                const data = await response.json();
                if (this.authModule) {
                    this.authModule.hideLoading();
                }

                if (response.ok) {
                    document.getElementById('pdfSummary').textContent = data.resumen;
                    document.getElementById('pdfResult').style.display = 'block';
                    if (this.authModule) {
                        await this.authModule.addRecentActivity('pdf', `Resumen generado de archivo: ${pdfFile.name}`);
                    }
                } else {
                    if (this.authModule) {
                        this.authModule.showNotification(data.error || 'Error al generar el resumen', 'error');
                    }
                }
            } else {
                // Si solo hay contenido de texto
                const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.authModule ? this.authModule.getAuthToken() : ''}`
                    },
                    body: JSON.stringify({
                        contenido: content
                    })
                });

                const data = await response.json();
                if (this.authModule) {
                    this.authModule.hideLoading();
                }

                if (response.ok) {
                    document.getElementById('pdfSummary').textContent = data.resumen;
                    document.getElementById('pdfResult').style.display = 'block';
                    if (this.authModule) {
                        await this.authModule.addRecentActivity('pdf', `Resumen generado (${content.length} caracteres)`);
                    }
                } else {
                    if (this.authModule) {
                        this.authModule.showNotification(data.error || 'Error al generar el resumen', 'error');
                    }
                }
            }
        } catch (error) {
            if (this.authModule) {
                this.authModule.hideLoading();
                this.authModule.showNotification('Error de conexión', 'error');
            }
            console.error('PDF summary error:', error);
        }
    }
}

// Exportar para uso global
window.AIModule = AIModule;
