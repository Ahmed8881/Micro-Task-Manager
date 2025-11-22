-- Micro Task Manager Seed Data
USE task_manager;

-- Insert categories
INSERT INTO categories (name, color) VALUES 
('Development', '#10B981'),
('Design', '#F59E0B'),
('Marketing', '#EF4444'),
('Testing', '#8B5CF6'),
('Documentation', '#06B6D4');

-- Insert tasks
INSERT INTO tasks (title, description, priority, due_date, status, category_id, assigned_to) VALUES 
-- Todo tasks
('Setup Development Environment', 'Configure local development environment with necessary tools and dependencies', 'High', '2025-12-01', 'todo', 1, 'John Doe'),
('Create Landing Page Design', 'Design mockups for the main landing page with modern UI/UX principles', 'Medium', '2025-12-05', 'todo', 2, 'Jane Smith'),
('Write API Documentation', 'Document all REST API endpoints with examples and response formats', 'Low', '2025-12-10', 'todo', 5, 'Mike Johnson'),

-- In Progress tasks
('Implement User Authentication', 'Build login/logout functionality with JWT tokens and session management', 'High', '2025-11-30', 'in_progress', 1, 'John Doe'),
('Design Database Schema', 'Create comprehensive database design with proper relationships and indexes', 'Medium', '2025-11-28', 'in_progress', 1, 'Alice Brown'),

-- Done tasks
('Project Planning Meeting', 'Initial project kickoff meeting with stakeholders and team leads', 'Low', '2025-11-20', 'done', 4, 'Team Lead'),
('Setup Version Control', 'Initialize Git repository and setup branching strategy', 'High', '2025-11-22', 'done', 1, 'John Doe'),
('Market Research Analysis', 'Research competitor products and identify market opportunities', 'Medium', '2025-11-25', 'done', 3, 'Sarah Wilson');

-- Insert subtasks
INSERT INTO subtasks (task_id, title, is_done) VALUES 
-- Subtasks for Setup Development Environment (task_id: 1)
(1, 'Install PHP 8.0+', 0),
(1, 'Setup MySQL database', 0),
(1, 'Configure Apache/Nginx', 0),
(1, 'Install Composer dependencies', 0),

-- Subtasks for Create Landing Page Design (task_id: 2)
(2, 'Create wireframes', 1),
(2, 'Design hero section', 0),
(2, 'Design features section', 0),
(2, 'Create responsive layout', 0),

-- Subtasks for Implement User Authentication (task_id: 4)
(4, 'Create login form', 1),
(4, 'Implement password hashing', 1),
(4, 'Setup JWT tokens', 0),
(4, 'Add session management', 0),

-- Subtasks for Project Planning Meeting (task_id: 6)
(6, 'Schedule meeting with stakeholders', 1),
(6, 'Prepare project timeline', 1),
(6, 'Define project scope', 1),
(6, 'Assign initial responsibilities', 1);

-- Insert comments
INSERT INTO comments (task_id, author, content) VALUES 
(1, 'John Doe', 'Started working on the environment setup. PHP 8.1 installed successfully.'),
(1, 'Team Lead', 'Great progress! Make sure to document the setup steps for other developers.'),
(2, 'Jane Smith', 'Initial wireframes are ready for review. Focusing on mobile-first approach.'),
(2, 'UI Designer', 'The wireframes look good. Consider adding some micro-interactions for better UX.'),
(4, 'John Doe', 'Login form is complete. Working on the backend authentication logic now.'),
(4, 'Security Expert', 'Remember to implement rate limiting for login attempts to prevent brute force attacks.'),
(6, 'Team Lead', 'Excellent meeting! Everyone is aligned on the project goals and timeline.'),
(7, 'John Doe', 'Repository is set up with develop and feature branches. All team members have access.');

-- Insert activity log entries
INSERT INTO activity_log (task_id, action, details, user_name) VALUES 
(1, 'created', 'Task created with high priority due to project dependencies', 'Project Manager'),
(2, 'created', 'Design task created and assigned to Jane Smith', 'Project Manager'),
(3, 'created', 'Documentation task created for API endpoints', 'Project Manager'),
(4, 'created', 'Authentication implementation task created', 'Project Manager'),
(4, 'updated', 'Task moved to in_progress status', 'John Doe'),
(4, 'commented', 'Added comment about login form completion', 'John Doe'),
(5, 'created', 'Database design task created and started', 'Project Manager'),
(5, 'updated', 'Task status changed to in_progress', 'Alice Brown'),
(6, 'created', 'Planning meeting task created', 'Project Manager'),
(6, 'updated', 'Task completed successfully', 'Team Lead'),
(7, 'created', 'Version control setup task created', 'Project Manager'),
(7, 'updated', 'Task completed - repository ready', 'John Doe'),
(8, 'created', 'Market research task created', 'Project Manager'),
(8, 'updated', 'Research completed with findings documented', 'Sarah Wilson'),
(1, 'updated', 'Added subtasks for environment setup', 'John Doe'),
(2, 'updated', 'Wireframes completed and ready for review', 'Jane Smith');