// Advanced charts for dashboard
function renderVelocityChart(tasks) {
    // Example: velocity = tasks completed per week
    const weeks = {};
    tasks.forEach(t => {
        if (t.status === 'done' && t.completed_at) {
            const week = new Date(t.completed_at);
            const weekStr = `${week.getFullYear()}-W${getWeekNumber(week)}`;
            weeks[weekStr] = (weeks[weekStr] || 0) + 1;
        }
    });
    new Chart(document.getElementById('velocityChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(weeks),
            datasets: [{
                label: 'Tasks Completed',
                data: Object.values(weeks),
                backgroundColor: '#3B82F6'
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}

function renderBurndownChart(tasks) {
    // Example: burndown = remaining tasks per day
    const days = {};
    tasks.forEach(t => {
        const due = new Date(t.due_date);
        const dayStr = due.toISOString().split('T')[0];
        days[dayStr] = (days[dayStr] || 0) + 1;
    });
    new Chart(document.getElementById('burndownChart'), {
        type: 'line',
        data: {
            labels: Object.keys(days),
            datasets: [{
                label: 'Remaining Tasks',
                data: Object.values(days),
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245,158,11,0.2)',
                fill: true
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

function getWeekNumber(date) {
    const firstJan = new Date(date.getFullYear(), 0, 1);
    return Math.ceil((((date - firstJan) / 86400000) + firstJan.getDay() + 1) / 7);
}
