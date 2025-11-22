/**
 * Main JavaScript File for Micro Task Manager
 * Handles all UI interactions and business logic
 */

const TaskManager = {
    // Application state
    currentFilters: {
        search: '',
        category_id: '',
        priority: '',
        assigned_to: '',
        sort: 'created_at'
    },
    currentTask: null,
    categories: [],
    bulkMode: false,
    selectedTasks: new Set(),
    
    // Initialize the application
    init: function() {
        this.bindEvents();
        this.loadCategories();
        this.loadTasks();
        this.setupDragAndDrop();
        RealtimeUpdates.init();
    },
    
    // Bind all event handlers
    bindEvents: function() {
        // Modal events
        $('#addTaskBtn').on('click', () => this.showTaskModal());
        $('#closeModalBtn, #cancelBtn').on('click', () => this.hideTaskModal());
        $('#closeDetailModalBtn').on('click', () => this.hideTaskDetailModal());
        $('#closeCategoryModalBtn, #cancelCategoryBtn').on('click', () => this.hideCategoryModal());
        
        // Form submissions
        $('#taskForm').on('submit', (e) => this.handleTaskSubmit(e));
        $('#categoryForm').on('submit', (e) => this.handleCategorySubmit(e));
        
        // Filter events
        $('#searchInput').on('input', debounce(() => this.applyFilters(), 500));
        $('#categoryFilter, #priorityFilter, #assignedFilter, #sortFilter').on('change', () => this.applyFilters());
        
        // Action buttons
        $('#exportBtn').on('click', () => this.exportTasks());
        $('#refreshBtn').on('click', () => this.loadTasks());
        $('#addCategoryBtn').on('click', () => this.showCategoryModal());
        $('#addSubtaskBtn').on('click', () => this.addSubtaskField());
        
        // Bulk actions
        $('#bulkModeBtn').on('click', () => this.toggleBulkMode());
        $('#bulkDeleteBtn').on('click', () => this.bulkDeleteTasks());
        $('#bulkCompleteBtn').on('click', () => this.bulkCompleteTasks());
        
        // Close modals when clicking outside
        $('.fixed.inset-0').on('click', function(e) {
            if (e.target === this) {
                $(this).addClass('hidden');
            }
        });
    },
    
    // Load categories from API
    loadCategories: function() {
        API.categories.getAll()
            .then(response => {
                this.categories = response.data;
                this.updateCategorySelects();
            })
            .catch(error => {
                UI.showToast('Failed to load categories: ' + error.message, 'error');
            });
    },
    
    // Update category dropdowns
    updateCategorySelects: function() {
        const categoryOptions = this.categories.map(cat => 
            `<option value="${cat.id}" style="color: ${cat.color}">${cat.name}</option>`
        ).join('');
        
        $('#categoryFilter').html('<option value="">All Categories</option>' + categoryOptions);
        $('#taskCategory').html('<option value="">No Category</option>' + categoryOptions);
    },
    
    // Load tasks from API
    loadTasks: function(showLoader = true) {
        API.tasks.getAll(this.currentFilters)
            .then(response => {
                this.renderTasks(response.data.tasks);
                this.updateTaskCounts(response.data.tasks);
            })
            .catch(error => {
                UI.showToast('Failed to load tasks: ' + error.message, 'error');
            });
    },
    
    // Render tasks in Kanban columns
    renderTasks: function(tasks) {
        // Clear existing tasks
        $('.task-column').empty();
        
        // Group tasks by status
        const tasksByStatus = {
            todo: tasks.filter(t => t.status === 'todo'),
            in_progress: tasks.filter(t => t.status === 'in_progress'),
            done: tasks.filter(t => t.status === 'done')
        };
        
        // Render tasks for each status
        Object.keys(tasksByStatus).forEach(status => {
            const columnId = status === 'in_progress' ? 'inProgressColumn' : status + 'Column';
            const column = $(`#${columnId}`);
            
            if (tasksByStatus[status].length === 0) {
                column.html('<div class="text-center text-gray-400 py-8">No tasks</div>');
            } else {
                tasksByStatus[status].forEach(task => {
                    column.append(this.renderTaskCard(task));
                });
            }
        });
        
        // Re-bind task card events
        this.bindTaskCardEvents();
    },
    
    // Render individual task card
    renderTaskCard: function(task) {
        const category = this.categories.find(c => c.id == task.category_id);
        const categoryBadge = category ? 
            `<span class="category-badge inline-flex px-2 py-1 text-xs rounded-full" style="background-color: ${category.color}20; color: ${category.color};">
                ${category.name}
            </span>` : '';
        
        const dueDateBadge = task.due_date ? 
            `<span class="text-xs text-gray-500 flex items-center">
                <i class="fas fa-calendar mr-1"></i>
                ${UI.formatDate(task.due_date)}
            </span>` : '';
        
        const assigneeBadge = task.assigned_to ? 
            `<span class="text-xs text-gray-600 flex items-center">
                <i class="fas fa-user mr-1"></i>
                ${task.assigned_to}
            </span>` : '';
        
        const subtaskProgress = task.subtasks_total > 0 ? 
            `<div class="flex items-center text-xs text-gray-600 mt-2">
                <i class="fas fa-list-ul mr-1"></i>
                <span>${task.subtasks_completed}/${task.subtasks_total} subtasks</span>
                <div class="flex-1 ml-2 bg-gray-200 rounded-full h-2">
                    <div class="progress-bar bg-green-500 h-2 rounded-full" 
                         style="width: ${(task.subtasks_completed / task.subtasks_total) * 100}%"></div>
                </div>
            </div>` : '';
        
        const bulkCheckbox = this.bulkMode ? 
            `<div class="absolute top-2 left-2">
                <input type="checkbox" class="task-checkbox checkbox-animate" value="${task.id}">
            </div>` : '';
        
        return $(`
            <div class="task-card bg-white rounded-lg shadow-md border ${UI.getPriorityBorder(task.priority)} p-4 mb-3 cursor-pointer relative"
                 data-task-id="${task.id}" data-status="${task.status}" draggable="true">
                ${bulkCheckbox}
                
                <div class="flex justify-between items-start mb-3 ${this.bulkMode ? 'ml-6' : ''}">
                    <h3 class="font-semibold text-gray-900 text-sm leading-tight flex-1 mr-2">
                        ${task.title}
                    </h3>
                    
                    <div class="flex items-center space-x-1">
                        <span class="priority-badge px-2 py-1 text-xs rounded-full ${UI.getPriorityColor(task.priority)}">
                            ${task.priority}
                        </span>
                        
                        <div class="dropdown relative">
                            <button class="task-menu text-gray-400 hover:text-gray-600 p-1 rounded">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="dropdown-menu hidden absolute right-0 top-8 bg-white shadow-lg rounded-lg border z-10 min-w-32">
                                <a href="#" class="task-view block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    <i class="fas fa-eye mr-2"></i>View
                                </a>
                                <a href="#" class="task-edit block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    <i class="fas fa-edit mr-2"></i>Edit
                                </a>
                                <a href="#" class="task-delete block px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                                    <i class="fas fa-trash mr-2"></i>Delete
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <p class="text-gray-600 text-sm mb-3 leading-relaxed">
                    ${UI.truncateText(task.description, 80)}
                </p>
                
                <div class="flex flex-wrap gap-2 items-center text-xs">
                    ${categoryBadge}
                    ${dueDateBadge}
                    ${assigneeBadge}
                </div>
                
                ${subtaskProgress}
            </div>
        `);
    },
    
    // Bind task card events
    bindTaskCardEvents: function() {
        // Task card click (view details)
        $('.task-card').off('click').on('click', (e) => {
            if (!$(e.target).closest('.task-menu, .task-checkbox').length) {
                const taskId = $(e.currentTarget).data('task-id');
                this.showTaskDetail(taskId);
            }
        });
        
        // Task menu toggle
        $('.task-menu').off('click').on('click', function(e) {
            e.stopPropagation();
            $('.dropdown-menu').addClass('hidden');
            $(this).siblings('.dropdown-menu').toggleClass('hidden');
        });
        
        // Task actions
        $('.task-view').off('click').on('click', (e) => {
            e.preventDefault();
            const taskId = $(e.target).closest('.task-card').data('task-id');
            this.showTaskDetail(taskId);
        });
        
        $('.task-edit').off('click').on('click', (e) => {
            e.preventDefault();
            const taskId = $(e.target).closest('.task-card').data('task-id');
            this.editTask(taskId);
        });
        
        $('.task-delete').off('click').on('click', (e) => {
            e.preventDefault();
            const taskId = $(e.target).closest('.task-card').data('task-id');
            this.deleteTask(taskId);
        });
        
        // Bulk selection checkboxes
        $('.task-checkbox').off('change').on('change', (e) => {
            const taskId = parseInt($(e.target).val());
            if (e.target.checked) {
                this.selectedTasks.add(taskId);
            } else {
                this.selectedTasks.delete(taskId);
            }
            this.updateBulkActions();
        });
        
        // Close dropdowns when clicking elsewhere
        $(document).off('click.dropdown').on('click.dropdown', function() {
            $('.dropdown-menu').addClass('hidden');
        });
    },
    
    // Update task counts in column headers
    updateTaskCounts: function(tasks) {
        const counts = {
            todo: tasks.filter(t => t.status === 'todo').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            done: tasks.filter(t => t.status === 'done').length
        };
        
        $('#todoCount').text(counts.todo);
        $('#inProgressCount').text(counts.in_progress);
        $('#doneCount').text(counts.done);
    },
    
    // Setup drag and drop functionality
    setupDragAndDrop: function() {
        // Task drag events
        $(document).on('dragstart', '.task-card', function(e) {
            e.originalEvent.dataTransfer.setData('text/plain', $(this).data('task-id'));
            $(this).addClass('task-dragging');
        });
        
        $(document).on('dragend', '.task-card', function(e) {
            $(this).removeClass('task-dragging');
        });
        
        // Column drop events
        $('.task-column').on('dragover', function(e) {
            e.preventDefault();
            $(this).addClass('drag-over');
        });
        
        $('.task-column').on('dragleave', function(e) {
            $(this).removeClass('drag-over');
        });
        
        $('.task-column').on('drop', (e) => {
            e.preventDefault();
            const taskId = e.originalEvent.dataTransfer.getData('text/plain');
            const newStatus = $(e.currentTarget).data('status');
            
            $(e.currentTarget).removeClass('drag-over');
            
            if (taskId && newStatus) {
                this.moveTask(parseInt(taskId), newStatus);
            }
        });
    },
    
    // Move task to different status
    moveTask: function(taskId, newStatus) {
        API.tasks.move(taskId, newStatus)
            .then(response => {
                UI.showToast('Task moved successfully', 'success');
                this.loadTasks();
            })
            .catch(error => {
                UI.showToast('Failed to move task: ' + error.message, 'error');
            });
    },
    
    // Show task creation/edit modal
    showTaskModal: function(taskData = null) {
        this.currentTask = taskData;
        
        // Reset form
        $('#taskForm')[0].reset();
        $('#subtasksList').empty();
        
        if (taskData) {
            // Edit mode
            $('#modalTitle').text('Edit Task');
            $('#taskTitle').val(taskData.title);
            $('#taskDescription').val(taskData.description);
            $('#taskPriority').val(taskData.priority);
            $('#taskStatus').val(taskData.status);
            $('#taskCategory').val(taskData.category_id || '');
            $('#taskDueDate').val(taskData.due_date || '');
            $('#taskAssignedTo').val(taskData.assigned_to || '');
            
            // Add existing subtasks
            if (taskData.subtasks) {
                taskData.subtasks.forEach(subtask => {
                    this.addSubtaskField(subtask.title, subtask.is_done);
                });
            }
        } else {
            // Create mode
            $('#modalTitle').text('Create New Task');
        }
        
        UI.showModal('taskModal');
        $('#taskTitle').focus();
    },
    
    // Hide task modal
    hideTaskModal: function() {
        UI.hideModal('taskModal');
        this.currentTask = null;
    },
    
    // Handle task form submission
    handleTaskSubmit: function(e) {
        e.preventDefault();
        
        // Validate form
        const isValid = UI.validateForm('#taskForm', {
            taskTitle: { required: true, minLength: 3, maxLength: 255 },
            taskDescription: { maxLength: 1000 },
            taskAssignedTo: { maxLength: 255 },
            taskDueDate: { date: true }
        });
        
        if (!isValid) {
            return;
        }
        
        // Collect form data
        const formData = {
            title: $('#taskTitle').val().trim(),
            description: $('#taskDescription').val().trim(),
            priority: $('#taskPriority').val(),
            status: $('#taskStatus').val(),
            category_id: $('#taskCategory').val() || null,
            due_date: $('#taskDueDate').val() || null,
            assigned_to: $('#taskAssignedTo').val().trim() || null,
            subtasks: []
        };
        
        // Collect subtasks
        $('.subtask-input').each(function() {
            const title = $(this).val().trim();
            if (title) {
                formData.subtasks.push({
                    title: title,
                    is_done: $(this).siblings('.subtask-done').is(':checked') ? 1 : 0
                });
            }
        });
        
        // Submit form
        const apiCall = this.currentTask ? 
            API.tasks.update(this.currentTask.id, formData) : 
            API.tasks.create(formData);
        
        apiCall.then(response => {
            const action = this.currentTask ? 'updated' : 'created';
            UI.showToast(`Task ${action} successfully`, 'success');
            this.hideTaskModal();
            this.loadTasks();
        }).catch(error => {
            UI.showToast('Failed to save task: ' + error.message, 'error');
        });
    },
    
    // Add subtask input field
    addSubtaskField: function(title = '', isDone = false) {
        const subtaskId = 'subtask_' + Date.now();
        const subtaskHtml = $(`
            <div class="subtask-item flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <input type="checkbox" class="subtask-done checkbox-animate" ${isDone ? 'checked' : ''}>
                <input type="text" class="subtask-input flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
                       placeholder="Subtask title..." value="${title}">
                <button type="button" class="remove-subtask text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `);
        
        $('#subtasksList').append(subtaskHtml);
        
        // Bind remove button
        subtaskHtml.find('.remove-subtask').on('click', function() {
            subtaskHtml.remove();
        });
        
        // Focus on new input
        subtaskHtml.find('.subtask-input').focus();
    },
    
    // Show task detail modal
    showTaskDetail: function(taskId) {
        API.tasks.get(taskId)
            .then(response => {
                const task = response.data;
                this.renderTaskDetail(task);
                UI.showModal('taskDetailModal');
            })
            .catch(error => {
                UI.showToast('Failed to load task details: ' + error.message, 'error');
            });
    },
    
    // Render task detail modal content
    renderTaskDetail: function(task) {
        $('#detailModalTitle').text(task.title);
        
        const category = this.categories.find(c => c.id == task.category_id);
        const categoryBadge = category ? 
            `<span class="inline-flex px-3 py-1 text-sm rounded-full" style="background-color: ${category.color}20; color: ${category.color};">
                ${category.name}
            </span>` : '<span class="text-gray-500">No category</span>';
        
        const content = `
            <div class="space-y-6">
                <!-- Task Info -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <span class="inline-flex px-3 py-1 text-sm rounded-full ${this.getStatusColor(task.status)}">
                            ${this.getStatusLabel(task.status)}
                        </span>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <span class="inline-flex px-3 py-1 text-sm rounded-full ${UI.getPriorityColor(task.priority)}">
                            ${task.priority}
                        </span>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        ${categoryBadge}
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <span class="text-gray-900">${task.due_date ? UI.formatDate(task.due_date) : 'No due date'}</span>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                        <span class="text-gray-900">${task.assigned_to || 'Unassigned'}</span>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Created</label>
                        <span class="text-gray-900">${UI.formatDateTime(task.created_at)}</span>
                    </div>
                </div>
                
                <!-- Description -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <div class="bg-gray-50 rounded-lg p-4 text-gray-900 whitespace-pre-wrap">
                        ${task.description || 'No description provided'}
                    </div>
                </div>
                
                <!-- Subtasks -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Subtasks (${task.subtasks ? task.subtasks.filter(s => s.is_done).length : 0}/${task.subtasks ? task.subtasks.length : 0} completed)
                    </label>
                    <div class="space-y-2">
                        ${task.subtasks && task.subtasks.length ? task.subtasks.map(subtask => `
                            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <input type="checkbox" class="subtask-toggle checkbox-animate" 
                                       data-subtask-id="${subtask.id}" ${subtask.is_done ? 'checked' : ''}>
                                <span class="flex-1 ${subtask.is_done ? 'line-through text-gray-500' : 'text-gray-900'}">
                                    ${subtask.title}
                                </span>
                                <button class="delete-subtask text-red-500 hover:text-red-700" data-subtask-id="${subtask.id}">
                                    <i class="fas fa-trash text-sm"></i>
                                </button>
                            </div>
                        `).join('') : '<p class="text-gray-500 text-center py-4">No subtasks</p>'}
                    </div>
                </div>
                
                <!-- Comments -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                    <div id="commentsList" class="space-y-3 max-h-64 overflow-y-auto">
                        ${task.comments && task.comments.length ? task.comments.map(comment => `
                            <div class="bg-gray-50 rounded-lg p-3">
                                <div class="flex justify-between items-start mb-2">
                                    <span class="font-medium text-gray-900">${comment.author}</span>
                                    <span class="text-xs text-gray-500">${UI.formatDateTime(comment.created_at)}</span>
                                </div>
                                <p class="text-gray-700">${comment.content}</p>
                            </div>
                        `).join('') : '<p class="text-gray-500 text-center py-4">No comments</p>'}
                    </div>
                    
                    <!-- Add Comment Form -->
                    <form id="commentForm" class="mt-4 space-y-3">
                        <input type="hidden" id="commentTaskId" value="${task.id}">
                        <input type="text" id="commentAuthor" placeholder="Your name..." 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                        <textarea id="commentContent" placeholder="Add a comment..." rows="3"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"></textarea>
                        <button type="submit" class="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg">
                            Add Comment
                        </button>
                    </form>
                </div>
                
                <!-- Actions -->
                <div class="flex justify-between pt-4 border-t">
                    <div class="space-x-3">
                        <button class="edit-task-btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg" data-task-id="${task.id}">
                            <i class="fas fa-edit mr-2"></i>Edit Task
                        </button>
                        <button class="delete-task-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg" data-task-id="${task.id}">
                            <i class="fas fa-trash mr-2"></i>Delete Task
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        $('#taskDetailContent').html(content);
        this.bindTaskDetailEvents();
    },
    
    // Bind task detail modal events
    bindTaskDetailEvents: function() {
        // Subtask toggle
        $('.subtask-toggle').on('change', (e) => {
            const subtaskId = $(e.target).data('subtask-id');
            const isDone = e.target.checked;
            
            API.subtasks.update(subtaskId, { is_done: isDone ? 1 : 0 })
                .then(() => {
                    const subtaskElement = $(e.target).parent();
                    const titleElement = subtaskElement.find('span');
                    
                    if (isDone) {
                        titleElement.addClass('line-through text-gray-500').removeClass('text-gray-900');
                    } else {
                        titleElement.addClass('text-gray-900').removeClass('line-through text-gray-500');
                    }
                    
                    UI.showToast('Subtask updated', 'success', 2000);
                })
                .catch(error => {
                    UI.showToast('Failed to update subtask: ' + error.message, 'error');
                    e.target.checked = !isDone; // Revert checkbox
                });
        });
        
        // Delete subtask
        $('.delete-subtask').on('click', (e) => {
            const subtaskId = $(e.target).data('subtask-id');
            
            if (confirm('Are you sure you want to delete this subtask?')) {
                API.subtasks.delete(subtaskId)
                    .then(() => {
                        $(e.target).closest('.flex').remove();
                        UI.showToast('Subtask deleted', 'success', 2000);
                    })
                    .catch(error => {
                        UI.showToast('Failed to delete subtask: ' + error.message, 'error');
                    });
            }
        });
        
        // Comment form
        $('#commentForm').on('submit', (e) => {
            e.preventDefault();
            
            const taskId = $('#commentTaskId').val();
            const author = $('#commentAuthor').val().trim();
            const content = $('#commentContent').val().trim();
            
            if (!author || !content) {
                UI.showToast('Please enter both name and comment', 'warning');
                return;
            }
            
            API.comments.create(taskId, { author, content })
                .then(response => {
                    const comment = response.data;
                    const commentHtml = `
                        <div class="bg-gray-50 rounded-lg p-3">
                            <div class="flex justify-between items-start mb-2">
                                <span class="font-medium text-gray-900">${comment.author}</span>
                                <span class="text-xs text-gray-500">${UI.formatDateTime(comment.created_at)}</span>
                            </div>
                            <p class="text-gray-700">${comment.content}</p>
                        </div>
                    `;
                    
                    if ($('#commentsList').find('.text-center').length) {
                        $('#commentsList').html(commentHtml);
                    } else {
                        $('#commentsList').prepend(commentHtml);
                    }
                    
                    $('#commentContent').val('');
                    UI.showToast('Comment added', 'success', 2000);
                })
                .catch(error => {
                    UI.showToast('Failed to add comment: ' + error.message, 'error');
                });
        });
        
        // Edit task button
        $('.edit-task-btn').on('click', (e) => {
            const taskId = $(e.target).data('task-id');
            this.hideTaskDetailModal();
            this.editTask(taskId);
        });
        
        // Delete task button
        $('.delete-task-btn').on('click', (e) => {
            const taskId = $(e.target).data('task-id');
            this.hideTaskDetailModal();
            this.deleteTask(taskId);
        });
    },
    
    // Hide task detail modal
    hideTaskDetailModal: function() {
        UI.hideModal('taskDetailModal');
    },
    
    // Edit existing task
    editTask: function(taskId) {
        API.tasks.get(taskId)
            .then(response => {
                this.showTaskModal(response.data);
            })
            .catch(error => {
                UI.showToast('Failed to load task for editing: ' + error.message, 'error');
            });
    },
    
    // Delete task
    deleteTask: function(taskId) {
        if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
            return;
        }
        
        API.tasks.delete(taskId)
            .then(() => {
                UI.showToast('Task deleted successfully', 'success');
                this.loadTasks();
            })
            .catch(error => {
                UI.showToast('Failed to delete task: ' + error.message, 'error');
            });
    },
    
    // Show category modal
    showCategoryModal: function() {
        $('#categoryForm')[0].reset();
        UI.showModal('categoryModal');
        $('#categoryName').focus();
    },
    
    // Hide category modal
    hideCategoryModal: function() {
        UI.hideModal('categoryModal');
    },
    
    // Handle category form submission
    handleCategorySubmit: function(e) {
        e.preventDefault();
        
        const isValid = UI.validateForm('#categoryForm', {
            categoryName: { required: true, minLength: 2, maxLength: 100 }
        });
        
        if (!isValid) {
            return;
        }
        
        const categoryData = {
            name: $('#categoryName').val().trim(),
            color: $('#categoryColor').val()
        };
        
        API.categories.create(categoryData)
            .then(() => {
                UI.showToast('Category created successfully', 'success');
                this.hideCategoryModal();
                this.loadCategories();
            })
            .catch(error => {
                UI.showToast('Failed to create category: ' + error.message, 'error');
            });
    },
    
    // Apply current filters
    applyFilters: function() {
        this.currentFilters = {
            search: $('#searchInput').val().trim(),
            category_id: $('#categoryFilter').val(),
            priority: $('#priorityFilter').val(),
            assigned_to: $('#assignedFilter').val().trim(),
            sort: $('#sortFilter').val()
        };
        
        this.loadTasks();
    },
    
    // Export tasks to CSV
    exportTasks: function() {
        try {
            API.tasks.export();
            UI.showToast('Export started', 'info', 2000);
        } catch (error) {
            UI.showToast('Failed to export tasks: ' + error.message, 'error');
        }
    },
    
    // Toggle bulk selection mode
    toggleBulkMode: function() {
        this.bulkMode = !this.bulkMode;
        this.selectedTasks.clear();
        
        if (this.bulkMode) {
            $('#bulkModeBtn').html('<i class="fas fa-times mr-2"></i>Exit Bulk Mode').addClass('text-red-600');
            $('#bulkActions').removeClass('hidden');
            $('.task-card').addClass('pl-12');
        } else {
            $('#bulkModeBtn').html('<i class="fas fa-check-square mr-2"></i>Bulk Select').removeClass('text-red-600');
            $('#bulkActions').addClass('hidden');
            $('.task-card').removeClass('pl-12');
        }
        
        this.loadTasks();
    },
    
    // Update bulk actions display
    updateBulkActions: function() {
        $('#selectedCount').text(this.selectedTasks.size);
        
        if (this.selectedTasks.size > 0) {
            $('#bulkDeleteBtn, #bulkCompleteBtn').prop('disabled', false);
        } else {
            $('#bulkDeleteBtn, #bulkCompleteBtn').prop('disabled', true);
        }
    },
    
    // Bulk delete selected tasks
    bulkDeleteTasks: function() {
        if (this.selectedTasks.size === 0) return;
        
        const count = this.selectedTasks.size;
        if (!confirm(`Are you sure you want to delete ${count} selected task${count > 1 ? 's' : ''}?`)) {
            return;
        }
        
        const deletePromises = Array.from(this.selectedTasks).map(taskId => 
            API.tasks.delete(taskId)
        );
        
        Promise.allSettled(deletePromises)
            .then(results => {
                const successful = results.filter(r => r.status === 'fulfilled').length;
                const failed = results.filter(r => r.status === 'rejected').length;
                
                if (successful > 0) {
                    UI.showToast(`${successful} task${successful > 1 ? 's' : ''} deleted successfully`, 'success');
                }
                
                if (failed > 0) {
                    UI.showToast(`Failed to delete ${failed} task${failed > 1 ? 's' : ''}`, 'error');
                }
                
                this.selectedTasks.clear();
                this.loadTasks();
                this.updateBulkActions();
            });
    },
    
    // Bulk complete selected tasks
    bulkCompleteTasks: function() {
        if (this.selectedTasks.size === 0) return;
        
        const movePromises = Array.from(this.selectedTasks).map(taskId => 
            API.tasks.move(taskId, 'done')
        );
        
        Promise.allSettled(movePromises)
            .then(results => {
                const successful = results.filter(r => r.status === 'fulfilled').length;
                const failed = results.filter(r => r.status === 'rejected').length;
                
                if (successful > 0) {
                    UI.showToast(`${successful} task${successful > 1 ? 's' : ''} marked as complete`, 'success');
                }
                
                if (failed > 0) {
                    UI.showToast(`Failed to complete ${failed} task${failed > 1 ? 's' : ''}`, 'error');
                }
                
                this.selectedTasks.clear();
                this.loadTasks();
                this.updateBulkActions();
            });
    },
    
    // Helper methods
    getStatusLabel: function(status) {
        const labels = {
            'todo': 'To Do',
            'in_progress': 'In Progress',
            'done': 'Done'
        };
        return labels[status] || status;
    },
    
    getStatusColor: function(status) {
        const colors = {
            'todo': 'text-gray-600 bg-gray-100',
            'in_progress': 'text-blue-600 bg-blue-100',
            'done': 'text-green-600 bg-green-100'
        };
        return colors[status] || 'text-gray-600 bg-gray-100';
    }
};

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize the application when DOM is ready
$(document).ready(function() {
    TaskManager.init();
});