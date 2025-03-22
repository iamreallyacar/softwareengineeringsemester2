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
    const [first_name, setFirstName] = useState("");
    const [last_name, setLastName] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [gender, setGender] = useState("");
    const [phone_number, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Field-specific error states
    const [usernameError, setUsernameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [generalError, setGeneralError] = useState("");
    const [success, setSuccess] = useState("");
    
    const navigate = useNavigate();

    // Clear field errors when user edits the field
    const clearFieldError = (field) => {
        switch(field) {
            case 'username':
                setUsernameError("");
                break;
            case 'email':
                setEmailError("");
                break;
            case 'password':
                setPasswordError("");
                break;
            default:
                break;
        }
        setGeneralError("");
    };

    // Validate required fields
    const validateForm = () => {
        let isValid = true;
        
        // Clear previous errors
        setUsernameError("");
        setEmailError("");
        setPasswordError("");
        setGeneralError("");
        
        // Check username
        if (!username.trim()) {
            setUsernameError("Username is required");
            isValid = false;
        }
        
        // Check email
        if (!email.trim()) {
            setEmailError("Email is required");
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError("Please enter a valid email address");
            isValid = false;
        }
        
        // Check password
        if (!password) {
            setPasswordError("Password is required");
            isValid = false;
        } else if (password.length < 8) {
            setPasswordError("Password must be at least 8 characters");
            isValid = false;
        }
        
        return isValid;
    };

    // Update the handleSubmit function with proper validation
    const handleSubmit = async (e) => {
        // Prevent the default form submission behavior
        e.preventDefault();
        
        // Basic form validation (required fields, etc.)
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);

        try {
            // First check both username and email uniqueness in one step
            let hasUniqueError = false;
            
            // Check username uniqueness
            try {
                const usernameCheckResponse = await api.get(`/users/?username=${encodeURIComponent(username)}`);
                console.log("Username check response:", usernameCheckResponse);
                
                // If the exact username exists, show error
                if (Array.isArray(usernameCheckResponse.data) && 
                    usernameCheckResponse.data.some(user => user.username.toLowerCase() === username.toLowerCase())) {
                    setUsernameError("This username is already taken. Please choose another.");
                    hasUniqueError = true;
                }
            } catch (usernameErr) {
                console.log("Username check error:", usernameErr);
                // Continue anyway - if there's an issue, backend validation will catch it
            }
            
            // Check email uniqueness (separate from username check)
            try {
                const emailCheckResponse = await api.get(`/users/?email=${encodeURIComponent(email)}`);
                console.log("Email check response:", emailCheckResponse);
                
                // If the exact email exists, show error - check case insensitive
                if (Array.isArray(emailCheckResponse.data) && 
                    emailCheckResponse.data.some(user => user.email.toLowerCase() === email.toLowerCase())) {
                    setEmailError("This email is already registered. Please use a different email address.");
                    hasUniqueError = true;
                }
            } catch (emailErr) {
                console.log("Email check error:", emailErr);
                // Continue anyway - if there's an issue, backend validation will catch it
            }
            
            // If either username or email is already in use, stop submission
            if (hasUniqueError) {
                setLoading(false);
                return;
            }
            
            // If we got here, both username and email are unique
            // Prepare profile data, only including non-empty fields
            const profileData = {};
            if (birthdate) profileData.date_of_birth = birthdate;
            if (gender) profileData.gender = gender;
            if (phone_number) profileData.phone_number = phone_number;
            
            // Build request body with only filled fields
            const requestData = {
                username,
                email,
                password,
            };
            
            if (first_name) requestData.first_name = first_name;
            if (last_name) requestData.last_name = last_name;
            
            // Only include profile if there are values
            if (Object.keys(profileData).length > 0) {
                requestData.profile = profileData;
            }
            
            // Send a POST request to the API to create a new account
            const response = await api.post("/register/", requestData);
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
            
            // After a timeout of 3 seconds, navigate to smart homes page
            setTimeout(() => {
                setLoading(false);
                navigate("/smart-homes");
            }, 3000);
        } catch (error) {
            console.error("Account Creation Failed:", error);
            setLoading(false);
            
            // Handle errors from the API response
            if (error.response && error.response.data) {
                console.log("Error data:", error.response.data);
                
                // Handle field-specific errors from backend
                if (error.response.data.username) {
                    setUsernameError(Array.isArray(error.response.data.username) 
                        ? error.response.data.username[0] 
                        : error.response.data.username);
                }
                
                if (error.response.data.email) {
                    setEmailError(Array.isArray(error.response.data.email) 
                        ? error.response.data.email[0] 
                        : error.response.data.email);
                }
                
                if (error.response.data.password) {
                    setPasswordError(Array.isArray(error.response.data.password) 
                        ? error.response.data.password[0] 
                        : error.response.data.password);
                }
                
                // Handle non-field errors
                if (error.response.data.non_field_errors) {
                    setGeneralError(Array.isArray(error.response.data.non_field_errors)
                        ? error.response.data.non_field_errors[0]
                        : error.response.data.non_field_errors);
                }
                // Handle other error types
                else if (!error.response.data.username && 
                        !error.response.data.email && 
                        !error.response.data.password &&
                        !error.response.data.non_field_errors) {
                    const errorMessage = error.response.data.detail ||
                        (typeof error.response.data === "string" 
                            ? error.response.data 
                            : "Error creating account. Please try again.");
                    setGeneralError(errorMessage);
                }
            } else {
                setGeneralError("Network error. Please try again later.");
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
                        {success && <p className="ca-success-message">{success}</p>}
                        {generalError && <p className="ca-error-message">{generalError}</p>}
                        
                        <form className="ca-login-form" onSubmit={handleSubmit}>
                            {/* Username - Required */}
                            <div className="ca-input-group-long">
                                <div className="ca-input-field">
                                    <input
                                        type="text"
                                        placeholder="Username *"
                                        value={username}
                                        onChange={(e) => {
                                            setUsername(e.target.value);
                                            clearFieldError('username');
                                        }}
                                        className={usernameError ? "input-error" : ""}
                                    />
                                    {usernameError && <p className="field-error">{usernameError}</p>}
                                </div>
                            </div>

                            {/* First name and DOB - Optional */}
                            <div className="ca-input-group-short">
                                <input
                                    type="text"
                                    placeholder="First name"
                                    value={first_name}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                                <input
                                    type="date"
                                    placeholder="Date of Birth"
                                    value={birthdate}
                                    onChange={(e) => setBirthdate(e.target.value)}
                                />
                            </div>

                            {/* Last name and gender - Optional */}
                            <div className="ca-input-group-short">
                                <input
                                    type="text"
                                    placeholder="Last name"
                                    value={last_name}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                                <select 
                                    value={gender} 
                                    onChange={(e) => setGender(e.target.value)}
                                >
                                    <option value="" disabled hidden>Gender</option>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                    <option value="O">Rather not say</option>
                                </select>
                            </div>
                                
                            {/* Email - Required */}
                            <div className="ca-input-group-long">
                                <div className="ca-input-field">
                                    <input
                                        type="email"
                                        placeholder="Email *"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            clearFieldError('email');
                                        }}
                                        className={emailError ? "input-error" : ""}
                                    />
                                    {emailError && <p className="field-error">{emailError}</p>}
                                </div>
                            </div>

                            {/* Phone number - Optional */}
                            <div className="ca-input-group-long">
                                <input
                                    type="tel"
                                    placeholder="Phone Number"
                                    value={phone_number}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                            </div>

                            {/* Password - Required */}
                            <div className="ca-input-group-long">
                                <div className="ca-input-field">
                                    <input
                                        type="password"
                                        placeholder="Password *"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            clearFieldError('password');
                                        }}
                                        className={passwordError ? "input-error" : ""}
                                    />
                                    {passwordError && <p className="field-error">{passwordError}</p>}
                                </div>
                            </div>
                            
                            {/* Required fields notice */}
                            <div className="required-fields-notice">
                                * Required fields
                            </div>

                            <button className="ca-login-button" type="submit">
                                <span>Create Account</span>
                            </button>

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