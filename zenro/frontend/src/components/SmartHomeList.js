import React, { useState, useEffect } from "react";
import { ChevronDown, Home, Users } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api";
import "../css/styles.css";
import { ChevronLeft, User } from "lucide-react";

function SmartHomeList() {
    const [smartHomes, setSmartHomes] = useState([]);
    const [availableHomes, setAvailableHomes] = useState([]);
    const [error, setError] = useState("");
    const [homeName, setHomeName] = useState("");
    const [isOwnedExpanded, setIsOwnedExpanded] = useState(false);
    const [isJoinedExpanded, setIsJoinedExpanded] = useState(false);
    const userId = localStorage.getItem("userId");

    useEffect(() => {
        fetchSmartHomes();
        fetchAvailableHomes();
    }, []);

    const fetchSmartHomes = async () => {
        try {
            const response = await api.get("/smarthomes/");
            setSmartHomes(response.data);
        } catch (err) {
            setError("Failed to load smart homes");
        }
    };

    const fetchAvailableHomes = async () => {
        try {
            const response = await api.get("/smarthomes/available/");
            setAvailableHomes(response.data);
        } catch (err) {
            console.error("Error fetching available homes:", err);
        }
    };

    const handleCreateSmartHome = async (event) => {
        event.preventDefault();
        try {
            await api.post("/smarthomes/", { 
                name: homeName
            });
            setHomeName("");
            fetchSmartHomes();
        } catch (err) {
            console.error("Error creating smart home:", err);
            setError("Error creating new smart home");
        }
    };

    const handleJoinHome = async (homeId) => {
        try {
            await api.post(`/smarthomes/${homeId}/join/`);
            fetchSmartHomes();
            fetchAvailableHomes();
        } catch (err) {
            setError("Error joining smart home");
        }
    };

    const handleLeaveHome = async (homeId) => {
        try {
            await api.post(`/smarthomes/${homeId}/leave/`);
            fetchSmartHomes();
            fetchAvailableHomes();
        } catch (err) {
            setError("Error leaving smart home");
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <button className="back-button">
                    <ChevronLeft className="back-icon" />
                    <span>Home</span>
                </button>
            </div>

            <div className="user-profile">
                <div className="avatar-container">
                    <User className="avatar-icon" />
                </div>
                <h1 className="welcome-text">Welcome, User</h1>
                <p className="welcome-caption">Manage your smart homes and account settings.</p>
            </div>

            <div className="dashboard-content">
                <h1>Smart Homes</h1>
                {error && <p className="error">{error}</p>}
                
                <div className="create-home">
                    <h2>Create New Smart Home</h2>
                    <form onSubmit={handleCreateSmartHome}>
                        <input
                            type="text"
                            value={homeName}
                            onChange={(e) => setHomeName(e.target.value)}
                            placeholder="Home Name"
                        />
                        <button type="submit">Create Smart Home</button>
                    </form>
                </div>

                <div className="smart-home-list owned">
                    <div className={`list-container ${isOwnedExpanded ? "expanded" : ""}`}>
                        <button className="expand-button" onClick={() => setIsOwnedExpanded(!isOwnedExpanded)}>
                            <div className="button-content">
                                <div className="icon-container">
                                    <Home className="list-icon" />
                                </div>
                                <span className="button-text">Smart Homes You Own</span>
                            </div>
                            <ChevronDown className={`chevron-icon ${isOwnedExpanded ? "rotated" : ""}`} />
                        </button>

                        {isOwnedExpanded && (
                            <div className="homes-list">
                                {smartHomes.map((home) => (
                                    <Link to={`/smarthomepage/${home.id}`} style={{ textDecoration: 'none', color: 'inherit' }} key={home.id}>
                                        <button className="home-button">
                                            {home.name}
                                        </button>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="smart-home-list joined">
                    <div className={`list-container ${isJoinedExpanded ? "expanded" : ""}`}>
                        <button className="expand-button" onClick={() => setIsJoinedExpanded(!isJoinedExpanded)}>
                            <div className="button-content">
                                <div className="icon-container">
                                    <Users className="list-icon" />
                                </div>
                                <span className="button-text">Available Homes to Join</span>
                            </div>
                            <ChevronDown className={`chevron-icon ${isJoinedExpanded ? "rotated" : ""}`} />
                        </button>

                        {isJoinedExpanded && (
                            <div className="homes-list">
                                {availableHomes.map((home) => (
                                    <div key={home.id} className="home-item">
                                        <span>{home.name}</span>
                                        <button onClick={() => handleJoinHome(home.id)}>
                                            Join
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SmartHomeList;