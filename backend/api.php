<?php
/**
 * API Router - Main entry point for all API requests
 * Micro Task Manager
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include required files
require_once __DIR__ . '/helpers/Response.php';
require_once __DIR__ . '/controllers/TaskController.php';
require_once __DIR__ . '/controllers/CategoryController.php';
require_once __DIR__ . '/controllers/SubtaskController.php';
require_once __DIR__ . '/controllers/CommentController.php';

// Parse the request
$request_method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

// Remove query string and clean up the path
$path = parse_url($request_uri, PHP_URL_PATH);

// Remove base path if running in subdirectory
$script_name = $_SERVER['SCRIPT_NAME']; // e.g., /micro-task-manager/backend/api.php
$base_dir = dirname($script_name); // e.g., /micro-task-manager/backend

// Remove the base directory from the path
if (strpos($path, $base_dir) === 0) {
    $path = substr($path, strlen($base_dir));
}

// Remove script name if present
if (strpos($path, '/api.php') === 0) {
    $path = substr($path, strlen('/api.php'));
}

// Remove leading and trailing slashes
$path = trim($path, '/');

// Split path into segments
$path_segments = explode('/', $path);

// Route the request
try {
    switch ($path_segments[0]) {
        case 'categories':
            $controller = new CategoryController();
            
            switch ($request_method) {
                case 'GET':
                    $controller->getCategories();
                    break;
                    
                case 'POST':
                    $controller->createCategory();
                    break;
                    
                case 'DELETE':
                    if (!isset($path_segments[1])) {
                        Response::badRequest('Category ID is required');
                    }
                    $controller->deleteCategory($path_segments[1]);
                    break;
                    
                default:
                    Response::error('Method not allowed', 405);
            }
            break;
            
        case 'tasks':
            $controller = new TaskController();
            
            switch ($request_method) {
                case 'GET':
                    if (isset($path_segments[1])) {
                        if ($path_segments[1] === 'export') {
                            $controller->exportTasks();
                        } elseif (isset($path_segments[2]) && $path_segments[2] === 'activity') {
                            $controller->getTaskActivity($path_segments[1]);
                        } elseif (isset($path_segments[2]) && $path_segments[2] === 'comments') {
                            $comment_controller = new CommentController();
                            $comment_controller->getComments($path_segments[1]);
                        } else {
                            $controller->getTask($path_segments[1]);
                        }
                    } else {
                        $controller->getTasks();
                    }
                    break;
                    
                case 'POST':
                    if (isset($path_segments[1])) {
                        if (isset($path_segments[2])) {
                            switch ($path_segments[2]) {
                                case 'move':
                                    $controller->moveTask($path_segments[1]);
                                    break;
                                case 'comments':
                                    $comment_controller = new CommentController();
                                    $comment_controller->createComment($path_segments[1]);
                                    break;
                                default:
                                    Response::notFound('Endpoint not found');
                            }
                        } else {
                            Response::notFound('Endpoint not found');
                        }
                    } else {
                        $controller->createTask();
                    }
                    break;
                    
                case 'PUT':
                    if (!isset($path_segments[1])) {
                        Response::badRequest('Task ID is required');
                    }
                    $controller->updateTask($path_segments[1]);
                    break;
                    
                case 'DELETE':
                    if (!isset($path_segments[1])) {
                        Response::badRequest('Task ID is required');
                    }
                    $controller->deleteTask($path_segments[1]);
                    break;
                    
                default:
                    Response::error('Method not allowed', 405);
            }
            break;
            
        case 'subtasks':
            $controller = new SubtaskController();
            
            switch ($request_method) {
                case 'PUT':
                    if (!isset($path_segments[1])) {
                        Response::badRequest('Subtask ID is required');
                    }
                    $controller->updateSubtask($path_segments[1]);
                    break;
                    
                case 'DELETE':
                    if (!isset($path_segments[1])) {
                        Response::badRequest('Subtask ID is required');
                    }
                    $controller->deleteSubtask($path_segments[1]);
                    break;
                    
                default:
                    Response::error('Method not allowed', 405);
            }
            break;
            
        case 'stream':
            if ($path_segments[1] === 'updates') {
                // Simple Server-Sent Events endpoint
                header('Content-Type: text/event-stream');
                header('Cache-Control: no-cache');
                header('Connection: keep-alive');
                
                // Send initial connection message
                echo "data: " . json_encode(['type' => 'connected', 'timestamp' => time()]) . "\n\n";
                
                // In a real implementation, you would monitor for changes and send updates
                // For now, just send a heartbeat every 30 seconds
                while (true) {
                    echo "data: " . json_encode(['type' => 'heartbeat', 'timestamp' => time()]) . "\n\n";
                    ob_flush();
                    flush();
                    sleep(30);
                }
            }
            break;
            
        default:
            Response::notFound('Endpoint not found');
    }
    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    Response::serverError('An unexpected error occurred');
}
?>