import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

const CreateAccount = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const history = useHistory();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!username || !email || !password) {
            setError('All fields are required.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/create-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Account created successfully!');
                setUsername('');
                setEmail('');
                setPassword('');
                setTimeout(() => {
                    history.push('/');
                }, 2000); // Redirect to login after 2 seconds
            } else {
                setError(data.message + (data.error ? `: ${data.error}` : ''));
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div className="create-account-container">
            <h1>Create Account</h1>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Create Account</button>
            </form>
        </div>
    );
};

export default CreateAccount;