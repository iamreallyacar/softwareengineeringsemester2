#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status
set -o pipefail  # Return the exit status of the last command in the pipe that failed

# Update Homebrew
echo "Updating Homebrew..."
brew update
brew upgrade

# Install Node.js
echo "Installing Node.js..."
if ! command -v node &> /dev/null
then
    brew install node
else
    echo "Node.js is already installed."
fi

# Ensure npm is installed
if ! command -v npm &> /dev/null
then
    echo "npm could not be found, installing..."
    brew install npm
else
    echo "npm is already installed."
fi

# Install Python
echo "Installing Python..."
brew install python3

# Install Django and additional packages using Homebrew
echo "Installing Django and additional packages..."
brew install django
pip3 install djangorestframework djangorestframework-simplejwt django-cors-headers pythonnet django-crontab
echo "Installation complete!"
