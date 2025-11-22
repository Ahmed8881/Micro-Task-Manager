<?php
/**
 * Comment Controller
 * Handles comment-related operations
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Utils.php';

class CommentController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Get comments for a task
     */
    public function getComments($task_id) {
        $task_id = intval($task_id);
        
        if ($task_id <= 0) {
            Response::badRequest('Invalid task ID');
        }
        
        try {
            // Check if task exists
            $stmt = $this->db->prepare("SELECT id FROM tasks WHERE id = ?");
            $stmt->execute([$task_id]);
            
            if (!$stmt->fetch()) {
                Response::notFound('Task not found');
            }
            
            // Get comments
            $stmt = $this->db->prepare(
                "SELECT id, author, content, created_at 
                 FROM comments 
                 WHERE task_id = ? 
                 ORDER BY created_at DESC"
            );
            $stmt->execute([$task_id]);
            $comments = $stmt->fetchAll();
            
            Response::success($comments, 'Comments retrieved successfully');
            
        } catch (Exception $e) {
            error_log("Get comments error: " . $e->getMessage());
            Response::serverError('Failed to retrieve comments');
        }
    }
    
    /**
     * Create comment for a task
     */
    public function createComment($task_id) {
        $task_id = intval($task_id);
        
        if ($task_id <= 0) {
            Response::badRequest('Invalid task ID');
        }
        
        $input = Utils::getJsonInput();
        
        if (!$input) {
            Response::badRequest('Invalid JSON input');
        }
        
        $required = ['content'];
        $validation = Utils::validateRequired($input, $required);
        
        if ($validation !== true) {
            Response::badRequest('Missing required fields: ' . implode(', ', $validation));
        }
        
        try {
            // Check if task exists
            $stmt = $this->db->prepare("SELECT title FROM tasks WHERE id = ?");
            $stmt->execute([$task_id]);
            $task = $stmt->fetch();
            
            if (!$task) {
                Response::notFound('Task not found');
            }
            
            $content = Utils::sanitizeString($input['content']);
            $author = isset($input['author']) ? Utils::sanitizeString($input['author']) : 'Anonymous';
            
            // Create comment
            $stmt = $this->db->prepare(
                "INSERT INTO comments (task_id, author, content) VALUES (?, ?, ?)"
            );
            $stmt->execute([$task_id, $author, $content]);
            
            $comment_id = $this->db->lastInsertId();
            
            // Get the created comment
            $stmt = $this->db->prepare(
                "SELECT id, author, content, created_at FROM comments WHERE id = ?"
            );
            $stmt->execute([$comment_id]);
            $comment = $stmt->fetch();
            
            // Log activity
            Utils::logActivity(
                $this->db, 
                $task_id, 
                'comment_added', 
                "Comment added by $author"
            );
            
            Response::success($comment, 'Comment created successfully', 201);
            
        } catch (Exception $e) {
            error_log("Create comment error: " . $e->getMessage());
            Response::serverError('Failed to create comment');
        }
    }
}
?>