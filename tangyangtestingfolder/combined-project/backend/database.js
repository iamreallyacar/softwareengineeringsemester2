const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, './src/user_login.db');
let _db = null;

const initDb = async () => {
    if (_db) return _db;
    
    return new Promise((resolve, reject) => {
        _db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                console.error('Database connection error:', err);
                reject(err);
            }
            console.log('Connected to database');
            resolve(_db);
        });
    });
};

const getDb = () => {
    if (!_db) {
        throw new Error('Database not initialized');
    }
    return _db;
};

const closeDb = () => {
    if (_db) {
        _db.close((err) => {
            if (err) console.error('Error closing database:', err);
            else console.log('Database connection closed');
        });
        _db = null;
    }
};

module.exports = { initDb, getDb, closeDb };
