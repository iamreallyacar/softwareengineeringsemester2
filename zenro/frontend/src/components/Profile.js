import React, { useEffect, useState } from "react";
import api from "../api";
import "../css/index.css";
import { Link } from "react-router-dom";
import LoadingElement from "./LoadingElement.js";
import Background from "./Background.js";
import { Home } from "lucide-react";

function ProfilePage() {
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [ownedHomes, setOwnedHomes] = useState([]);
    const [passwordInputs, setPasswordInputs] = useState({});
    const [passwordErrors, setPasswordErrors] = useState({});

    useEffect(() => {
        fetchProfile();
        fetchOwnedHomes();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get("/user/current/");
            console.log("User data:", response.data);
            setUserData(response.data);
        } catch (error) {
            console.error("Profile fetch error:", error.response?.data || error.message);
            setError("Failed to load profile information.");
        } finally {
            setLoading(false);
        }
    };

    const fetchOwnedHomes = async () => {
        try {
            const response = await api.get("/smarthomes/");
            const owned = response.data.filter(home => home.is_creator === true);
            setOwnedHomes(owned);
        } catch (error) {
            console.error("Owned homes fetch error:", error.response?.data || error.message);
            setError("Failed to load owned homes information.");
        }
    };

    const handlePasswordChange = (homeId, newPassword) => {
        setPasswordInputs(prev => ({ ...prev, [homeId]: newPassword }));
        if (passwordErrors[homeId]) {
            setPasswordErrors(prev => ({ ...prev, [homeId]: "" }));
        }
    };

    const updatePassword = async (homeId) => {
        const newPassword = passwordInputs[homeId];
        if (!newPassword) {
            setPasswordErrors(prev => ({ ...prev, [homeId]: "Password cannot be empty" }));
            return;
        }
        try {
            await api.patch(`/smarthomes/${homeId}/`, { join_password: newPassword });
            setOwnedHomes(prev => 
                prev.map(home => 
                    home.id === homeId ? { ...home, join_password: newPassword } : home
                )
            );
            setPasswordInputs(prev => ({ ...prev, [homeId]: "" }));
            setPasswordErrors(prev => ({ ...prev, [homeId]: "Password updated successfully" }));
            setTimeout(() => {
                setPasswordErrors(prev => ({ ...prev, [homeId]: "" }));
            }, 3000);
        } catch (error) {
            console.error("Error updating password:", error);
            setPasswordErrors(prev => ({ 
                ...prev, 
                [homeId]: error.response?.data?.message || "Failed to update password" 
            }));
        }
    };

    if (loading) return <LoadingElement />;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="login-page">
            <Background showLogo={false} />
            <div className="login-container">
                <div className="login-content">
                    <p className="login-title">Profile</p>
                    <div className="profile-info">
                        <p><strong>Username:</strong> {userData.username}</p>
                        <p><strong>First Name:</strong> {userData.first_name}</p>
                        <p><strong>Last Name:</strong> {userData.last_name}</p>
                        <p><strong>Email:</strong> {userData.email}</p>
                        <p><strong>Phone Number:</strong> {userData.profile?.phone_number}</p>
                        <p><strong>Date of Birth:</strong> {userData.profile?.date_of_birth}</p>
                        <p><strong>Gender:</strong> {userData.profile?.gender}</p>
                        
                        {/* Owned Homes Section */}
                        <div className="profile-owned-homes">
                            <h3 className="section-title">
                                <Home className="section-icon" />
                                <span>Your Smart Homes</span>
                            </h3>
                            {ownedHomes?.length > 0 ? (
                                <ul className="homes-list">
                                    {ownedHomes.map((home) => (
                                        <li key={home.id} className="home-item">
                                            <div className="home-header">
                                                <strong>{home.name}</strong>
                                                <Link 
                                                    to={`/smarthomepage/${home.id}`} 
                                                    className="view-home-link"
                                                >
                                                    View Home
                                                </Link>
                                            </div>
                                            <p className="home-id">
                                                <strong>Home ID:</strong> {home.id}
                                            </p>
                                            <p className="home-password">
                                                <strong>Current Join Password:</strong> {home.join_password || "No password set"}
                                            </p>
                                            
                                            {/* Password update form */}
                                            <div className="password-update-form">
                                                <input
                                                    type="password"
                                                    placeholder="Enter new password"
                                                    value={passwordInputs[home.id] || ""}
                                                    onChange={(e) => handlePasswordChange(home.id, e.target.value)}
                                                    className="password-input"
                                                />
                                                <button 
                                                    onClick={() => updatePassword(home.id)}
                                                    className="update-password-button"
                                                >
                                                    Update Password
                                                </button>
                                                {passwordErrors[home.id] && (
                                                    <p className={passwordErrors[home.id].includes("successfully") ? "success-message" : "error-message"}>
                                                        {passwordErrors[home.id]}
                                                    </p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>You don't own any smart homes yet.</p>
                            )}
                        </div>
                    </div>
                    <Link to="/edit-profile" className="login-button">Edit Profile</Link>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;