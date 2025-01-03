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
            // After a timeout of 2 seconds, navigate to the home page
            setTimeout(() => {
                navigate("/");
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
            {/* Display success message if account creation is successful */}
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
                {/* Display error message if account creation fails */}
                {error && <p>{error}</p>}
            </form>
            <p>Already have an account? <Link to="/">Log in</Link></p>
        </div>
    );
}

// Renders a form for username, email, and password inputs
export default CreateAccount;