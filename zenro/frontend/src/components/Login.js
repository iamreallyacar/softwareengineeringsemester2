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
            {error && <p>{error}</p>}
            <form onSubmit={handleSubmit}>
                {/* The form fields handle changes via state */}
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
            </form>
            <p>Don't have an account? <Link to="/create-account">Create one here</Link></p>
        </div>
    );
}

export default Login;