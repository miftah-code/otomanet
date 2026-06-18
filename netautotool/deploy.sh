#!/bin/bash
# OTOMANET Deployment Script for Ubuntu 22.04
# Usage: sudo ./deploy.sh

set -e

echo "===================================================="
echo "      OTOMANET PRODUCTION DEPLOYMENT SCRIPT        "
echo "===================================================="

# 1. System Dependencies
echo "[1/10] Installing system dependencies..."
apt-get update
apt-get install -y python3.10 python3-pip python3-venv redis-server nginx git curl sqlite3

# 2. Cloudflare Tunnel Binary
echo "[2/10] Installing cloudflared..."
if ! command -v cloudflared &> /dev/null; then
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
    dpkg -i cloudflared.deb
    rm cloudflared.deb
fi

# 3. User Setup
echo "[3/10] Setting up dedicated user..."
if ! id "otomanet" &>/dev/null; then
    useradd -m -s /bin/bash otomanet
fi

# 4. Directory & Permissions
echo "[4/10] Configuring project directories..."
PROJECT_DIR="/opt/otomanet"
mkdir -p $PROJECT_DIR
cp -r . $PROJECT_DIR/
chown -R otomanet:otomanet $PROJECT_DIR

# 5. Virtual Environment
echo "[5/10] Setting up Python virtual environment..."
cd $PROJECT_DIR
sudo -u otomanet python3 -m venv venv
sudo -u otomanet ./venv/bin/pip install --upgrade pip
sudo -u otomanet ./venv/bin/pip install -r requirements.txt

# 6. Environment Variables
echo "[6/10] Configuring environment variables..."
if [ ! -f .env ]; then
    sudo -u otomanet cp .env.example .env
    KEY=$(python3 -c "import os; print(os.urandom(24).hex())")
    sudo -u otomanet sed -i "s/SECRET_KEY=.*/SECRET_KEY=$KEY/" .env
fi

# 7. Database Initialization
echo "[7/10] Initializing database..."
sudo -u otomanet ./venv/bin/python -c "from app.database import init_db; init_db()"

# 8. Logging
echo "[8/10] Configuring logs..."
mkdir -p /var/log/otomanet
chown otomanet:otomanet /var/log/otomanet

# 9. Systemd Services
echo "[9/10] Installing systemd services..."
cp systemd/*.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable redis otomanet otomanet-celery
systemctl start redis otomanet otomanet-celery

# 10. Nginx Local Proxy
echo "[10/10] Configuring Nginx local proxy..."
if [ -f nginx/otomanet-local.conf ]; then
    cp nginx/otomanet-local.conf /etc/nginx/sites-available/otomanet
    ln -sf /etc/nginx/sites-available/otomanet /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
fi

echo "===================================================="
echo "         OTOMANET DEPLOYMENT COMPLETED!            "
echo "===================================================="
echo "Next Steps:"
echo "1. Initialize Admin: sudo -u otomanet ./venv/bin/python init_admin.py"
echo "2. Setup Cloudflare Tunnel:"
echo "   a. sudo -u otomanet cloudflared tunnel login"
echo "   b. sudo -u otomanet cloudflared tunnel create otomanet"
echo "   c. Update $PROJECT_DIR/cloudflare/config.yml with Tunnel ID"
echo "   d. sudo -u otomanet cloudflared tunnel route dns otomanet yourdomain.com"
echo "   e. systemctl enable --now cloudflared"
echo "===================================================="
