#!/bin/bash

# Update packages
echo "Updating packages..."
sudo apt update
sudo apt upgrade -y

# Install Node.js
echo "Installing Node.js..."
sudo apt install -y curl
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.nvm/nvm.sh
nvm install node
nvm use node

# Install Python
echo "Installing Python..."
sudo apt install -y python3 python3-pip python3-venv

# Create a virtual environment
echo "Creating a virtual environment..."
python3 -m venv ~/myenv
source ~/myenv/bin/activate

# Install Django and additional packages
echo "Installing Django and additional packages..."
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers

echo "Setup complete."
