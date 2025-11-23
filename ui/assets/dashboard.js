// Dashboard logic for Micro Task Manager
const API_BASE = '../backend/api.php';

// Fetch dashboard data
async function fetchDashboardData() {
    const [tasksRes, categoriesRes, activityRes] = await Promise.all([
        fetch(API_BASE + '/tasks').then(r => r.json()),
        fetch(API_BASE + '/categories').then(r => r.json()),
        fetch(API_BASE + '/tasks/1/activity').then(r => r.json()) // Example: recent activity for task 1
    ]);
    return { tasks: tasksRes.data.tasks, categories: categoriesRes.data, activity: activityRes.data };
}

function renderTotalTasks(tasks) {
    document.getElementById('totalTasks').textContent = tasks.length;
}

function renderStatusChart(tasks) {
    const statusCounts = { 'todo': 0, 'in_progress': 0, 'done': 0 };
    tasks.forEach(t => statusCounts[t.status] = (statusCounts[t.status] || 0) + 1);
    new Chart(document.getElementById('statusChart'), {
        type: 'doughnut',
        data: {
            labels: ['To Do', 'In Progress', 'Done'],
            datasets: [{
                data: [statusCounts.todo, statusCounts.in_progress, statusCounts.done],
                backgroundColor: ['#F87171', '#FBBF24', '#34D399']
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

function renderCategoryChart(tasks, categories) {
    const catMap = {};
    categories.forEach(c => catMap[c.id] = { name: c.name, color: c.color, count: 0 });
    tasks.forEach(t => {
        if (catMap[t.category_id]) catMap[t.category_id].count++;
    });
    new Chart(document.getElementById('categoryChart'), {
        type: 'pie',
        data: {
            labels: Object.values(catMap).map(c => c.name),
            datasets: [{
                data: Object.values(catMap).map(c => c.count),
                backgroundColor: Object.values(catMap).map(c => c.color)
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

function renderActivityFeed(activity) {
    const feed = document.getElementById('activityFeed');
    feed.innerHTML = '';
    if (!activity || !Array.isArray(activity)) {
        feed.innerHTML = '<li>No recent activity.</li>';
        return;
    }
    activity.slice(0, 10).forEach(act => {
        const li = document.createElement('li');
        li.textContent = `${act.timestamp || ''} - ${act.action || act.message || ''}`;
        feed.appendChild(li);
    });
}

// Quick Add Task
const quickAddTaskForm = document.getElementById('quickAddTaskForm');
quickAddTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
        title: form.title.value,
        description: form.description.value,
        status: 'todo',
        priority: 'Medium',
        category_id: 1
    };
    const res = await fetch(API_BASE + '/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(r => r.json());
    document.getElementById('quickAddTaskMsg').textContent = res.status === 'success' ? 'Task added!' : 'Error adding task.';
    if (res.status === 'success') location.reload();
});

// Quick Add Category
const quickAddCategoryForm = document.getElementById('quickAddCategoryForm');
quickAddCategoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
        name: form.name.value,
        color: form.color.value
    };
    const res = await fetch(API_BASE + '/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(r => r.json());
    document.getElementById('quickAddCategoryMsg').textContent = res.status === 'success' ? 'Category added!' : 'Error adding category.';
    if (res.status === 'success') location.reload();
});

// Initialize dashboard
fetchDashboardData().then(({ tasks, categories, activity }) => {
    renderTotalTasks(tasks);
    renderStatusChart(tasks);
    renderCategoryChart(tasks, categories);
    renderActivityFeed(activity);
});
