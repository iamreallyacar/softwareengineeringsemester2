import React, { useState } from "react";
import api from "../api";
import { Link, useNavigate } from "react-router-dom";
import LoadingElement from "./LoadingElement.js";

function CreateAccount() {
    // State variables to store user input and feedback messages
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [gender, setGender] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
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
                username: username,
                email: email,
                password: password
            });
            console.log("Account Created Successfully:", response.data);
            // On success, set a success message to be displayed to the user
            setSuccess("Account created successfully!");
            
            // Logs the user in automatically
            const loginResponse = await api.post("/token/", { firstName, lastName, username, birthdate, gender, email, phoneNumber, password});
            console.log("Login Successful:", loginResponse.data);
            // Tokens are stored in local storage
            localStorage.setItem("accessToken", response.data.access);
            localStorage.setItem("userId", response.data.userId);
            // After a timeout of 2 seconds, navigate to smart homes page
            setTimeout(() => {
                setLoading(false);
                navigate("/smart-homes");
            }, 3000);
        } catch (error) {
            console.error("Account Creation Failed:", error);
            setLoading(false);
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
        loading ? (
            <LoadingElement /> // Show loader while fetching data
        ) : (
            <div className="login-container">
                <div className="login-content">
                    <p className="login-title">Create Account</p>
                    {/* Display success message if account creation is successful */}
                    {success && <p className="error">{success}</p>}
                    <form className="login-form" onSubmit={handleSubmit}>

                        {/* Username */}
                        <div className="input-group-long">
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        {/* First name and DOB */}
                        <div className="input-group-short">
                            <input
                                type="text"
                                placeholder="First name"
                                value={firstName}
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
                        <div className="input-group-short">
                            <input
                                type="text"
                                placeholder="Last name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                            <select 
                                value={gender} 
                                onChange={(e) => setGender(e.target.value)} 
                                required
                            >
                                <option value="" disabled selected hidden>Gender</option>
                                <option value="m">Male</option>
                                <option value="f">Female</option>
                                <option value="0">Rather not say</option>
                            </select>
                            </div>
                            
                            {/* Email */}
                            <div className="input-group-long">
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                        </div>

                        {/* Phone number */}
                        <div className="input-group-long">
                        <input
                            type="tel"
                            placeholder="Phone Number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                        />
                        </div>

                        {/* Password */}
                        <div className="input-group-long">
                            <input
                                type="password"
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

                        <div className="login-footer">
                            <div className="signup-prompt">
                                Already have an account? <Link to="/login" className="signup-link"> Log in </Link>
                            </div>
                        </div>
                    </form>
                </div>   
            </div>
        )
    );
}

export default CreateAccount;