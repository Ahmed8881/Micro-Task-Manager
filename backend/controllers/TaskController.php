<?php
/**
 * Task Controller
 * Handles task-related operations
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Utils.php';

class TaskController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Get tasks with filters and pagination
     */
    public function getTasks() {
        try {
            // Build base query
            $query = "SELECT t.*, c.name as category_name, c.color as category_color FROM tasks t 
                     LEFT JOIN categories c ON t.category_id = c.id";
            $where_conditions = [];
            $params = [];
            
            // Apply filters
            if (isset($_GET['status']) && $_GET['status'] !== '') {
                $where_conditions[] = "t.status = ?";
                $params[] = $_GET['status'];
            }
            
            if (isset($_GET['category_id']) && $_GET['category_id'] !== '') {
                $where_conditions[] = "t.category_id = ?";
                $params[] = intval($_GET['category_id']);
            }
            
            if (isset($_GET['priority']) && $_GET['priority'] !== '') {
                $where_conditions[] = "t.priority = ?";
                $params[] = $_GET['priority'];
            }
            
            if (isset($_GET['assigned_to']) && $_GET['assigned_to'] !== '') {
                $where_conditions[] = "t.assigned_to LIKE ?";
                $params[] = '%' . $_GET['assigned_to'] . '%';
            }
            
            if (isset($_GET['search']) && $_GET['search'] !== '') {
                $where_conditions[] = "(t.title LIKE ? OR t.description LIKE ?)";
                $search_term = '%' . $_GET['search'] . '%';
                $params[] = $search_term;
                $params[] = $search_term;
            }
            
            // Add WHERE clause if conditions exist
            if (!empty($where_conditions)) {
                $query .= " WHERE " . implode(" AND ", $where_conditions);
            }
            
            // Count total records for pagination
            $count_query = "SELECT COUNT(*) as total FROM tasks t" . 
                          (!empty($where_conditions) ? " WHERE " . implode(" AND ", $where_conditions) : "");
            $count_stmt = $this->db->prepare($count_query);
            $count_stmt->execute($params);
            $total = $count_stmt->fetch()['total'];
            
            // Apply sorting
            $sort = $_GET['sort'] ?? 'created_at';
            $allowed_sorts = ['due_date', 'priority', 'created_at', 'title'];
            if (!in_array($sort, $allowed_sorts)) {
                $sort = 'created_at';
            }
            
            // Priority sorting needs special handling
            if ($sort === 'priority') {
                $query .= " ORDER BY CASE t.priority 
                           WHEN 'High' THEN 1 
                           WHEN 'Medium' THEN 2 
                           WHEN 'Low' THEN 3 
                           END ASC";
            } else {
                $query .= " ORDER BY t.$sort ASC";
            }
            
            // Apply pagination
            $pagination = Utils::getPaginationParams(
                $_GET['page'] ?? 1,
                $_GET['per_page'] ?? 20
            );
            
            $query .= " LIMIT {$pagination['per_page']} OFFSET {$pagination['offset']}";
            
            // Execute query
            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            $tasks = $stmt->fetchAll();
            
            // Get subtasks count for each task
            foreach ($tasks as &$task) {
                $subtask_stmt = $this->db->prepare(
                    "SELECT COUNT(*) as total, SUM(is_done) as completed FROM subtasks WHERE task_id = ?"
                );
                $subtask_stmt->execute([$task['id']]);
                $subtask_data = $subtask_stmt->fetch();
                
                $task['subtasks_total'] = intval($subtask_data['total']);
                $task['subtasks_completed'] = intval($subtask_data['completed'] ?? 0);
            }
            
            $response_data = [
                'tasks' => $tasks,
                'pagination' => [
                    'total' => intval($total),
                    'page' => $pagination['page'],
                    'per_page' => $pagination['per_page'],
                    'total_pages' => ceil($total / $pagination['per_page'])
                ]
            ];
            
            Response::success($response_data, 'Tasks retrieved successfully');
            
        } catch (Exception $e) {
            error_log("Get tasks error: " . $e->getMessage());
            Response::serverError('Failed to retrieve tasks');
        }
    }
    
    /**
     * Get single task with subtasks and comments
     */
    public function getTask($id) {
        $id = intval($id);
        
        if ($id <= 0) {
            Response::badRequest('Invalid task ID');
        }
        
        try {
            // Get task
            $stmt = $this->db->prepare(
                "SELECT t.*, c.name as category_name, c.color as category_color 
                 FROM tasks t LEFT JOIN categories c ON t.category_id = c.id 
                 WHERE t.id = ?"
            );
            $stmt->execute([$id]);
            $task = $stmt->fetch();
            
            if (!$task) {
                Response::notFound('Task not found');
            }
            
            // Get subtasks
            $stmt = $this->db->prepare(
                "SELECT id, title, is_done, created_at FROM subtasks WHERE task_id = ? ORDER BY created_at ASC"
            );
            $stmt->execute([$id]);
            $task['subtasks'] = $stmt->fetchAll();
            
            // Get comments
            $stmt = $this->db->prepare(
                "SELECT id, author, content, created_at FROM comments WHERE task_id = ? ORDER BY created_at DESC"
            );
            $stmt->execute([$id]);
            $task['comments'] = $stmt->fetchAll();
            
            Response::success($task, 'Task retrieved successfully');
            
        } catch (Exception $e) {
            error_log("Get task error: " . $e->getMessage());
            Response::serverError('Failed to retrieve task');
        }
    }
    
    /**
     * Create new task
     */
    public function createTask() {
        $input = Utils::getJsonInput();
        
        if (!$input) {
            Response::badRequest('Invalid JSON input');
        }
        
        $required = ['title'];
        $validation = Utils::validateRequired($input, $required);
        
        if ($validation !== true) {
            Response::badRequest('Missing required fields: ' . implode(', ', $validation));
        }
        
        // Sanitize and validate inputs
        $title = Utils::sanitizeString($input['title']);
        $description = isset($input['description']) ? Utils::sanitizeString($input['description']) : '';
        $priority = isset($input['priority']) ? $input['priority'] : 'Medium';
        $status = isset($input['status']) ? $input['status'] : 'todo';
        $category_id = isset($input['category_id']) ? intval($input['category_id']) : null;
        $assigned_to = isset($input['assigned_to']) ? Utils::sanitizeString($input['assigned_to']) : null;
        $due_date = null;
        
        // Validate priority
        if (!in_array($priority, ['Low', 'Medium', 'High'])) {
            $priority = 'Medium';
        }
        
        // Validate status
        if (!in_array($status, ['todo', 'in_progress', 'done'])) {
            $status = 'todo';
        }
        
        // Validate due date
        if (isset($input['due_date']) && $input['due_date'] !== '') {
            if (Utils::validateDate($input['due_date'])) {
                $due_date = $input['due_date'];
            } else {
                Response::badRequest('Invalid due date format. Use YYYY-MM-DD');
            }
        }
        
        try {
            $this->db->beginTransaction();
            
            // Create task
            $stmt = $this->db->prepare(
                "INSERT INTO tasks (title, description, priority, due_date, status, category_id, assigned_to) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([$title, $description, $priority, $due_date, $status, $category_id, $assigned_to]);
            
            $task_id = $this->db->lastInsertId();
            
            // Create subtasks if provided
            if (isset($input['subtasks']) && is_array($input['subtasks'])) {
                foreach ($input['subtasks'] as $subtask) {
                    if (isset($subtask['title']) && trim($subtask['title']) !== '') {
                        $subtask_title = Utils::sanitizeString($subtask['title']);
                        $stmt = $this->db->prepare(
                            "INSERT INTO subtasks (task_id, title) VALUES (?, ?)"
                        );
                        $stmt->execute([$task_id, $subtask_title]);
                    }
                }
            }
            
            // Log activity
            Utils::logActivity($this->db, $task_id, 'created', 'Task created: ' . $title);
            
            $this->db->commit();
            
            // Get the created task with full details
            $this->getTask($task_id);
            
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Create task error: " . $e->getMessage());
            Response::serverError('Failed to create task');
        }
    }
    
    /**
     * Update task
     */
    public function updateTask($id) {
        $id = intval($id);
        
        if ($id <= 0) {
            Response::badRequest('Invalid task ID');
        }
        
        $input = Utils::getJsonInput();
        
        if (!$input) {
            Response::badRequest('Invalid JSON input');
        }
        
        try {
            // Check if task exists
            $stmt = $this->db->prepare("SELECT * FROM tasks WHERE id = ?");
            $stmt->execute([$id]);
            $existing_task = $stmt->fetch();
            
            if (!$existing_task) {
                Response::notFound('Task not found');
            }
            
            $this->db->beginTransaction();
            
            // Build update query dynamically
            $update_fields = [];
            $params = [];
            $changes = [];
            
            if (isset($input['title'])) {
                $title = Utils::sanitizeString($input['title']);
                if ($title !== $existing_task['title']) {
                    $update_fields[] = "title = ?";
                    $params[] = $title;
                    $changes[] = "Title changed to: $title";
                }
            }
            
            if (isset($input['description'])) {
                $description = Utils::sanitizeString($input['description']);
                if ($description !== $existing_task['description']) {
                    $update_fields[] = "description = ?";
                    $params[] = $description;
                    $changes[] = "Description updated";
                }
            }
            
            if (isset($input['priority'])) {
                if (in_array($input['priority'], ['Low', 'Medium', 'High'])) {
                    if ($input['priority'] !== $existing_task['priority']) {
                        $update_fields[] = "priority = ?";
                        $params[] = $input['priority'];
                        $changes[] = "Priority changed to: " . $input['priority'];
                    }
                }
            }
            
            if (isset($input['status'])) {
                if (in_array($input['status'], ['todo', 'in_progress', 'done'])) {
                    if ($input['status'] !== $existing_task['status']) {
                        $update_fields[] = "status = ?";
                        $params[] = $input['status'];
                        $changes[] = "Status changed to: " . $input['status'];
                    }
                }
            }
            
            if (isset($input['category_id'])) {
                $category_id = $input['category_id'] ? intval($input['category_id']) : null;
                if ($category_id !== $existing_task['category_id']) {
                    $update_fields[] = "category_id = ?";
                    $params[] = $category_id;
                    $changes[] = $category_id ? "Category changed" : "Category removed";
                }
            }
            
            if (isset($input['assigned_to'])) {
                $assigned_to = $input['assigned_to'] ? Utils::sanitizeString($input['assigned_to']) : null;
                if ($assigned_to !== $existing_task['assigned_to']) {
                    $update_fields[] = "assigned_to = ?";
                    $params[] = $assigned_to;
                    $changes[] = $assigned_to ? "Assigned to: $assigned_to" : "Assignment removed";
                }
            }
            
            if (isset($input['due_date'])) {
                $due_date = null;
                if ($input['due_date'] !== '' && Utils::validateDate($input['due_date'])) {
                    $due_date = $input['due_date'];
                }
                if ($due_date !== $existing_task['due_date']) {
                    $update_fields[] = "due_date = ?";
                    $params[] = $due_date;
                    $changes[] = $due_date ? "Due date set to: $due_date" : "Due date removed";
                }
            }
            
            // Update task if there are changes
            if (!empty($update_fields)) {
                $params[] = $id;
                $query = "UPDATE tasks SET " . implode(", ", $update_fields) . " WHERE id = ?";
                $stmt = $this->db->prepare($query);
                $stmt->execute($params);
            }
            
            // Handle subtasks updates
            if (isset($input['subtasks']) && is_array($input['subtasks'])) {
                // Delete existing subtasks and recreate them
                $stmt = $this->db->prepare("DELETE FROM subtasks WHERE task_id = ?");
                $stmt->execute([$id]);
                
                foreach ($input['subtasks'] as $subtask) {
                    if (isset($subtask['title']) && trim($subtask['title']) !== '') {
                        $subtask_title = Utils::sanitizeString($subtask['title']);
                        $is_done = isset($subtask['is_done']) ? intval($subtask['is_done']) : 0;
                        
                        $stmt = $this->db->prepare(
                            "INSERT INTO subtasks (task_id, title, is_done) VALUES (?, ?, ?)"
                        );
                        $stmt->execute([$id, $subtask_title, $is_done]);
                    }
                }
                $changes[] = "Subtasks updated";
            }
            
            // Log activity if there were changes
            if (!empty($changes)) {
                Utils::logActivity($this->db, $id, 'updated', implode('; ', $changes));
            }
            
            $this->db->commit();
            
            // Return updated task
            $this->getTask($id);
            
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Update task error: " . $e->getMessage());
            Response::serverError('Failed to update task');
        }
    }
    
    /**
     * Delete task
     */
    public function deleteTask($id) {
        $id = intval($id);
        
        if ($id <= 0) {
            Response::badRequest('Invalid task ID');
        }
        
        try {
            // Check if task exists
            $stmt = $this->db->prepare("SELECT title FROM tasks WHERE id = ?");
            $stmt->execute([$id]);
            $task = $stmt->fetch();
            
            if (!$task) {
                Response::notFound('Task not found');
            }
            
            // Log activity before deletion
            Utils::logActivity($this->db, $id, 'deleted', 'Task deleted: ' . $task['title']);
            
            // Delete task (cascade will handle subtasks and comments)
            $stmt = $this->db->prepare("DELETE FROM tasks WHERE id = ?");
            $stmt->execute([$id]);
            
            Response::success(null, 'Task deleted successfully');
            
        } catch (Exception $e) {
            error_log("Delete task error: " . $e->getMessage());
            Response::serverError('Failed to delete task');
        }
    }
    
    /**
     * Move task (change status)
     */
    public function moveTask($id) {
        $id = intval($id);
        
        if ($id <= 0) {
            Response::badRequest('Invalid task ID');
        }
        
        $input = Utils::getJsonInput();
        
        if (!$input || !isset($input['status'])) {
            Response::badRequest('Status is required');
        }
        
        $status = $input['status'];
        if (!in_array($status, ['todo', 'in_progress', 'done'])) {
            Response::badRequest('Invalid status');
        }
        
        try {
            // Check if task exists and get current status
            $stmt = $this->db->prepare("SELECT title, status FROM tasks WHERE id = ?");
            $stmt->execute([$id]);
            $task = $stmt->fetch();
            
            if (!$task) {
                Response::notFound('Task not found');
            }
            
            // Update status
            $stmt = $this->db->prepare("UPDATE tasks SET status = ? WHERE id = ?");
            $stmt->execute([$status, $id]);
            
            // Log activity
            $status_names = [
                'todo' => 'To Do',
                'in_progress' => 'In Progress',
                'done' => 'Done'
            ];
            
            Utils::logActivity(
                $this->db, 
                $id, 
                'moved', 
                "Task moved from {$status_names[$task['status']]} to {$status_names[$status]}"
            );
            
            Response::success(['id' => $id, 'status' => $status], 'Task moved successfully');
            
        } catch (Exception $e) {
            error_log("Move task error: " . $e->getMessage());
            Response::serverError('Failed to move task');
        }
    }
    
    /**
     * Export tasks to CSV
     */
    public function exportTasks() {
        try {
            $stmt = $this->db->prepare(
                "SELECT t.id, t.title, t.description, t.priority, t.due_date, t.status, 
                        t.assigned_to, c.name as category, t.created_at, t.updated_at
                 FROM tasks t 
                 LEFT JOIN categories c ON t.category_id = c.id
                 ORDER BY t.created_at DESC"
            );
            $stmt->execute();
            $tasks = $stmt->fetchAll();
            
            if (empty($tasks)) {
                Response::success(['content' => ''], 'No tasks to export');
            }
            
            $headers = [
                'ID', 'Title', 'Description', 'Priority', 'Due Date', 'Status', 
                'Assigned To', 'Category', 'Created At', 'Updated At'
            ];
            
            $csv_content = Utils::arrayToCsv($tasks, $headers);
            
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="tasks_' . date('Y-m-d') . '.csv"');
            echo $csv_content;
            
        } catch (Exception $e) {
            error_log("Export tasks error: " . $e->getMessage());
            Response::serverError('Failed to export tasks');
        }
    }
    
    /**
     * Get task activity log
     */
    public function getTaskActivity($id) {
        $id = intval($id);
        
        if ($id <= 0) {
            Response::badRequest('Invalid task ID');
        }
        
        try {
            $stmt = $this->db->prepare(
                "SELECT action, details, user_name, created_at 
                 FROM activity_log 
                 WHERE task_id = ? 
                 ORDER BY created_at DESC"
            );
            $stmt->execute([$id]);
            $activities = $stmt->fetchAll();
            
            Response::success($activities, 'Task activity retrieved successfully');
            
        } catch (Exception $e) {
            error_log("Get task activity error: " . $e->getMessage());
            Response::serverError('Failed to retrieve task activity');
        }
    }
}
?>