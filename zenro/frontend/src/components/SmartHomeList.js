import React, { useState, useEffect } from "react";
import api from "../api";

function SmartHomeList() {
    // Holds the list of homes the user already has
    const [smartHomes, setSmartHomes] = useState([]);
    // Holds the list of homes the user can join
    const [availableHomes, setAvailableHomes] = useState([]);
    // Tracks error messages
    const [error, setError] = useState("");
    // Tracks the new home's name
    const [homeName, setHomeName] = useState("");
    const userId = localStorage.getItem("userId");

    useEffect(() => {
        fetchSmartHomes();
        fetchAvailableHomes();
    }, []);

    // Fetch the user's existing homes
    const fetchSmartHomes = async () => {
        try {
            const response = await api.get("/smarthomes/");
            setSmartHomes(response.data);
        } catch (err) {
            setError("Failed to load smart homes");
        }
    };

    // Fetch available homes to join
    const fetchAvailableHomes = async () => {
        try {
            const response = await api.get("/smarthomes/available/");
            setAvailableHomes(response.data);
        } catch (err) {
            console.error("Error fetching available homes:", err);
        }
    };

    // Handle creating a new smart home
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

    // Handle joining a chosen smart home
    const handleJoinHome = async (homeId) => {
        try {
            await api.post(`/smarthomes/${homeId}/join/`);
            fetchSmartHomes();
            fetchAvailableHomes();
        } catch (err) {
            setError("Error joining smart home");
        }
    };

    // Handle leaving a current smart home
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
        <div className="login-container">
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

            <div className="my-homes">
                <h2>My Smart Homes</h2>
                <ul>
                    {smartHomes.map((home) => (
                        <Link to={`/smarthomepage/${home.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <li key={home.id}>
                            {home.name}
                        </li>
                        </Link>
                    ))}
                </ul>
            </div>

            <div className="available-homes">
                <h2>Available Homes to Join</h2>
                <ul>
                    {availableHomes.map((home) => (
                        <li key={home.id}>
                            {home.name}
                            <button onClick={() => handleJoinHome(home.id)}>
                                Join
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default SmartHomeList;