import React, { useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // handleSubmit sends the username and password to the backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!username || !password) {
            setError("Please enter both username and password.");
            return;
        }
        try {
            const response = await api.post("/token/", { username, password });
            console.log("Login Successful:", response.data);
            // On success, tokens are stored in local storage, then redirect
            localStorage.setItem("accessToken", response.data.access);
            localStorage.setItem("userId", response.data.userId);
            window.location.href = "/smart-homes";
        } catch (error) {
            console.error("Login Failed:", error);
            setError("Invalid credentials or server error.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-title">Login</h1>
                    <p className="login-subtitle">Please enter your credentials</p>
                </div>
                {error && <p className="error">{error}</p>}
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="text"
                            className="login-input"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            className="login-input"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button className="login-button" type="submit">
                        <span>Login</span>
                    </button>
                </form>
                <div className="login-footer">
                    <Link to="/forgot-password" className="forgot-password">Forgot Password?</Link>
                    <div className="signup-prompt">
                        Don't have an account? <Link to="/create-account" className="signup-link">Sign up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;