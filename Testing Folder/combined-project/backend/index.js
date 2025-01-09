const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { initDb, getDb, closeDb } = require('./database');

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors());

// Initialize database before starting server
async function startServer() {
    try {
        await initDb();
        
        // Login endpoint
        app.post('/api/login', (req, res) => {
            const { username, password } = req.body;
            const db = getDb();
            
            db.get(`SELECT id, username, password FROM users WHERE username = ?`, 
                [username], 
                (err, row) => {
                    if (err) return res.status(500).json({ message: 'Internal server error' });
                    if (!row) return res.status(401).json({ message: 'Invalid credentials' });
                    if (password === row.password) {
                        res.status(200).json({ message: 'Login successful', userId: row.id });
                    } else {
                        res.status(401).json({ message: 'Invalid credentials' });
                    }
                });
        });

        // Create account endpoint
        app.post('/api/create-account', (req, res) => {
            const { username, email, password } = req.body;
            const db = getDb();
            
            db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, 
                [username, email, password], 
                function(err) {
                    if (err) return res.status(500).json({ message: 'Internal server error', error: err.message });
                    res.status(201).json({ message: 'Account created successfully' });
                });
        });

        // Smart homes endpoints
        app.post('/api/smart-homes', (req, res) => {
            const { name, creatorId } = req.body;
            const db = getDb();
            
            db.run(`INSERT INTO smart_homes (name, creator_id) VALUES (?, ?)`, 
                [name, creatorId], 
                function(err) {
                    if (err) return res.status(500).json({ message: 'Internal server error' });
                    res.status(201).json({ message: 'Smart home created successfully', homeId: this.lastID });
                });
        });

        app.get('/api/smart-homes', (req, res) => {
            const { userId } = req.query;
            const db = getDb();
            
            db.all(`SELECT * FROM smart_homes WHERE creator_id = ?`, 
                [userId], 
                (err, rows) => {
                    if (err) return res.status(500).json({ message: 'Internal server error' });
                    res.status(200).json(rows);
                });
        });

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });

    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    closeDb();
    process.exit(0);
});

startServer();