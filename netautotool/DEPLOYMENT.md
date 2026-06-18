# OTOMANET Production Deployment Guide

This guide describes how to deploy OTOMANET using Cloudflare Tunnel for secure remote access without opening inbound firewall ports.

## 📋 Prerequisites
- Ubuntu 22.04 LTS Server
- A Domain name managed by Cloudflare
- Root or Sudo access

## 🚀 Quick Deployment
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/otomanet.git /opt/otomanet
   cd /opt/otomanet
   ```

2. **Run the deploy script**:
   ```bash
   chmod +x deploy.sh
   sudo ./deploy.sh
   ```

3. **Initialize the Admin user**:
   ```bash
   sudo -u otomanet ./venv/bin/python init_admin.py
   ```

## ☁️ Cloudflare Tunnel Setup
Instead of Nginx SSL, we use Cloudflare Tunnel to expose the local app safely.

1. **Login to Cloudflare**:
   ```bash
   sudo -u otomanet cloudflared tunnel login
   ```
   *Follow the link provided to authorize your domain.*

2. **Create the Tunnel**:
   ```bash
   sudo -u otomanet cloudflared tunnel create otomanet
   ```
   *Note down the Tunnel ID.*

3. **Configure the Tunnel**:
   Edit `/opt/otomanet/cloudflare/config.yml` and replace `<TUNNEL_ID>` with your actual ID.

4. **Setup DNS Route**:
   ```bash
   sudo -u otomanet cloudflared tunnel route dns otomanet otomanet.yourdomain.com
   ```

5. **Start & Enable the Tunnel Service**:
   ```bash
   sudo systemctl enable --now cloudflared
   ```

## 🔐 Security Configuration
- **Environment**: Ensure `.env` contains a strong `SECRET_KEY` and `ENCRYPTION_KEY`.
- **User Roles**: Use the **Viewer** role for read-only access and **Operator** for day-to-day network changes.
- **Audit Logs**: Check the `/audit` page regularly for suspicious activity.

## 🛠 Maintenance
- **View Logs**: `journalctl -u otomanet -f`
- **Restart App**: `systemctl restart otomanet`
- **Update App**:
  ```bash
  cd /opt/otomanet
  git pull
  ./venv/bin/pip install -r requirements.txt
  systemctl restart otomanet otomanet-celery
  ```

## ❓ Troubleshooting
- **cloudflared status**: `systemctl status cloudflared`
- **Port conflicts**: Ensure port 80 and 8000 are not occupied by other apps.
- **Permissions**: `chown -R otomanet:otomanet /opt/otomanet`
