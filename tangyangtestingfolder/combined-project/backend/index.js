// Import necessary modules
const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Create an Express application
const app = express();
const port = 5000;

// Middleware setup
app.use(bodyParser.json());
app.use(cors());

// Connect to the SQLite database
let db = new sqlite3.Database('./src/user_login.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the user_login database.');
});

// Login endpoint
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
                res.status(200).json({ message: 'Login successful', userId: row.id });
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

// Create account endpoint
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

// Create smart home endpoint
app.post('/api/smart-homes', (req, res) => {
    const { name, creatorId } = req.body;
    console.log('Create smart home attempt:', { name, creatorId });

    db.run(`INSERT INTO smart_homes (name, creator_id) VALUES (?, ?)`, [name, creatorId], function(err) {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).json({ message: 'Internal server error' });
        } else {
            console.log('Smart home created with ID:', this.lastID);
            res.status(201).json({ message: 'Smart home created successfully', homeId: this.lastID });
        }
    });
});

// Get smart homes endpoint
app.get('/api/smart-homes', (req, res) => {
    const { userId } = req.query;
    console.log('Get smart homes for user:', userId);

    db.all(`SELECT * FROM smart_homes WHERE creator_id = ?`, [userId], (err, rows) => {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).json({ message: 'Internal server error' });
        } else {
            console.log('Smart homes found:', rows);
            res.status(200).json(rows);
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});