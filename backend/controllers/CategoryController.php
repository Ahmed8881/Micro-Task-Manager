<?php
/**
 * Category Controller
 * Handles category-related operations
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Utils.php';

class CategoryController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    /**
     * Get all categories
     */
    public function getCategories() {
        try {
            $stmt = $this->db->prepare(
                "SELECT id, name, color, created_at FROM categories ORDER BY name ASC"
            );
            $stmt->execute();
            $categories = $stmt->fetchAll();
            
            Response::success($categories, 'Categories retrieved successfully');
        } catch (Exception $e) {
            error_log("Get categories error: " . $e->getMessage());
            Response::serverError('Failed to retrieve categories');
        }
    }
    
    /**
     * Create new category
     */
    public function createCategory() {
        $input = Utils::getJsonInput();
        
        if (!$input) {
            Response::badRequest('Invalid JSON input');
        }
        
        $required = ['name'];
        $validation = Utils::validateRequired($input, $required);
        
        if ($validation !== true) {
            Response::badRequest('Missing required fields: ' . implode(', ', $validation));
        }
        
        $name = Utils::sanitizeString($input['name']);
        $color = isset($input['color']) ? Utils::sanitizeString($input['color']) : '#3B82F6';
        
        // Validate color format (simple hex validation)
        if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
            $color = '#3B82F6';
        }
        
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO categories (name, color) VALUES (?, ?)"
            );
            $stmt->execute([$name, $color]);
            
            $category_id = $this->db->lastInsertId();
            
            // Get the created category
            $stmt = $this->db->prepare(
                "SELECT id, name, color, created_at FROM categories WHERE id = ?"
            );
            $stmt->execute([$category_id]);
            $category = $stmt->fetch();
            
            Response::success($category, 'Category created successfully', 201);
            
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) { // Duplicate entry
                Response::badRequest('Category name already exists');
            }
            error_log("Create category error: " . $e->getMessage());
            Response::serverError('Failed to create category');
        }
    }
    
    /**
     * Delete category
     */
    public function deleteCategory($id) {
        $id = intval($id);
        
        if ($id <= 0) {
            Response::badRequest('Invalid category ID');
        }
        
        try {
            // Check if category exists
            $stmt = $this->db->prepare("SELECT id FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            
            if (!$stmt->fetch()) {
                Response::notFound('Category not found');
            }
            
            // Delete category (tasks will have category_id set to NULL due to foreign key constraint)
            $stmt = $this->db->prepare("DELETE FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            
            Response::success(null, 'Category deleted successfully');
            
        } catch (Exception $e) {
            error_log("Delete category error: " . $e->getMessage());
            Response::serverError('Failed to delete category');
        }
    }
}
?>