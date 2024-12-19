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
                localStorage.setItem('userId', data.userId);
                alert('Login successful');
                window.location.href = 'smart-homes.html';
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
