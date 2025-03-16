import React, { useState, useEffect } from "react";
import { ChevronDown, Home, Users, UserPlus } from "lucide-react";
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

// Extract Smart Home Creation Form - Now with join password field
const CreateHomeForm = ({ homeName, setHomeName, joinPassword, setJoinPassword, handleCreateSmartHome, isCreating }) => (
    <div className="create-home">
        <form onSubmit={handleCreateSmartHome}>
            <input
                type="text"
                value={homeName}
                onChange={(e) => setHomeName(e.target.value)}
                placeholder="Home Name"
                required
            />
            <input
                type="password" 
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Join Password"
                required
                className="join-password-input"
            />
            <button type="submit" disabled={isCreating}>
                {isCreating ? "Creating ..." : "Create Smart Home"}
            </button>
        </form>
    </div>
);

// Extract Owned Homes List - modified to only show owned homes
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
                    {smartHomes.length === 0 ? (
                        <div className="no-homes-message">You don't own any smart homes yet</div>
                    ) : (
                        smartHomes.map((home) => (
                            <Link to={`/smarthomepage/${home.id}`} style={{ textDecoration: 'none', color: 'inherit' }} key={home.id}>
                                <button className="home-button">{home.name}</button>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    </div>
);

// New Component: Joined Homes List
const JoinedHomesList = ({ isJoinedHomesExpanded, setIsJoinedHomesExpanded, joinedHomes }) => (
    <div className="smart-home-list joined">
        <div className={`list-container ${isJoinedHomesExpanded ? "expanded" : ""}`}>
            <button className="expand-button" onClick={() => setIsJoinedHomesExpanded(!isJoinedHomesExpanded)}>
                <div className="button-content">
                    <div className="icon-container">
                        <UserPlus className="list-icon" />
                    </div>
                    <span className="button-text">Smart Homes You Joined</span>
                </div>
                <ChevronDown className={`chevron-icon ${isJoinedHomesExpanded ? "rotated" : ""}`} />
            </button>
            {isJoinedHomesExpanded && (
                <div className="homes-list">
                    {joinedHomes.length === 0 ? (
                        <div className="no-homes-message">You haven't joined any smart homes yet</div>
                    ) : (
                        joinedHomes.map((home) => (
                            <Link to={`/smarthomepage/${home.id}`} style={{ textDecoration: 'none', color: 'inherit' }} key={home.id}>
                                <button className="home-button">{home.name}</button>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    </div>
);

// Modify Available Homes List to include inline password entry
const AvailableHomesList = ({ 
  isJoinedExpanded, 
  setIsJoinedExpanded, 
  availableHomes, 
  homeWithPasswordOpen,
  setHomeWithPasswordOpen, 
  onJoinHome
}) => {
  const [joinPassword, setJoinPassword] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinSubmit = async (homeId) => {
    setIsJoining(true);
    setJoinError("");
    
    try {
      await onJoinHome(homeId, joinPassword);
      setJoinPassword("");
      setHomeWithPasswordOpen(null);
    } catch (err) {
      setJoinError(err.response?.data?.error || "Failed to join home");
    } finally {
      setIsJoining(false);
    }
  };

  const togglePasswordDropdown = (homeId) => {
    if (homeWithPasswordOpen === homeId) {
      setHomeWithPasswordOpen(null);
      setJoinPassword("");
      setJoinError("");
    } else {
      setHomeWithPasswordOpen(homeId);
      setJoinPassword("");
      setJoinError("");
    }
  };

  return (
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
            {availableHomes.length === 0 ? (
              <div className="no-homes-message">No available homes to join</div>
            ) : (
              availableHomes.map((home) => (
                <div key={home.id} className="home-item">
                  <button
                    className="home-button"
                    onClick={() => togglePasswordDropdown(home.id)}
                  >
                    {home.name}
                  </button>
                  
                  {homeWithPasswordOpen === home.id && (
                    <div className="password-dropdown">
                      <p className="dropdown-prompt">Enter join password for "{home.name}"</p>
                      
                      <input
                        type="password"
                        value={joinPassword}
                        onChange={(e) => setJoinPassword(e.target.value)}
                        placeholder="Join Password"
                        className="join-password-input"
                      />
                      
                      {joinError && <p className="error-message">{joinError}</p>}
                      
                      <div className="dropdown-buttons">
                        <button 
                          onClick={() => handleJoinSubmit(home.id)}
                          disabled={isJoining || !joinPassword}
                          className="join-button"
                        >
                          {isJoining ? "Joining..." : "Join"}
                        </button>
                        <button 
                          onClick={() => togglePasswordDropdown(home.id)}
                          className="cancel-button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function SmartHomeList() {
    const [smartHomes, setSmartHomes] = useState([]);
    const [availableHomes, setAvailableHomes] = useState([]);
    const [error, setError] = useState("");
    const [homeName, setHomeName] = useState("");
    const [isOwnedExpanded, setIsOwnedExpanded] = useState(false);
    const [isJoinedExpanded, setIsJoinedExpanded] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    // const userId = localStorage.getItem("userId");
    // const navigate = useNavigate();

  useEffect(() => {
    fetchSmartHomes();
    fetchAvailableHomes();
  }, []);

  const fetchSmartHomes = async () => {
    try {
      const response = await api.get("/smarthomes/");
      
      // Split homes into owned and joined
      const owned = response.data.filter(home => home.is_creator === true);
      const joined = response.data.filter(home => home.is_creator === false);
      
      setOwnedHomes(owned);
      setJoinedHomes(joined);
    } catch (err) {
      setError("Failed to load smart homes");
    }
  };

  const fetchAvailableHomes = async () => {
    try {
      const response = await api.get("/smarthomes/available/");
      setAvailableHomes(response.data);
    } catch (err) {
      setError("Failed to load available homes");
    }
  };

  const handleCreateSmartHome = async (event) => {
    event.preventDefault();
    setIsCreating(true);
    try {
      await api.post("/smarthomes/", {
        name: homeName,
        join_password: joinPassword
      });
      setHomeName("");
      setJoinPassword("");
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

    // const handleLeaveHome = async (homeId) => {
    //     try {
    //         await api.post(`/smarthomes/${homeId}/leave/`);
    //         fetchSmartHomes();
    //         fetchAvailableHomes();
    //     } catch (err) {
    //         setError("Error leaving smart home");
    //     }
    // };


  return (
    <div className="dashboard-container">
      <DashboardHeader />
      <UserProfile />
      <div className="dashboard-content">
        {error && <p className="error">{error}</p>}
        <CreateHomeForm
          homeName={homeName}
          setHomeName={setHomeName}
          joinPassword={joinPassword}
          setJoinPassword={setJoinPassword}
          handleCreateSmartHome={handleCreateSmartHome}
          isCreating={isCreating}
        />
        <OwnedHomesList
          isOwnedExpanded={isOwnedExpanded}
          setIsOwnedExpanded={setIsOwnedExpanded}
          smartHomes={ownedHomes}
        />
        <JoinedHomesList
          isJoinedHomesExpanded={isJoinedHomesExpanded}
          setIsJoinedHomesExpanded={setIsJoinedHomesExpanded}
          joinedHomes={joinedHomes}
        />
        <AvailableHomesList
          isJoinedExpanded={isAvailableExpanded}
          setIsJoinedExpanded={setIsAvailableExpanded}
          availableHomes={availableHomes}
          homeWithPasswordOpen={homeWithPasswordOpen}
          setHomeWithPasswordOpen={setHomeWithPasswordOpen}
          onJoinHome={handleJoinHomeWithPassword}
        />
        
        {/* Remove the JoinPasswordModal */}
      </div>
    </div>
  );
}

export default SmartHomeList;