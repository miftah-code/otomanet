/**
 * OTOMANET Core JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    initConsoleResize();
    startClock();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('otomanet_theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light');
    }
    updateThemeIcon();
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light');
    localStorage.setItem('otomanet_theme', isLight ? 'light' : 'dark');
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.querySelector('#theme-toggle i');
    const label = document.querySelector('#theme-label');
    
    if (document.body.classList.contains('light')) {
        if (icon) icon.className = 'bi bi-moon-fill';
        if (label) label.textContent = 'Dark Mode';
    } else {
        if (icon) icon.className = 'bi bi-sun-fill';
        if (label) label.textContent = 'Light Mode';
    }
}

// Sidebar Management
function initSidebar() {
    const isCollapsed = localStorage.getItem('otomanet_sidebar_collapsed') === 'true';
    const sidebar = document.getElementById('sidebar');
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const isCollapsed = sidebar.classList.toggle('collapsed');
    localStorage.setItem('otomanet_sidebar_collapsed', isCollapsed);
}

// Resizable & Minimizable Console
function initConsoleResize() {
    const consolePanel = document.getElementById('console-panel');
    const resizer = document.querySelector('.console-resizer');
    let isResizing = false;

    if (!resizer || !consolePanel) return;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'ns-resize';
        consolePanel.classList.remove('minimized');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const h = window.innerHeight - e.clientY;
        if (h >= 36 && h <= window.innerHeight * 0.8) {
            consolePanel.style.height = `${h}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = 'default';
            localStorage.setItem('otomanet_console_height', consolePanel.style.height);
        }
    });

    // Load saved height
    const savedHeight = localStorage.getItem('otomanet_console_height');
    if (savedHeight) consolePanel.style.height = savedHeight;
}

function toggleConsole() {
    const panel = document.getElementById('console-panel');
    if (panel) {
        panel.classList.toggle('minimized');
        const icon = document.getElementById('console-toggle-icon');
        if (panel.classList.contains('minimized')) {
            icon.className = 'bi bi-chevron-up';
        } else {
            icon.className = 'bi bi-chevron-down';
        }
    }
}

// Clock
function startClock() {
    const clockEl = document.getElementById('real-time-clock');
    const iconEl = document.getElementById('clock-icon');
    if (!clockEl) return;
    
    function update() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        // Update Icon based on time of day
        if (iconEl) {
            if (hours >= 5 && hours < 11) {
                iconEl.className = 'bi bi-brightness-low text-warning me-2'; // Morning
            } else if (hours >= 11 && hours < 17) {
                iconEl.className = 'bi bi-brightness-high-fill text-warning me-2'; // Day
            } else if (hours >= 17 && hours < 19) {
                iconEl.className = 'bi bi-sunset-fill text-danger me-2'; // Evening
            } else {
                iconEl.className = 'bi bi-moon-stars-fill text-info me-2'; // Night
            }
        }

        const timeStr = [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':') + ' WIB';
        
        clockEl.textContent = timeStr;
    }
    
    update();
    setInterval(update, 1000);
}

// Toast
function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'bi-info-circle';
    if (type === 'success') icon = 'bi-check-circle-fill text-success';
    if (type === 'error') icon = 'bi-exclamation-triangle-fill text-danger';
    toast.innerHTML = `<i class="bi ${icon} me-2"></i><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
}

// API Wrapper
async function apiCall(method, url, data = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (data) options.body = JSON.stringify(data);
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || result.error || result.message || 'API Call Failed');
        return result;
    } catch (err) {
        showToast(err.message, 'error');
        throw err;
    }
}

function appendConsole(html, level = 'info') {
    const body = document.getElementById('console-body');
    if (!body) return;
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour12: false });
    const div = document.createElement('div');
    div.innerHTML = `<span class="tx3">[${timestamp}]</span> <span class="log-level-${level}">${level.toUpperCase()}</span> ${html}`;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

function clearConsole() {
    const body = document.getElementById('console-body');
    if (body) body.innerHTML = '';
}
