const form = document.getElementById('create-account-form');

form.addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (validateForm(username, email, password)) {
        try {
            const response = await fetch('http://localhost:5000/api/create-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Account created successfully');
                window.location.href = 'index.html'; // Redirect to login page
            } else {
                alert('Account creation failed: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        alert('Please enter valid username, email, and password.');
    }
});

function validateForm(username, email, password) {
    return username.trim() !== '' && email.trim() !== '' && password.trim() !== '';
}