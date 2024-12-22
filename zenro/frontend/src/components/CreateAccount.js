import React, { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";

function CreateAccount() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    // handleSubmit posts new user details to create an account
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await api.post("/register/", {
                username: username,
                email: email,
                password: password
            });
            console.log("Account Created Successfully:", response.data);
            // On success, set a success message and navigate after a timeout
            setSuccess("Account created successfully!");
            setTimeout(() => {
                navigate("/");
            }, 2000);
        } catch (error) {
            console.error("Account Creation Failed:", error);
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
            {success && <p>{success}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Create Account</button>
                {error && <p>{error}</p>}
            </form>
            <p>Already have an account? <Link to="/">Log in</Link></p>
        </div>
    );
}

// Renders a form for username, email, and password inputs
export default CreateAccount;