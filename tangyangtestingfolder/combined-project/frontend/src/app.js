const form = document.getElementById('login-form');

form.addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (validateForm(username, password)) {
        console.log(username);
        console.log(password);
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Login successful', data);
                alert('Login successful');
            } else {
                alert('Login failed: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        alert('Please enter valid username and password.');
    }
});

function validateForm(username, password) {
    return username.trim() !== '' && password.trim() !== '';
}

function navigateToCreateAccount() {
    window.location.href = 'create-account.html';
}

const createAccountLink = document.getElementById('create-account-link');
if (createAccountLink) {
    createAccountLink.addEventListener('click', navigateToCreateAccount);
}

/*
// Get the login form element by its ID
const form = document.getElementById('login-form');

// Add an event listener to handle form submission
form.addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Check if the form is valid by calling validateForm with username and password
    if (validateForm(username, password)) {
        console.log(username);
        console.log(password);
        try {
            // Make an asynchronous POST request to the '/api/login' endpoint
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            // Parse the JSON response from the server
            const data = await response.json();

            // Check if the response status is OK
            if (response.ok) {
                console.log('Login successful', data);
                alert('Login successful');
            } else {
                alert('Login failed: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        alert('Please enter valid username and password.');
    }
});

// Function to validate the form inputs
function validateForm(username, password) {
    return username.trim() !== '' && password.trim() !== '';
}

// Function to navigate to the create account page
function navigateToCreateAccount() {
    window.location.href = 'create-account.html';
}

// Add an event listener for the create account link
const createAccountLink = document.getElementById('create-account-link');
if (createAccountLink) {
    createAccountLink.addEventListener('click', navigateToCreateAccount);
}
*/