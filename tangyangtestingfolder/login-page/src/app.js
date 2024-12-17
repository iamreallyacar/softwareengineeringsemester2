// Get the login form element by its ID
const form = document.getElementById('login-form');

// Add an event listener to handle form submission
form.addEventListener('submit', function(event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Get the values of the username and password input fields
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Validate the form inputs
    if (validateForm(username, password)) {
        // If valid, log the username and password (replace this with actual login logic)
        console.log('Logging in with', username, password);
    } else {
        // If invalid, show an alert message
        alert('Please enter valid username and password.');
    }
});

// Function to validate the form inputs
function validateForm(username, password) {
    // Check if both username and password are not empty after trimming whitespace
    return username.trim() !== '' && password.trim() !== '';
}