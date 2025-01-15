#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status
set -o pipefail  # Return the exit status of the last command in the pipe that failed

# Update packages
echo "Updating packages..."
sudo apt update
sudo apt upgrade -y

# Install Node.js
echo "Installing Node.js..."
if ! command -v node &> /dev/null
then
    sudo apt install -y curl
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    source ~/.nvm/nvm.sh
    nvm install node
    nvm use node
else
    echo "Node.js is already installed."
fi

# Ensure npm is installed
if ! command -v npm &> /dev/null
then
    echo "npm could not be found, installing..."
    sudo apt update
    sudo apt install -y npm
else
    echo "npm is already installed."
fi

# Install Python
echo "Installing Python..."
sudo apt install -y python3 python3-pip python3-venv

# Create a virtual environment
if [ ! -d "~/myenv" ]; then
    echo "Creating a virtual environment..."
    python3 -m venv ~/myenv
else
    echo "Virtual environment already exists."
fi
source ~/myenv/bin/activate

# Install Django and additional packages
echo "Installing Django and additional packages..."
pip install --upgrade pip
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
