#!/bin/bash

# OTOMANET - Initial Setup Script for Ubuntu
# Senior Network Automation Engineer / Python Developer

set -e

echo "--- Starting OTOMANET Setup ---"

# 1. Update and Install System Dependencies
sudo apt update
sudo apt install -y python3.10 python3-pip python3-venv redis-server ansible build-essential libssl-dev libffi-dev

# 2. Setup Project Structure (if not already present)
mkdir -p backup ansible static templates core utils models app

# 3. Create and Activate Virtual Environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created."
fi
source venv/bin/activate

# 4. Install Python Dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 5. Generate .env file from template if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    
    # Generate random secret key
    SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
    sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
    
    # Generate Fernet encryption key
    ENCRYPTION_KEY=$(python3 -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())')
    sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$ENCRYPTION_KEY|" .env
    
    echo ".env file created with generated keys."
fi

# 6. Set Permissions
chmod 700 backup
chmod +x setup_ubuntu.sh

# 7. Start Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server

echo "--- Setup Complete ---"
echo "To start the application:"
echo "1. source venv/bin/activate"
echo "2. python3 run.py"
