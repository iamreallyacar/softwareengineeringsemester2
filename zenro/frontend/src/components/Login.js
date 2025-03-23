import React, { useState } from "react";
import api from "../api";
import { Link, useNavigate } from "react-router-dom";
import LoadingElement from "./LoadingElement.js";
import Background from "./Background.js";

const Login = ({ setIsAuthenticated }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // handleSubmit sends the username and password to the backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!username || !password) {
            setLoading(false);
            setError("Please enter both username and password.");
            return;
        }
        try {
            const response = await api.post("/token/", { username, password });
            console.log("Login Successful:", response.data);
            // On success, tokens are stored in local storage, then redirect
            localStorage.setItem("accessToken", response.data.access);
            localStorage.setItem("userId", response.data.userId);
            setIsAuthenticated(true);
            navigate("/smart-homes");
        } catch (error) {
            setLoading(false);
            console.error("Login Failed:", error);
            setError("Invalid credentials or server error.");
        }
    };

    return (
        loading ? (
            <LoadingElement /> // Show loader while fetching data
        ) : (
            <div className="login-page">
                <Background showLogo={true} />
                <div className="login-container-circle">
                    <div className="login-content-circle">
                        <h1 className="login-title-circle">Login</h1>
                        {error && <p className="login-error">{error}</p>}
                        <form className="login-form" onSubmit={handleSubmit}>
                            <div className="input-group-long">
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="input-group-long">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Link to="/recovery-page" className="forgot-password">Forgot Password?</Link>
                            <button className="login-button" type="submit">
                                <span>Login</span>
                            </button>
                        </form>
                        <div className="login-footer">
                            <div className="signup-prompt-circle">
                                Don't have an account? <Link to="/create-account" className="login-signup-link">Sign up</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    );
};


export default Login;