CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

/*
    SELECT * FROM users;
    DELETE FROm users WHERE id = 1;

    -- Create a table named 'users' if it does not already exist
    CREATE TABLE IF NOT EXISTS users (
        -- Define a column 'id' which is an integer and will auto-increment with each new record
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        -- Define a column 'username' which is text, must be unique, and cannot be null
        username TEXT NOT NULL UNIQUE,
        -- Define a column 'email' which is text, must be unique, and cannot be null
        email TEXT NOT NULL UNIQUE,
        -- Define a column 'password' which is text and cannot be null
        password TEXT NOT NULL,
        -- Define a column 'created_at' which will store the timestamp of when the record was created
        -- It defaults to the current timestamp when the record is created
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        -- Define a column 'updated_at' which will store the timestamp of when the record was last updated
        -- It defaults to the current timestamp when the record is created
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create a trigger that will automatically update the 'updated_at' column
    -- whenever a record in the 'users' table is updated
    CREATE TRIGGER update_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        -- Update the 'updated_at' column to the current timestamp for the record being updated
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
*/