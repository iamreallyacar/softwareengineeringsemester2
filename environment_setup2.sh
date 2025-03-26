#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status
set -o pipefail  # Return the exit status of the last command in the pipe that failed

# Install Curl
sudo apt install curl -y

# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Set Homebrew path
echo >> /home/{your username here}/.bashrc
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> /home/{your username here}/.bashrc
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
sudo apt-get install build-essential

brew update
brew upgrade

# Install Node.js
brew install node

# Install npm
brew install npm

# Install django and additional dependencies
sudo apt install python3 python3-django python3-djangorestframework python3-djangorestframework-simplejwt python3-django-cors-headers

pip install django-crontab pythonnet drf-yasg

# Install frontend dependencies
cd zenro/frontend/ && npm install && cd ../..