import React, { useState } from "react";
import api from "../api";
import { Link, useNavigate } from "react-router-dom";
import LoadingElement from "./LoadingElement.js";
import Background from "./Background.js";
import { useEffect } from "react";


function CreateAccount({ setIsAuthenticated }) {
    // State variables to store user input and feedback messages
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [first_name, setFirstName] = useState("");
    const [last_name, setLastName] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [gender, setGender] = useState("");
    const [phone_number, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();


    // handleSubmit posts new user details to create an account
    const handleSubmit = async (e) => {
        // Prevent the default form submission behavior
        e.preventDefault();
        // Clear any previous error messages
        setError("");
        setLoading(true);

        try {
            // Send a POST request to the API to create a new account
            const response = await api.post("/register/", {
                username,
                email,
                password,
                first_name,
                last_name,
                profile: {
                    date_of_birth: birthdate,
                    gender,
                    phone_number,
                }
            });
            console.log("Account Created Successfully:", response.data);
            // On success, set a success message to be displayed to the user
            setSuccess("Account created successfully!");
            
            // Logs the user in automatically
            const loginResponse = await api.post("/token/", {username, password});
            console.log("Login Successful:", loginResponse.data);
            // Tokens are stored in local storage
            localStorage.setItem("accessToken", loginResponse.data.access);
            localStorage.setItem("userId", loginResponse.data.userId);
            setIsAuthenticated(true);
            // After a timeout of 2 seconds, navigate to smart homes page
            setTimeout(() => {
                setLoading(false);
                navigate("/smart-homes");
            }, 3000);
        } catch (error) {
            console.error("Account Creation Failed:", error);
            setLoading(false);
            // Handle errors from the API response
            if (error.response && error.response.data) {
                try {
                    const errorMessage = error.response.data.detail ||
                    Object.values(error.response.data)[0] ||
                    (typeof error.response.data === "object" 
                        ? Object.values(error.response.data)[0] 
                        : "Error creating account. Please try again.");
                    setError(errorMessage);
                } catch {
                    setError("Unexpected error occurred.");
                }
                
            } 
        }
    };

    return (
        loading ? (
            <LoadingElement /> // Show loader while fetching data
        ) : (
            <div className="createAccount-page">
                <Background showLogo={true} />
                <div className="ca-login-container">
                    <div className="ca-login-content">
                        <p className="ca-login-title">Create Account</p>
                        {/* Display success message if account creation is successful */}
                        {success && <p className="ca-error">{success}</p>}
                        <form className="ca-login-form" onSubmit={handleSubmit}>

                            {/* Username */}
                            <div className="ca-input-group-long">
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>

                            {/* First name and DOB */}
                            <div className="ca-input-group-short">
                                <input
                                    type="text"
                                    placeholder="First name"
                                    value={first_name}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                />
                                <input
                                    type="date"
                                    placeholder="Date of Birth"
                                    value={birthdate}
                                    onChange={(e) => setBirthdate(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Last name and gender */}
                            <div className="ca-input-group-short">
                                <input
                                    type="text"
                                    placeholder="Last name"
                                    value={last_name}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                />
                                <select 
                                    value={gender} 
                                    onChange={(e) => setGender(e.target.value)} 
                                    required
                                >
                                    <option value="" disabled hidden>Gender</option>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                    <option value="O">Rather not say</option>
                                </select>
                                </div>
                                
                                {/* Email */}
                                <div className="ca-input-group-long">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                            </div>

                            {/* Phone number */}
                            <div className="ca-input-group-long">
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                value={phone_number}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                            />
                            </div>

                            {/* Password */}
                            <div className="ca-input-group-long">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button className="ca-login-button" type="submit">
                                <span>Create Account</span>
                            </button>
                            {/* Display error message if account creation fails */}
                            {error && <p className="ca-error">{error}</p>}

                            <div className="ca-login-footer">
                                <div className="ca-signup-prompt">
                                    Already have an account? <Link to="/login" className="ca-login-signup-link"> Log in </Link>
                                </div>
                            </div>
                        </form>
                    </div>   
                </div>
            </div>
        )
    );
}

export default CreateAccount;