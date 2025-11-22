<?php
/**
 * Utility Helper Functions
 */

class Utils {
    
    /**
     * Validate required fields in request data
     */
    public static function validateRequired($data, $required_fields) {
        $missing = [];
        
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || trim($data[$field]) === '') {
                $missing[] = $field;
            }
        }
        
        return empty($missing) ? true : $missing;
    }
    
    /**
     * Sanitize string input
     */
    public static function sanitizeString($input) {
        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Validate email format
     */
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Validate date format (YYYY-MM-DD)
     */
    public static function validateDate($date) {
        $d = DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }
    
    /**
     * Get JSON input from request body
     */
    public static function getJsonInput() {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return false;
        }
        
        return $data;
    }
    
    /**
     * Parse pagination parameters
     */
    public static function getPaginationParams($page = 1, $per_page = 10) {
        $page = max(1, intval($page));
        $per_page = max(1, min(100, intval($per_page))); // Max 100 items per page
        $offset = ($page - 1) * $per_page;
        
        return [
            'page' => $page,
            'per_page' => $per_page,
            'offset' => $offset
        ];
    }
    
    /**
     * Log activity
     */
    public static function logActivity($pdo, $task_id, $action, $details, $user_name = 'System') {
        try {
            $stmt = $pdo->prepare(
                "INSERT INTO activity_log (task_id, action, details, user_name) VALUES (?, ?, ?, ?)"
            );
            $stmt->execute([$task_id, $action, $details, $user_name]);
        } catch (Exception $e) {
            error_log("Failed to log activity: " . $e->getMessage());
        }
    }
    
    /**
     * Generate CSV content from array
     */
    public static function arrayToCsv($data, $headers = null) {
        if (empty($data)) {
            return '';
        }
        
        $output = fopen('php://temp', 'r+');
        
        // Add headers
        if ($headers) {
            fputcsv($output, $headers);
        } else {
            fputcsv($output, array_keys($data[0]));
        }
        
        // Add data rows
        foreach ($data as $row) {
            fputcsv($output, $row);
        }
        
        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);
        
        return $csv;
    }
}
?>