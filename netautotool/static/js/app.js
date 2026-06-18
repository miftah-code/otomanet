// OTOMANET Frontend Logic

document.addEventListener('DOMContentLoaded', () => {
    loadDevices();
    
    // Select All Checkbox
    const selectAll = document.getElementById('select-all');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.device-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });
    }

    // Add Device Handler
    const addForm = document.getElementById('add-device-form');
    if (addForm) {
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('add-btn');
            const originalText = btn.innerText;
            btn.innerText = 'Saving...';
            btn.disabled = true;

            const payload = {
                hostname: document.getElementById('host-name').value,
                ip_address: document.getElementById('ip-addr').value,
                device_type: document.getElementById('device-type').value,
                username: document.getElementById('user-name').value,
                password: document.getElementById('pass-word').value,
                secret: document.getElementById('secret-key').value || null,
                port: 22
            };

            logToTerminal(`Adding device ${payload.hostname}...`, 'in');

            try {
                const response = await fetch('/api/devices/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    logToTerminal(`Device ${payload.hostname} added successfully.`, 'out');
                    closeModal();
                    addForm.reset();
                    loadDevices();
                } else {
                    const err = await response.json();
                    logToTerminal('Server Error: ' + (err.detail || JSON.stringify(err)), 'err');
                }
            } catch (err) {
                logToTerminal('Network Error: ' + err.message, 'err');
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }
});

// Modal Controls
function openModal() { document.getElementById('device-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('device-modal').style.display = 'none'; }
function openEditModal() { document.getElementById('edit-modal').style.display = 'flex'; }
function closeEditModal() { document.getElementById('edit-modal').style.display = 'none'; }
function openBulkModal() { document.getElementById('bulk-modal').style.display = 'flex'; }
function closeBulkModal() { document.getElementById('bulk-modal').style.display = 'none'; }

// Log to Terminal UI
function logToTerminal(message, type = 'out') {
    const terminal = document.getElementById('terminal');
    if (!terminal) return;
    const line = document.createElement('div');
    line.className = 'console-line';
    const timestamp = new Date().toLocaleTimeString();
    
    const content = type === 'config' 
        ? `<pre class="config-text">${message}</pre>` 
        : `<span class="console-${type}">${message}</span>`;

    line.innerHTML = `<span class="console-muted">[${timestamp}]</span> ${content}`;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

// Fetch and Render Devices
async function loadDevices() {
    try {
        const response = await fetch('/api/devices/');
        const devices = await response.json();
        
        const tbody = document.getElementById('device-list-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        let online = 0;
        document.getElementById('stat-total').innerText = devices.length;

        devices.forEach(dev => {
            if (dev.is_active) online++;
            const statusClass = dev.is_active ? 'status-online' : 'status-offline';
            const statusText = dev.is_active ? 'Online' : 'Offline';

            const row = `
                <tr>
                    <td><input type="checkbox" class="device-checkbox" value="${dev.id}"></td>
                    <td><strong>${dev.hostname}</strong></td>
                    <td>${dev.ip_address}</td>
                    <td>${dev.device_type}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-icon" title="Test Connection" onclick="testConnection(${dev.id})">⚡</button>
                        <button class="btn btn-icon" title="Get Config" onclick="getConfig(${dev.id})">📋</button>
                        <button class="btn btn-icon" title="Verify Config" onclick="verifyConfig(${dev.id})">🔍</button>
                        <button class="btn btn-icon" title="Edit Device" onclick="editDevice(${dev.id})">✏️</button>
                        <button class="btn btn-icon" title="Delete Device" style="color: var(--danger)" onclick="deleteDevice(${dev.id})">🗑️</button>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });

        document.getElementById('stat-online').innerText = online;
        document.getElementById('stat-offline').innerText = devices.length - online;
    } catch (err) {
        logToTerminal('Error loading devices: ' + err.message, 'err');
    }
}

// Edit Device - Fetch specifically one device
async function editDevice(id) {
    logToTerminal(`Fetching details for device ID: ${id}...`, 'in');
    try {
        const response = await fetch(`/api/devices/${id}`);
        if (!response.ok) throw new Error('Could not fetch device details');
        
        const dev = await response.json();
        
        document.getElementById('edit-id').value = dev.id;
        document.getElementById('edit-host-name').value = dev.hostname;
        document.getElementById('edit-ip-addr').value = dev.ip_address;
        document.getElementById('edit-device-type').value = dev.device_type;
        document.getElementById('edit-user-name').value = dev.username;
        document.getElementById('edit-pass-word').value = ''; 
        document.getElementById('edit-secret-key').value = ''; 
        
        openEditModal();
        logToTerminal(`Device ${dev.hostname} details loaded. Ready to edit.`, 'out');
    } catch (err) {
        logToTerminal('Error: ' + err.message, 'err');
    }
}

// GLOBAL UPDATE SUBMIT HANDLER
async function handleUpdateSubmit() {
    logToTerminal("Update button clicked. Initializing update process...", "in");
    
    const btn = document.getElementById('edit-btn');
    const idField = document.getElementById('edit-id');
    
    if (!idField || !idField.value) {
        logToTerminal("CRITICAL ERROR: Could not find Device ID in the form.", "err");
        return;
    }

    const id = idField.value;
    const originalText = btn.innerText;
    
    try {
        btn.innerText = 'Updating...';
        btn.disabled = true;

        const payload = {
            hostname: document.getElementById('edit-host-name').value,
            ip_address: document.getElementById('edit-ip-addr').value,
            device_type: document.getElementById('edit-device-type').value,
            username: document.getElementById('edit-user-name').value,
        };

        const password = document.getElementById('edit-pass-word').value;
        const secret = document.getElementById('edit-secret-key').value;
        if (password && password.trim() !== '') payload.password = password;
        if (secret && secret.trim() !== '') payload.secret = secret;

        logToTerminal(`Connecting to API to update device ${id}...`, "in");

        const response = await fetch(`/api/devices/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            logToTerminal(`Device ${payload.hostname} updated successfully.`, 'out');
            closeEditModal();
            loadDevices();
        } else {
            const err = await response.json();
            logToTerminal('Update Failed: ' + (err.detail || JSON.stringify(err)), 'err');
        }
    } catch (err) {
        logToTerminal('Network Error: ' + err.message, 'err');
        console.error("Update Error:", err);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// Action Functions
async function testConnection(id) {
    logToTerminal(`Testing connection to device ID: ${id}...`, 'in');
    try {
        const response = await fetch(`/api/devices/${id}/test-connection`, { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            logToTerminal(`SUCCESS: Connected.`, 'out');
        } else {
            logToTerminal(`FAILED: ${data.error || 'Unknown error'}`, 'err');
        }
        loadDevices();
    } catch (err) {
        logToTerminal('Test Error: ' + err.message, 'err');
    }
}

async function executeBulkPush() {
    const selected = Array.from(document.querySelectorAll('.device-checkbox:checked')).map(cb => parseInt(cb.value));
    const commands = document.getElementById('bulk-commands').value.split('\n').filter(line => line.trim() !== '');

    if (selected.length === 0) return alert('Select at least one device!');
    if (commands.length === 0) return alert('Enter at least one command!');

    logToTerminal(`Starting bulk push to ${selected.length} devices...`, 'in');
    closeBulkModal();

    try {
        const response = await fetch('/api/devices/bulk-push-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_ids: selected, commands: commands })
        });
        const results = await response.json();

        results.forEach(res => {
            if (res.success) {
                logToTerminal(`[${res.hostname}] Push Success.`);
                logToTerminal(res.output, 'config');
            } else {
                logToTerminal(`[${res.hostname}] Push Failed: ${res.error}`, 'err');
            }
        });
    } catch (err) { logToTerminal('Bulk Push Error: ' + err.message, 'err'); }
}

async function executeBulkBackup() {
    const selected = Array.from(document.querySelectorAll('.device-checkbox:checked')).map(cb => parseInt(cb.value));
    if (selected.length === 0) return alert('Select at least one device to backup!');

    logToTerminal(`Starting manual bulk backup for ${selected.length} devices...`, 'in');

    try {
        const response = await fetch('/api/devices/bulk-backup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_ids: selected })
        });
        const results = await response.json();

        results.forEach(res => {
            if (res.success) {
                logToTerminal(`[${res.hostname}] Backup SUCCESS: ${res.file}`, 'out');
            } else {
                logToTerminal(`[${res.hostname}] Backup FAILED: ${res.error}`, 'err');
            }
        });
    } catch (err) { logToTerminal('Bulk Backup Error: ' + err.message, 'err'); }
}

async function getConfig(id) {
    logToTerminal(`Fetching configuration from device ID: ${id}...`, 'in');
    try {
        const response = await fetch(`/api/devices/${id}/config`);
        const data = await response.json();
        if (data.success) {
            logToTerminal(`Config fetched successfully.`, 'out');
            logToTerminal(data.config, 'config');
        } else {
            logToTerminal(`Failed to get config: ${data.detail || 'Unknown error'}`, 'err');
        }
    } catch (err) {
        logToTerminal('Config Error: ' + err.message, 'err');
    }
}

async function verifyConfig(id) {
    const lines = prompt("Enter configuration lines to verify (comma separated):", "snmp-server community, ntp server");
    if (!lines) return;

    const commands = lines.split(',').map(l => l.trim());
    logToTerminal(`Verifying configuration for ID: ${id}...`, 'in');

    try {
        const res = await fetch(`/api/devices/${id}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commands: commands })
        });
        const data = await res.json();
        
        if (data.success) {
            logToTerminal(`Verification complete. Report generated: ${data.filename}`, 'out');
            const downloadUrl = `/api/devices/reports/${data.filename}`;
            logToTerminal(`<a href="${downloadUrl}" target="_blank" style="color: var(--accent-primary)">Download Report (.txt)</a>`, 'out');
        } else {
            logToTerminal(`Verification failed: ${data.error}`, 'err');
        }
    } catch (err) { logToTerminal(err.message, 'err'); }
}

async function deleteDevice(id) {
    if (!confirm('Are you sure you want to delete this device?')) return;
    try {
        const response = await fetch(`/api/devices/${id}`, { method: 'DELETE' });
        if (response.ok) {
            logToTerminal(`Device ${id} deleted.`, 'out');
            loadDevices();
        }
    } catch (err) {
        logToTerminal('Delete Error: ' + err.message, 'err');
    }
}
