# Software Engineering Group 2
## Main Folder and File Structure
Guides: Has all the things you need to know to get started with the project. Come here if you are stuck!
Instruction PDF Files: Important PDF files provided by the university and our Stage 1 final document. Must read!
Testing Folder: Don't worry about these, they will be deleted soon.
zenro: Our project's main directory. All the code are in here. It's named zenro so Zheng Rong can feel the pressure of having the whole group's work on his name.
.gitignore: Don't touch this file if you have no idea what you are doing. If something has to be excluded safely and should never be added, commited, or pushed, let me know and I will add it to this file.
README.md: You are reading this now, dumbass.

### Resources

### Management

Below is a practical, step-by-step guide to help you develop a fully functioning smart home system using open source or free tools. This guide assumes you have a basic understanding of programming concepts but are unsure how to piece everything together into a working solution. The stack chosen here is Django (Python) for the backend and React (JavaScript) for the frontend because both are widely used, have large communities, and are free.
High-Level Overview
•	Backend: Django (Python) and Django REST Framework for APIs
•	Frontend: React (JavaScript)
•	Database: SQLite (for development) and later Postgres or MySQL if needed
•	Version Control: Git + GitHub
•	Testing: Built-in testing frameworks (unittest/pytest for Python, Jest for React)
•	Deployment: Free hosting tiers (e.g., Render.com for backend and Netlify or Vercel for frontend)
•	Dev Environment: VS Code (free) or any text editor, plus Terminal/Command Prompt
Prerequisites
•	A computer running Windows, macOS, or Linux
•	Installed:
o	Python 3.10+ (https://www.python.org/downloads/)
o	Node.js (LTS version) (https://nodejs.org/en/)
o	Git (https://git-scm.com/downloads)
•	A GitHub account (https://github.com/) for version control
•	Optional: VS Code (https://code.visualstudio.com/) for a free, powerful code editor
________________________________________
Step-by-Step Guide
Step 1: Set Up Your Development Environment
1.	Install Python from the official website and ensure you can run python --version in your terminal.
2.	Install Node.js and verify with node --version and npm --version.
3.	Install Git and verify with git --version.
4.	Choose an Editor: VS Code is a great free choice. Install it and add recommended extensions like Python, ESLint, Prettier, and React snippets.
Step 2: Initialize Version Control
1.	Create a new folder for your project: mkdir smart-home-project && cd smart-home-project
2.	Run git init to initialize a Git repository.
3.	Create a GitHub repository (private or public) via GitHub’s web interface.
4.	Add the remote to your local repo: git remote add origin <your-github-repo-url>.
5.	Always commit changes frequently: git add . && git commit -m "Initial commit".
Step 3: Set Up the Backend (Django)
1.	Install Django: pip install django djangorestframework
2.	Create a Django project: django-admin startproject backend
3.	Move into the backend directory: cd backend
4.	Run initial server: python manage.py runserver.
Visit http://127.0.0.1:8000/ to see the default Django page.
5.	Initialize a Django app for your API, e.g.:
python manage.py startapp api
6.	In backend/settings.py, add rest_framework and api to INSTALLED_APPS.
7.	Create models that represent devices, energy usage data, users, and homes. For example, a Device model with fields like name, type, status (on/off), and home.
8.	Run migrations: python manage.py makemigrations && python manage.py migrate.
9.	Set up Django REST Framework serializers and views to return JSON data.
o	Create serializers.py in api to define how models turn into JSON.
o	Create views.py to provide endpoints (CRUD) for devices and homes.
10.	Define URL routes in backend/urls.py that point to api/views.py endpoints.
At this stage, you should have a working backend that returns JSON data for devices, homes, and usage stats. Test endpoints with curl or a tool like Postman or Insomnia.
Step 4: Implement Authentication
1.	Use Django’s built-in User model or django-allauth or djangorestframework-simplejwt for JWT-based auth.
2.	Set up /register, /login, /logout endpoints to manage user accounts.
3.	Protect certain endpoints so that only authenticated users (e.g., homeowners or privileged users) can add/remove devices.
After this, you have a secured backend. Test creating users, logging in, and verifying tokens.
Step 5: Add Some Test Data and Logic
1.	Create a management command or just use the Django admin interface (run python manage.py createsuperuser) to log in at http://127.0.0.1:8000/admin/ and add devices, homes, etc.
2.	Implement logic in views to:
o	Return energy usage data over time (this can be mocked or randomly generated if you don’t have real sensors).
o	Update device status (e.g., toggle device on/off).
Step 6: Set Up the Frontend (React)
1.	Open a new terminal window at the project root (not inside backend folder).
2.	Create a React app: npx create-react-app frontend
3.	cd frontend and run npm start to see a basic React page at http://localhost:3000.
4.	Inside React, you’ll have src/ folder. Create components:
o	Login.js: A login form that sends credentials to the backend and stores JWT token in localStorage.
o	Dashboard.js: Fetch devices and energy data from the backend and display in charts and lists.
5.	Install Axios: npm install axios to make HTTP requests easily.
6.	Set up Axios instances with default headers for auth tokens.
7.	Call your Django API endpoints from React to display device info, energy usage charts (consider chart.js or recharts for free chart libraries).
Now your frontend can communicate with the backend. When you open http://localhost:3000, you should see your React UI.
Step 7: Implement Routing and Pages
1.	Install React Router: npm install react-router-dom
2.	Create routes for:
o	/login
o	/dashboard
o	/devices
o	/analytics
3.	If the user is not logged in, redirect to /login. Otherwise, show the dashboard with devices and data.
Step 8: Polish the UI/UX
•	Use a free UI library like Material-UI (MUI): npm install @mui/material @emotion/react @emotion/styled
•	Add some styling to make dashboards look nicer, add navigation menus, etc.
•	Ensure forms have basic validation.
Step 9: Testing Your Code
•	Backend Tests (Django):
o	Create tests in api/tests.py.
o	Run python manage.py test.
•	Frontend Tests (React):
o	Use Jest (built-in with create-react-app).
o	Add test files like Login.test.js.
o	Run npm test.
By adding tests, you ensure your system works as intended and can catch regressions early.
Step 10: Continuous Integration (Optional but Good Practice)
•	Push your code to GitHub.
•	Set up GitHub Actions for CI to run tests automatically on each push (GitHub Actions is free).
•	A simple .github/workflows/ci.yml can run python manage.py test and npm test.
Step 11: Prepare for Deployment
1.	For Backend:
o	Use a free service like Render.com or Railway.app.
o	Push code to GitHub, link your Render account, select the Python environment, and deploy.
o	On Render, add environment variables for SECRET_KEY and any DB credentials if needed.
o	You might switch to a free Postgres database provided by Render or Railway.
2.	For Frontend:
o	Use Netlify or Vercel (both have free tiers).
o	Connect to your GitHub repo’s frontend folder.
o	Deploy. Netlify/Vercel will auto-run npm run build and serve your React app.
3.	Update API URLs in React to point to the deployed backend URL instead of localhost.
4.	After deployment, test everything again in production environment.
Step 12: Add Advanced Features if Needed
•	Add real-time updates using WebSockets or Django Channels (optional).
•	Add push notifications, email alerts, or schedule reports.
•	Implement more detailed analytics or gamification (like the virtual garden feature mentioned before).
Step 13: Documentation and Maintenance
•	Write a README.md in your GitHub repo describing how to run and use your system.
•	Add comments to your code, especially in complex parts.
•	Regularly update dependencies and fix any vulnerabilities (run npm audit fix for frontend, pip list --outdated for backend).
•	Keep refining the UI based on feedback.
________________________________________
Free Tools Summary
•	Editor: VS Code (Free)
•	Backend: Django, Django REST Framework (Free, open source)
•	Frontend: React (Free, open source)
•	Version Control: Git + GitHub (Free)
•	Testing Tools: Built-in testing (no extra cost), Jest for React, unittest/pytest for Django
•	Deployment: Netlify/Vercel (frontend), Render/Railway (backend) free tiers available
•	Package Managers: npm (Node.js default), pip (Python default)
•	UI Libraries: Material-UI (free), Chart.js (free)
•	API Testing: Postman or Insomnia (free)
•	CI/CD: GitHub Actions (Free for public/private repos within limits)
________________________________________
Final Notes
•	Start small. Aim to get a basic API and a basic React page working first.
•	Gradually add features: authentication, device control, data visualization.
•	Always commit and push your code frequently.
•	Use the free tiers of hosting platforms for learning and demonstration purposes.
•	Don’t worry if you don’t get it perfect at first. Iteration is key.
