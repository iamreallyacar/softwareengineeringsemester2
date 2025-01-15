#!/bin/bash

# Go to frontend
cd zenro/frontend/

# Install dependencies and start the frontend in a new terminal
npm install
gnome-terminal -- bash -c "npm start; exec bash" &

# Go to backend
cd ../backend/

# Ensure virtual environment is activated
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo "Virtual environment not found, creating one..."
    python3 -m venv venv
    source venv/bin/activate
    # Install necessary Python packages directly
    pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
fi

# Start backend in a new terminal
gnome-terminal -- bash -c "python3 manage.py runserver; exec bash"
