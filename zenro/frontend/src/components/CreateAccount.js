import React, { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";

function CreateAccount() {
    // State variables to store user input and feedback messages
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    // handleSubmit posts new user details to create an account
    const handleSubmit = async (e) => {
        // Prevent the default form submission behavior
        e.preventDefault();
        // Clear any previous error messages
        setError("");
        try {
            // Send a POST request to the API to create a new account
            const response = await api.post("/register/", {
                username: username,
                email: email,
                password: password
            });
            console.log("Account Created Successfully:", response.data);
            // On success, set a success message to be displayed to the user
            setSuccess("Account created successfully!");
            // After a timeout of 2 seconds, navigate to the login page
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (error) {
            console.error("Account Creation Failed:", error);
            // Handle errors from the API response
            if (error.response) {
                const errorMessage = error.response.data.detail || 
                                   Object.values(error.response.data)[0] ||
                                   "Error creating account. Please try again.";
                setError(errorMessage);
            } else {
                setError("Error creating account. Please try again.");
            }
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-title">Create Account</h1>
                    <p className="login-subtitle">Please enter your details</p>
                </div>
                {/* Display success message if account creation is successful */}
                {success && <p className="error">{success}</p>}
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
                            type="email"
                            className="login-input"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                        <span>Create Account</span>
                    </button>
                    {/* Display error message if account creation fails */}
                    {error && <p className="error">{error}</p>}
                </form>
                <div className="login-footer">
                    <div className="signup-prompt">
                        Already have an account? <Link to="/" className="signup-link">Log in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateAccount;