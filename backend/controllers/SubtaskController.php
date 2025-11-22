<?php
/**
 * Subtask Controller
 * Handles subtask-related operations
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Utils.php';

class SubtaskController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Update subtask (toggle completion or update title)
     */
    public function updateSubtask($id) {
        $id = intval($id);
        
        if ($id <= 0) {
            Response::badRequest('Invalid subtask ID');
        }
        
        $input = Utils::getJsonInput();
        
        if (!$input) {
            Response::badRequest('Invalid JSON input');
        }
        
        try {
            // Check if subtask exists
            $stmt = $this->db->prepare("SELECT * FROM subtasks WHERE id = ?");
            $stmt->execute([$id]);
            $subtask = $stmt->fetch();
            
            if (!$subtask) {
                Response::notFound('Subtask not found');
            }
            
            $update_fields = [];
            $params = [];
            $changes = [];
            
            // Update title if provided
            if (isset($input['title'])) {
                $title = Utils::sanitizeString($input['title']);
                if ($title !== $subtask['title']) {
                    $update_fields[] = "title = ?";
                    $params[] = $title;
                    $changes[] = "Title updated";
                }
            }
            
            // Update completion status if provided
            if (isset($input['is_done'])) {
                $is_done = intval($input['is_done']);
                if ($is_done !== intval($subtask['is_done'])) {
                    $update_fields[] = "is_done = ?";
                    $params[] = $is_done;
                    $changes[] = $is_done ? "Marked as completed" : "Marked as incomplete";
                }
            }
            
            // Update subtask if there are changes
            if (!empty($update_fields)) {
                $params[] = $id;
                $query = "UPDATE subtasks SET " . implode(", ", $update_fields) . " WHERE id = ?";
                $stmt = $this->db->prepare($query);
                $stmt->execute($params);
                
                // Log activity
                Utils::logActivity(
                    $this->db, 
                    $subtask['task_id'], 
                    'subtask_updated', 
                    "Subtask '{$subtask['title']}': " . implode('; ', $changes)
                );
            }
            
            // Get updated subtask
            $stmt = $this->db->prepare("SELECT * FROM subtasks WHERE id = ?");
            $stmt->execute([$id]);
            $updated_subtask = $stmt->fetch();
            
            Response::success($updated_subtask, 'Subtask updated successfully');
            
        } catch (Exception $e) {
            error_log("Update subtask error: " . $e->getMessage());
            Response::serverError('Failed to update subtask');
        }
    }
    
    /**
     * Delete subtask
     */
    public function deleteSubtask($id) {
        $id = intval($id);
        
        if ($id <= 0) {
            Response::badRequest('Invalid subtask ID');
        }
        
        try {
            // Get subtask info before deletion
            $stmt = $this->db->prepare("SELECT task_id, title FROM subtasks WHERE id = ?");
            $stmt->execute([$id]);
            $subtask = $stmt->fetch();
            
            if (!$subtask) {
                Response::notFound('Subtask not found');
            }
            
            // Delete subtask
            $stmt = $this->db->prepare("DELETE FROM subtasks WHERE id = ?");
            $stmt->execute([$id]);
            
            // Log activity
            Utils::logActivity(
                $this->db, 
                $subtask['task_id'], 
                'subtask_deleted', 
                "Subtask deleted: " . $subtask['title']
            );
            
            Response::success(null, 'Subtask deleted successfully');
            
        } catch (Exception $e) {
            error_log("Delete subtask error: " . $e->getMessage());
            Response::serverError('Failed to delete subtask');
        }
    }
}
?>