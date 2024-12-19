const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors());

let db = new sqlite3.Database('./src/user_login.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the user_login database.');
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).json({ message: 'Internal server error' });
        } else if (row) {
            console.log('User found:', row);
            if (password === row.password) {
                console.log('Password match:', true);
                res.status(200).json({ message: 'Login successful' });
            } else {
                console.log('Password match:', false);
                res.status(401).json({ message: 'Invalid credentials' });
            }
        } else {
            console.log('User not found');
            res.status(401).json({ message: 'Invalid credentials' });
        }
    });
});

app.post('/api/create-account', (req, res) => {
    const { username, email, password } = req.body;
    console.log('Create account attempt:', { username, email });

    db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, [username, email, password], function(err) {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).json({ message: 'Internal server error' });
        } else {
            console.log('User created with ID:', this.lastID);
            res.status(201).json({ message: 'Account created successfully' });
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

/*
// Import the sqlite3 library and enable verbose mode for debugging
const sqlite3 = require('sqlite3').verbose();
// Import the express library to create a web server
const express = require('express');
// Import the body-parser library to parse JSON request bodies
const bodyParser = require('body-parser');
// Import the cors library to enable Cross-Origin Resource Sharing
const cors = require('cors');

// Create an instance of an Express application
const app = express();
// Define the port number the server will listen on
const port = 5000;

// Use body-parser middleware to parse JSON request bodies
app.use(bodyParser.json());
// Use cors middleware to enable CORS
app.use(cors());

// Open a connection to the SQLite database
let db = new sqlite3.Database('./src/user_login.db', (err) => {
    if (err) {
        // Log an error message if the connection fails
        console.error(err.message);
    }
    // Log a success message if the connection is successful
    console.log('Connected to the user_login database.');
});

// Define a route to handle login requests
app.post('/api/login', (req, res) => {
    // Extract username and password from the request body
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });

    // Query the database for a user with the provided username
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) {
            // Log an error message and send a 500 response if there is a database error
            console.error('Database error:', err.message);
            res.status(500).json({ message: 'Internal server error' });
        } else if (row) {
            // Log the found user and check if the provided password matches the stored password
            console.log('User found:', row);
            if (password === row.password) {
                // Log a success message and send a 200 response if the passwords match
                console.log('Password match:', true);
                res.status(200).json({ message: 'Login successful' });
            } else {
                // Log a failure message and send a 401 response if the passwords do not match
                console.log('Password match:', false);
                res.status(401).json({ message: 'Invalid credentials' });
            }
        } else {
            // Log a failure message and send a 401 response if the user is not found
            console.log('User not found');
            res.status(401).json({ message: 'Invalid credentials' });
        }
    });
});

// Define a route to handle account creation requests
app.post('/api/create-account', (req, res) => {
    // Extract username, email, and password from the request body
    const { username, email, password } = req.body;
    console.log('Create account attempt:', { username, email });

    // Insert a new user into the database
    db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, [username, email, password], function(err) {
        if (err) {
            // Log an error message and send a 500 response if there is a database error
            console.error('Database error:', err.message);
            res.status(500).json({ message: 'Internal server error' });
        } else {
            // Log a success message and send a 201 response if the account is created successfully
            console.log('User created with ID:', this.lastID);
            res.status(201).json({ message: 'Account created successfully' });
        }
    });
});

// Start the server and listen on the defined port
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
*/