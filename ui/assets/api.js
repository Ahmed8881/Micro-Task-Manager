/**
 * API Communication Layer
 * Micro Task Manager
 */

const API = {
    baseURL: '../backend/api.php',
    
    // Generic AJAX request handler
    request: function(endpoint, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
        
        const config = { ...defaultOptions, ...options };
        
        return new Promise((resolve, reject) => {
            $.ajax({
                url: this.baseURL + endpoint,
                method: config.method,
                headers: config.headers,
                data: config.data,
                dataType: 'json',
                beforeSend: function() {
                    if (config.showLoader !== false) {
                        UI.showLoading();
                    }
                },
                success: function(response) {
                    if (config.showLoader !== false) {
                        UI.hideLoading();
                    }
                    
                    if (response.status === 'success') {
                        resolve(response);
                    } else {
                        reject(new Error(response.message || 'API Error'));
                    }
                },
                error: function(xhr, status, error) {
                    if (config.showLoader !== false) {
                        UI.hideLoading();
                    }
                    
                    let errorMessage = 'Network error occurred';
                    
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMessage = xhr.responseJSON.message;
                    } else if (error) {
                        errorMessage = error;
                    }
                    
                    reject(new Error(errorMessage));
                }
            });
        });
    },
    
    // Categories API
    categories: {
        getAll: function() {
            return API.request('/categories');
        },
        
        create: function(categoryData) {
            return API.request('/categories', {
                method: 'POST',
                data: JSON.stringify(categoryData)
            });
        },
        
        delete: function(id) {
            return API.request(`/categories/${id}`, {
                method: 'DELETE'
            });
        }
    },
    
    // Tasks API
    tasks: {
        getAll: function(filters = {}) {
            const params = new URLSearchParams();
            
            Object.keys(filters).forEach(key => {
                if (filters[key] !== null && filters[key] !== '') {
                    params.append(key, filters[key]);
                }
            });
            
            const queryString = params.toString();
            const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';
            
            return API.request(endpoint);
        },
        
        get: function(id) {
            return API.request(`/tasks/${id}`);
        },
        
        create: function(taskData) {
            return API.request('/tasks', {
                method: 'POST',
                data: JSON.stringify(taskData)
            });
        },
        
        update: function(id, taskData) {
            return API.request(`/tasks/${id}`, {
                method: 'PUT',
                data: JSON.stringify(taskData)
            });
        },
        
        delete: function(id) {
            return API.request(`/tasks/${id}`, {
                method: 'DELETE'
            });
        },
        
        move: function(id, status) {
            return API.request(`/tasks/${id}/move`, {
                method: 'POST',
                data: JSON.stringify({ status: status })
            });
        },
        
        export: function() {
            window.open(API.baseURL + '/tasks/export', '_blank');
        },
        
        getActivity: function(id) {
            return API.request(`/tasks/${id}/activity`);
        }
    },
    
    // Comments API
    comments: {
        get: function(taskId) {
            return API.request(`/tasks/${taskId}/comments`);
        },
        
        create: function(taskId, commentData) {
            return API.request(`/tasks/${taskId}/comments`, {
                method: 'POST',
                data: JSON.stringify(commentData)
            });
        }
    },
    
    // Subtasks API
    subtasks: {
        update: function(id, subtaskData) {
            return API.request(`/subtasks/${id}`, {
                method: 'PUT',
                data: JSON.stringify(subtaskData)
            });
        },
        
        delete: function(id) {
            return API.request(`/subtasks/${id}`, {
                method: 'DELETE'
            });
        }
    }
};

/**
 * UI Helper Functions
 */
const UI = {
    // Loading indicator
    showLoading: function() {
        $('#loadingOverlay').removeClass('hidden').addClass('flex');
    },
    
    hideLoading: function() {
        $('#loadingOverlay').addClass('hidden').removeClass('flex');
    },
    
    // Toast notifications
    showToast: function(message, type = 'info', duration = 5000) {
        const toastId = 'toast_' + Date.now();
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        const colorMap = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        const toast = $(`
            <div id="${toastId}" class="toast ${colorMap[type]} text-white p-4 rounded-lg shadow-lg flex items-center space-x-3 min-w-80">
                <i class="${iconMap[type]}"></i>
                <span class="flex-1">${message}</span>
                <button onclick="UI.removeToast('${toastId}')" class="text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `);
        
        $('#toastContainer').append(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            this.removeToast(toastId);
        }, duration);
    },
    
    removeToast: function(toastId) {
        $(`#${toastId}`).addClass('toast-leave');
        setTimeout(() => {
            $(`#${toastId}`).remove();
        }, 300);
    },
    
    // Modal helpers
    showModal: function(modalId) {
        $(`#${modalId}`).removeClass('hidden').find('.modal-content').addClass('modal-enter');
    },
    
    hideModal: function(modalId) {
        $(`#${modalId}`).find('.modal-content').addClass('modal-leave');
        setTimeout(() => {
            $(`#${modalId}`).addClass('hidden').find('.modal-content').removeClass('modal-enter modal-leave');
        }, 300);
    },
    
    // Form validation
    validateForm: function(formSelector, rules) {
        const form = $(formSelector);
        let isValid = true;
        
        Object.keys(rules).forEach(fieldName => {
            const field = form.find(`[name="${fieldName}"], #${fieldName}`);
            const rule = rules[fieldName];
            const value = field.val().trim();
            
            // Remove previous error styles
            field.removeClass('form-error');
            field.next('.error-message').remove();
            
            // Check required
            if (rule.required && !value) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
                return;
            }
            
            // Check min length
            if (rule.minLength && value.length < rule.minLength) {
                this.showFieldError(field, `Minimum ${rule.minLength} characters required`);
                isValid = false;
                return;
            }
            
            // Check max length
            if (rule.maxLength && value.length > rule.maxLength) {
                this.showFieldError(field, `Maximum ${rule.maxLength} characters allowed`);
                isValid = false;
                return;
            }
            
            // Check email format
            if (rule.email && value && !this.isValidEmail(value)) {
                this.showFieldError(field, 'Invalid email format');
                isValid = false;
                return;
            }
            
            // Check date format
            if (rule.date && value && !this.isValidDate(value)) {
                this.showFieldError(field, 'Invalid date format');
                isValid = false;
                return;
            }
        });
        
        return isValid;
    },
    
    showFieldError: function(field, message) {
        field.addClass('form-error');
        field.after(`<div class="error-message text-red-500 text-sm mt-1">${message}</div>`);
    },
    
    isValidEmail: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    isValidDate: function(date) {
        return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
    },
    
    // Utility functions
    formatDate: function(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },
    
    formatDateTime: function(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    getPriorityColor: function(priority) {
        const colors = {
            'High': 'text-red-600 bg-red-100',
            'Medium': 'text-yellow-600 bg-yellow-100',
            'Low': 'text-green-600 bg-green-100'
        };
        return colors[priority] || 'text-gray-600 bg-gray-100';
    },
    
    getPriorityBorder: function(priority) {
        const borders = {
            'High': 'border-l-red-500',
            'Medium': 'border-l-yellow-500',
            'Low': 'border-l-green-500'
        };
        return borders[priority] || 'border-l-gray-500';
    },
    
    truncateText: function(text, maxLength = 100) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
};

/**
 * Event Source for real-time updates (Server-Sent Events)
 */
const RealtimeUpdates = {
    eventSource: null,
    isConnected: false,
    retryCount: 0,
    maxRetries: 3,
    
    init: function() {
        this.connect();
    },
    
    connect: function() {
        if (this.eventSource) {
            this.eventSource.close();
        }
        
        try {
            this.eventSource = new EventSource(API.baseURL + '/stream/updates');
            
            this.eventSource.onopen = () => {
                console.log('SSE connection opened');
                this.isConnected = true;
                this.retryCount = 0;
            };
            
            this.eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleUpdate(data);
            };
            
            this.eventSource.onerror = () => {
                console.log('SSE connection error');
                this.isConnected = false;
                this.handleConnectionError();
            };
            
        } catch (error) {
            console.log('SSE not supported, falling back to polling');
            this.fallbackToPolling();
        }
    },
    
    handleUpdate: function(data) {
        if (data.type === 'task_updated' || data.type === 'task_created' || data.type === 'task_deleted') {
            // Refresh the tasks without showing loader
            TaskManager.loadTasks(false);
            UI.showToast('Tasks updated', 'info', 2000);
        }
    },
    
    handleConnectionError: function() {
        this.retryCount++;
        
        if (this.retryCount <= this.maxRetries) {
            console.log(`Retrying SSE connection (${this.retryCount}/${this.maxRetries})`);
            setTimeout(() => {
                this.connect();
            }, 5000 * this.retryCount);
        } else {
            console.log('Max retries reached, falling back to polling');
            this.fallbackToPolling();
        }
    },
    
    fallbackToPolling: function() {
        // Poll every 30 seconds
        setInterval(() => {
            if (!this.isConnected) {
                TaskManager.loadTasks(false);
            }
        }, 30000);
    },
    
    disconnect: function() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.isConnected = false;
    }
};