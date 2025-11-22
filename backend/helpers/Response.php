<?php
/**
 * Response Helper Class
 * Standardizes API responses
 */

class Response {
    
    public static function json($data = null, $status = 'success', $message = '', $code = 200) {
        http_response_code($code);
        header('Content-Type: application/json');
        
        $response = [
            'status' => $status,
            'message' => $message,
            'code' => $code
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        echo json_encode($response, JSON_PRETTY_PRINT);
        exit;
    }
    
    public static function success($data = null, $message = 'Success', $code = 200) {
        self::json($data, 'success', $message, $code);
    }
    
    public static function error($message = 'Error', $code = 400, $data = null) {
        self::json($data, 'error', $message, $code);
    }
    
    public static function notFound($message = 'Resource not found') {
        self::error($message, 404);
    }
    
    public static function badRequest($message = 'Bad request') {
        self::error($message, 400);
    }
    
    public static function serverError($message = 'Internal server error') {
        self::error($message, 500);
    }
}
?>