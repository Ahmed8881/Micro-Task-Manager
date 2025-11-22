# Micro Task Manager

A professional Kanban-style task management web application built with PHP, MySQL, Tailwind CSS, and jQuery. Features a modern UI design, drag-and-drop functionality, real-time updates, and comprehensive REST API.

![Micro Task Manager](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![PHP](https://img.shields.io/badge/PHP-8.0+-green.svg)
![MySQL](https://img.shields.io/badge/MySQL-5.7+-orange.svg)
![License](https://img.shields.io/badge/License-MIT-red.svg)

## 🚀 Features

### Core Functionality
- **Kanban Board**: Drag-and-drop tasks between To Do, In Progress, and Done columns
- **Task Management**: Create, edit, delete, and view detailed task information
- **Subtasks**: Add and manage subtasks with completion tracking
- **Comments**: Add comments to tasks for collaboration
- **Categories**: Organize tasks with color-coded categories
- **Filters & Search**: Filter tasks by category, priority, assignee, and search terms
- **Bulk Operations**: Select multiple tasks for bulk actions (delete, complete)
- **Real-time Updates**: Optional Server-Sent Events or polling for live updates
- **Export**: Export tasks to CSV format

### User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Professional UI**: Clean, modern design with Tailwind CSS
- **Smooth Animations**: Engaging hover effects, transitions, and animations
- **Toast Notifications**: Real-time feedback for user actions
- **Loading States**: Clear loading indicators for better UX
- **Accessibility**: Keyboard navigation and screen reader support

### API Features
- **RESTful API**: Complete REST API with proper HTTP methods and status codes
- **JSON Responses**: Standardized JSON response format
- **Input Validation**: Server-side validation with proper error handling
- **Prepared Statements**: Secure database queries to prevent SQL injection
- **Activity Logging**: Track all task changes and actions
- **CORS Support**: Cross-origin resource sharing enabled

## 📋 Requirements

- **PHP 8.0+** with PDO extension
- **MySQL 5.7+** or MariaDB 10.2+
- **Apache/Nginx** web server
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)

## 🛠️ Installation & Setup

### Method 1: XAMPP Deployment (Recommended for Local Development)

#### Step 1: Install XAMPP
1. Download and install XAMPP from [https://www.apachefriends.org/](https://www.apachefriends.org/)
2. Ensure you install Apache and MySQL components

#### Step 2: Copy Project Files
1. Copy the entire project folder to `C:\xampp\htdocs\`
2. Rename the folder to `micro-task-manager` (or your preferred name)
3. Your project structure should be: `C:\xampp\htdocs\micro-task-manager\`

#### Step 3: Start XAMPP Services
1. Open XAMPP Control Panel
2. Start **Apache** service
3. Start **MySQL** service
4. Ensure both services show "Running" status

#### Step 4: Database Setup via phpMyAdmin
1. Open your browser and go to `http://localhost/phpmyadmin`
2. Click "New" to create a new database
3. Enter database name: `task_manager`
4. Click "Create"
5. Select the `task_manager` database
6. Go to "Import" tab
7. Click "Choose File" and select `database/schema.sql` from your project
8. Click "Go" to import the database structure
9. Repeat the import process with `database/seed.sql` for sample data (optional)

#### Step 5: Update Database Configuration (if needed)
Edit `backend/config/db.php` if your MySQL credentials are different:
```php
private $host = 'localhost';
private $db_name = 'task_manager';
private $username = 'root';      // Default XAMPP MySQL username
private $password = '';          // Default XAMPP MySQL password (empty)
```

#### Step 6: Access Your Application
- **Frontend**: `http://localhost/micro-task-manager/ui/`
- **API**: `http://localhost/micro-task-manager/backend/api.php`
- **phpMyAdmin**: `http://localhost/phpmyadmin`

### Method 2: Manual Setup

### Step 1: Clone/Download the Project
```bash
git clone https://github.com/yourusername/micro-task-manager.git
cd micro-task-manager
```

### Step 2: Database Setup

1. **Create Database**:
   ```sql
   CREATE DATABASE task_manager;
   ```

2. **Import Schema**:
   ```bash
   mysql -u root -p task_manager < database/schema.sql
   ```

3. **Import Seed Data** (optional):
   ```bash
   mysql -u root -p task_manager < database/seed.sql
   ```

### Step 3: Configure Database Connection

Edit `backend/config/db.php` with your database credentials:

```php
private $host = 'localhost';
private $db_name = 'task_manager';
private $username = 'your_username';
private $password = 'your_password';
```

### Step 4: Web Server Configuration

#### Apache Setup
1. Ensure mod_rewrite is enabled
2. Point document root to the project directory
3. The included `.htaccess` file will handle routing

#### Nginx Setup
Add this location block to your server configuration:
```nginx
location /api/ {
    try_files $uri $uri/ /backend/api.php?$query_string;
}

location /backend/ {
    try_files $uri $uri/ /backend/api.php?$query_string;
}
```

### Step 5: Permissions (Linux/Mac)
```bash
chmod -R 755 backend/
chmod -R 644 backend/config/
```

### Step 6: Access the Application

Open your web browser and navigate to:
- **Frontend**: `http://localhost/path-to-project/ui/`
- **API Base URL**: `http://localhost/path-to-project/backend/api.php`

## 📁 Project Structure

```
micro-task-manager/
├── ui/                          # Frontend files
│   ├── index.html              # Main application page
│   └── assets/
│       ├── main.js             # Core application logic
│       ├── api.js              # API communication layer
│       └── styles.css          # Custom CSS styles
├── backend/                     # Backend API
│   ├── api.php                 # Main API router
│   ├── .htaccess               # Apache rewrite rules
│   ├── config/
│   │   └── db.php              # Database configuration
│   ├── controllers/
│   │   ├── TaskController.php  # Task operations
│   │   ├── CategoryController.php
│   │   ├── SubtaskController.php
│   │   └── CommentController.php
│   └── helpers/
│       ├── Response.php        # API response helper
│       └── Utils.php           # Utility functions
├── database/
│   ├── schema.sql              # Database structure
│   └── seed.sql                # Sample data
├── postman/
│   └── TaskManager.postman_collection.json
└── README.md
```

## 🔌 API Documentation

### Base URL
```
http://localhost/path-to-project/backend/api.php
```

### Response Format
All API endpoints return JSON in the following format:
```json
{
    "status": "success|error",
    "message": "Descriptive message",
    "data": { ... },
    "code": 200
}
```

### Categories Endpoints

#### GET /categories
Get all categories
```bash
curl -X GET "http://localhost/backend/api.php/categories"
```

#### POST /categories
Create new category
```bash
curl -X POST "http://localhost/backend/api.php/categories" \
  -H "Content-Type: application/json" \
  -d '{"name": "Development", "color": "#10B981"}'
```

#### DELETE /categories/{id}
Delete category
```bash
curl -X DELETE "http://localhost/backend/api.php/categories/1"
```

### Tasks Endpoints

#### GET /tasks
Get all tasks with optional filters
```bash
# Get all tasks
curl -X GET "http://localhost/backend/api.php/tasks"

# With filters
curl -X GET "http://localhost/backend/api.php/tasks?status=todo&priority=High&search=bug"
```

**Query Parameters:**
- `status`: todo, in_progress, done
- `category_id`: integer
- `priority`: High, Medium, Low
- `assigned_to`: string
- `search`: string
- `sort`: due_date, priority, created_at, title
- `page`: integer (default: 1)
- `per_page`: integer (default: 20)

#### GET /tasks/{id}
Get single task with subtasks and comments
```bash
curl -X GET "http://localhost/backend/api.php/tasks/1"
```

#### POST /tasks
Create new task
```bash
curl -X POST "http://localhost/backend/api.php/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix login bug",
    "description": "Users cannot login with special characters",
    "priority": "High",
    "status": "todo",
    "category_id": 1,
    "due_date": "2025-12-01",
    "assigned_to": "john@example.com",
    "subtasks": [
      {"title": "Investigate issue"},
      {"title": "Write test cases"}
    ]
  }'
```

#### PUT /tasks/{id}
Update existing task
```bash
curl -X PUT "http://localhost/backend/api.php/tasks/1" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress", "priority": "Medium"}'
```

#### DELETE /tasks/{id}
Delete task
```bash
curl -X DELETE "http://localhost/backend/api.php/tasks/1"
```

#### POST /tasks/{id}/move
Move task to different status
```bash
curl -X POST "http://localhost/backend/api.php/tasks/1/move" \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'
```

#### GET /tasks/export
Export tasks to CSV
```bash
curl -X GET "http://localhost/backend/api.php/tasks/export"
```

#### GET /tasks/{id}/activity
Get task activity log
```bash
curl -X GET "http://localhost/backend/api.php/tasks/1/activity"
```

### Comments Endpoints

#### GET /tasks/{id}/comments
Get task comments
```bash
curl -X GET "http://localhost/backend/api.php/tasks/1/comments"
```

#### POST /tasks/{id}/comments
Add comment to task
```bash
curl -X POST "http://localhost/backend/api.php/tasks/1/comments" \
  -H "Content-Type: application/json" \
  -d '{"author": "John Doe", "content": "Great progress on this task!"}'
```

### Subtasks Endpoints

#### PUT /subtasks/{id}
Update subtask (toggle completion or change title)
```bash
curl -X PUT "http://localhost/backend/api.php/subtasks/1" \
  -H "Content-Type: application/json" \
  -d '{"is_done": 1}'
```

#### DELETE /subtasks/{id}
Delete subtask
```bash
curl -X DELETE "http://localhost/backend/api.php/subtasks/1"
```

## 🔄 Real-time Updates

### Server-Sent Events (SSE)
The application supports real-time updates via Server-Sent Events:

```javascript
// Connect to SSE stream
const eventSource = new EventSource('/backend/api.php/stream/updates');

eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    // Handle real-time updates
};
```

### Polling Fallback
If SSE is not supported on your server environment, the application automatically falls back to polling every 30 seconds.

## 🧪 Testing with Postman

1. Import the Postman collection: `postman/TaskManager.postman_collection.json`
2. Set the base URL variable to your server URL
3. Test all API endpoints

## 🔧 Customization

### Styling
- Edit `ui/assets/styles.css` for custom styles
- Modify Tailwind classes in `ui/index.html`
- Update the Tailwind configuration in the HTML head

### API Configuration
- Modify `backend/config/db.php` for database settings
- Update `backend/helpers/Response.php` for custom response formats
- Extend controllers in `backend/controllers/` for new features

### Frontend Behavior
- Edit `ui/assets/main.js` for UI logic
- Modify `ui/assets/api.js` for API communication
- Update HTML in `ui/index.html` for layout changes

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**:
   - Set appropriate database credentials
   - Configure web server (Apache/Nginx)
   - Set proper file permissions
   - Enable HTTPS

2. **Security Considerations**:
   - Change default database passwords
   - Restrict file access via .htaccess
   - Enable web server security headers
   - Regular security updates

3. **Performance Optimization**:
   - Enable Gzip compression
   - Set up database indexing
   - Configure caching headers
   - Optimize images and assets

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error:**
- Verify database credentials in `backend/config/db.php`
- Ensure MySQL service is running
- Check database permissions

**API Endpoints Not Working:**
- Verify .htaccess file is present and mod_rewrite is enabled
- Check web server error logs
- Ensure proper file permissions

**Real-time Updates Not Working:**
- Check if SSE is supported on your server
- Application will automatically fall back to polling
- Verify CORS headers are properly configured

**UI Not Loading Properly:**
- Check browser console for JavaScript errors
- Verify all asset files are accessible
- Ensure jQuery and Tailwind CSS are loading

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🙏 Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [jQuery](https://jquery.com/) for DOM manipulation and AJAX
- [Font Awesome](https://fontawesome.com/) for icons
- [PHP](https://php.net/) for server-side functionality
- [MySQL](https://mysql.com/) for database management

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@example.com
- Documentation: [Project Wiki](https://github.com/yourusername/micro-task-manager/wiki)

---

**Version:** 1.0.0  
**Last Updated:** November 2025  
**Developed with ❤️ for task management efficiency**