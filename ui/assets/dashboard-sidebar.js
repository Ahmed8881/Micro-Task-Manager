// Sidebar navigation logic for dashboard
const sidebarLinks = document.querySelectorAll('.sidebar-link');
sidebarLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const target = this.getAttribute('data-target');
        document.querySelectorAll('.dashboard-section').forEach(sec => sec.classList.add('hidden'));
        document.getElementById(target).classList.remove('hidden');
        sidebarLinks.forEach(l => l.classList.remove('bg-blue-100', 'font-bold'));
        this.classList.add('bg-blue-100', 'font-bold');
    });
});
// Show first section by default
if (sidebarLinks.length) {
    sidebarLinks[0].click();
}
