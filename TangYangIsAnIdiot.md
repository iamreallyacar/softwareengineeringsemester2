# Recommended Extensions
1. GitHub Copilot: https://marketplace.visualstudio.com/items?itemName=GitHub.copilot
2. GitHub Copilot Chat: https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat
3. Live Share: https://marketplace.visualstudio.com/items?itemName=ms-vsliveshare.vsliveshare
4. vscode-pdf: https://marketplace.visualstudio.com/items?itemName=tomoki1207.pdf

# Checklist
1. Make a GitHub account. (apply for an education account if you want GitHub Copilot)
2. Set up WSL. (I recommend that you use the WSL terminal but the local file directory)
3. Update your packages. (sudo apt update & sudo apt upgrade)
4. Install Git and Python on your WSL.
5. Install Node.js
6. Install the above recommended extensions. (if you have a powerful computer, feel free to just install whatever VS-Code tells you to)
7. Create an ssh key and add it to your GitHub account
8. Git clone this repository

# Things we need to do
1. Marketing Strategy and Materials
2. Final Application Design and Implementation
3. Appendix of Supporting Documentation

# Database
Users

Smart Homes

Connected Smart Devices

Smart Devices

https://www.protectedtext.com/softwareengineeringsemester2
password: ilovesoftwareengineering

liveshare:
https://prod.liveshare.vsengsaas.visualstudio.com/join?E46B3AC5AFA129F7F561B71F4BBF80292BE0

# Structure of our app code:
**Frontend Structure (React)**

index.js - The entry point
- This is where React starts
- Creates the root element and renders the main App component

App.js - The main application container
- Acts as the main router
- Defines which components show up at which URLs
- Like a traffic controller for your app

api.js - API communication manager
- Central place for all backend communication
- Handles authentication tokens
- Makes HTTP requests to your backend

CSS Files - Styling
- Controls how your components look
- Defines colors, layouts, animations

**Backend Structure (Django)**

settings.py - Django configuration
- Like the control panel for Django
- Sets up:
- Database connection
- Security settings
- Installed apps
- Authentication

urls.py - URL routing
- Maps URLs to views
- Example: /api/login → login function
- Like a receptionist directing visitors

models.py - Database structure
- Defines database tables
- Example: SmartHome table with name, creator fields
- Think of it as blueprints for your data

views.py - Request handlers
- Contains the actual logic
- Handles requests and returns responses
- Like the workers doing the actual tasks

serializers.py - Data formatters
- Converts Python objects to JSON and back
- Makes data readable for frontend
- Like a translator between backend and frontend

Why So Many Files?
Separation of Concerns

Each file has a specific job
Makes code easier to maintain
Allows multiple developers to work simultaneously
Organization

Frontend code separate from backend
Styling separate from logic
Database structure separate from business logic
Security

Sensitive settings kept separate
Authentication handled in dedicated files
API routes clearly defined
Think of it like a restaurant:

models.py = Kitchen layout
views.py = Chefs
urls.py = Waiters
serializers.py = Food presentation
settings.py = Restaurant rules
Frontend files = Dining room and menu

This separation makes the code more organized and maintainable, just like how different restaurant sections handle different tasks.

# Role Assignment
**(Still unconfirmed)**
Code refactoring + cleaning:
Aisyah
Bobo
Avril

Backend:
Zheng Rong (lead)
Dzuhair

Frontend:
Zheng Rong
Tang Yang

Frontend Designer (css):
Avril (lead)

Marketing
Alan
Stone
