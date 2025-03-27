#!/bin/bash

sudo apt update
sudo apt upgrade -y

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

# Install Python packages
pip install django==4.2.5 
pip install djangorestframework djangorestframework-simplejwt
pip install django-cors-headers django-filter
pip install django-crontab pythonnet drf-yasg
pip install requests python-dateutil

# Install cron
sudo apt install cron

# Set up cron
sudo systemctl enable cron
sudo systemctl start cron

# Install frontend dependencies
cd zenro/frontend/ && npm install && cd ../..

# Database migrations
cd zenro/backend
python3 manage.py makemigrations
python3 manage.py migrate

# Create superuser
python3 manage.py createsuperuser

# Set up cron jobs for the scehduled tasks 
python3 manage.py crontab add

# Show current cron jobs
echo "Current cron jobs:"
python3 manage.py crontab show
cd ../..

echo "=================================================="
echo "Setup complete! To start the application:"
echo ""
echo "Backend:"
echo "cd zenro/backend"
echo "python3 manage.py runserver"
echo ""
echo "Frontend (in a new terminal):"
echo "cd zenro/frontend"
echo "npm start"
echo "=================================================="