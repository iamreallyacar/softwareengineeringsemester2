import React, { useState, useEffect } from "react";
import { ChevronDown, Home, Users } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { ChevronLeft, User } from "lucide-react";

// Extract Header Component
const DashboardHeader = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        localStorage.removeItem("accessToken"); // Clear the access token
        localStorage.removeItem("userId"); // Clear the user ID
        navigate("/"); // Navigate to the root (login) page
    };

    return (
        <div className="dashboard-header">
            <button className="back-button" onClick={handleBack}>
                <ChevronLeft className="back-icon" />
                <span>Back</span>
            </button>
        </div>
    );
};

// Extract Profile Component
const UserProfile = () => (
    <div className="user-profile">
        <div className="avatar-container">
            <User className="avatar-icon" />
        </div>
        <h1 className="welcome-text">Welcome, User</h1>
        <p className="welcome-caption">Manage your smart homes and account settings.</p>
    </div>
);

// Extract Smart Home Creation Form
const CreateHomeForm = ({ homeName, setHomeName, handleCreateSmartHome, isCreating }) => (
    <div className="create-home">
        <form onSubmit={handleCreateSmartHome}>
            <input
                type="text"
                value={homeName}
                onChange={(e) => setHomeName(e.target.value)}
                placeholder="Home Name"
            />
            <button type="submit" disabled={isCreating}>
                {isCreating ? "Creating ..." : "Create Smart Home"}
            </button>
        </form>
    </div>
);

// Extract Owned Homes List
const OwnedHomesList = ({ isOwnedExpanded, setIsOwnedExpanded, smartHomes }) => (
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
                            <button className="home-button">{home.name}</button>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    </div>
);

// Extract Available Homes List
const AvailableHomesList = ({ isJoinedExpanded, setIsJoinedExpanded, availableHomes, handleJoinHome }) => (
    <div className="smart-home-list available">
        <div className={`list-container ${isJoinedExpanded ? "expanded" : ""}`}>
            <button className="expand-button" onClick={() => setIsJoinedExpanded(!isJoinedExpanded)}>
                <div className="button-content">
                    <div className="icon-container">
                        <Users className="list-icon" />
                    </div>
                    <span className="button-text">Available Smart Homes</span>
                </div>
                <ChevronDown className={`chevron-icon ${isJoinedExpanded ? "rotated" : ""}`} />
            </button>
            {isJoinedExpanded && (
                <div className="homes-list">
                    {availableHomes.map((home) => (
                        <button
                            key={home.id}
                            className="home-button"
                            onClick={() => handleJoinHome(home.id)}
                        >
                            {home.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    </div>
);

function SmartHomeList() {
    const [smartHomes, setSmartHomes] = useState([]);
    const [availableHomes, setAvailableHomes] = useState([]);
    const [error, setError] = useState("");
    const [homeName, setHomeName] = useState("");
    const [isOwnedExpanded, setIsOwnedExpanded] = useState(false);
    const [isJoinedExpanded, setIsJoinedExpanded] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const userId = localStorage.getItem("userId");
    const navigate = useNavigate();

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
        setIsCreating(true);
        try {
            await api.post("/smarthomes/", {
                name: homeName
            });
            setHomeName("");
            fetchSmartHomes();
        } catch (err) {
            console.error("Error creating smart home:", err);
            setError("Error creating new smart home");
        } finally {
            setIsCreating(false);
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
            <DashboardHeader />
            <UserProfile />
            <div className="dashboard-content">
                {error && <p className="error">{error}</p>}
                <CreateHomeForm
                    homeName={homeName}
                    setHomeName={setHomeName}
                    handleCreateSmartHome={handleCreateSmartHome}
                    isCreating={isCreating}
                />
                <OwnedHomesList
                    isOwnedExpanded={isOwnedExpanded}
                    setIsOwnedExpanded={setIsOwnedExpanded}
                    smartHomes={smartHomes}
                />
                <AvailableHomesList
                    isJoinedExpanded={isJoinedExpanded}
                    setIsJoinedExpanded={setIsJoinedExpanded}
                    availableHomes={availableHomes}
                    handleJoinHome={handleJoinHome}
                />
            </div>
        </div>
    );
}

export default SmartHomeList;