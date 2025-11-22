<?php
/**
 * Database Configuration
 * Micro Task Manager
 */

class Database {
    private $host = 'localhost';
    private $db_name = 'task_manager';
    private $username = 'root';
    private $password = '';
    private $charset = 'utf8mb4';
    private $connection;

    public function getConnection() {
        $this->connection = null;
        
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->connection = new PDO($dsn, $this->username, $this->password, $options);
        } catch(PDOException $e) {
            error_log("Connection Error: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
        
        return $this->connection;
    }
}
?>