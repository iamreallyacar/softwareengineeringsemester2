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

// Add new component for password prompt
const JoinPasswordModal = ({ isOpen, onClose, onSubmit, homeId, homeName }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      await onSubmit(homeId, password);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to join home");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="join-modal">
        <h2>Join "{homeName}"</h2>
        <p>Enter the join password to access this smart home</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Join Password"
            required
            className="join-password-input"
          />
          
          {error && <p className="error-message">{error}</p>}
          
          <div className="modal-buttons">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="join-button"
            >
              {isSubmitting ? "Joining..." : "Join Home"}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modify Available Homes List
const AvailableHomesList = ({ 
  isJoinedExpanded, 
  setIsJoinedExpanded, 
  availableHomes, 
  onSelectHome 
}) => (
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
              <button
                key={home.id}
                className="home-button"
                onClick={() => onSelectHome(home)}
              >
                {home.name}
              </button>
            ))
          )}
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
  const [joinPassword, setJoinPassword] = useState("");
  const [isOwnedExpanded, setIsOwnedExpanded] = useState(false);
  const [isJoinedExpanded, setIsJoinedExpanded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Add state for join modal
  const [selectedHomeToJoin, setSelectedHomeToJoin] = useState(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  
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

  // Update this function to open the join modal
  const handleSelectHomeToJoin = (home) => {
    setSelectedHomeToJoin(home);
    setIsJoinModalOpen(true);
  };

  // This function will be called when the password is submitted
  const handleJoinHomeWithPassword = async (homeId, password) => {
    try {
      await api.post(`/smarthomes/${homeId}/join/`, {
        join_password: password
      });
      
      // Refresh both lists after successful join
      await fetchSmartHomes();
      await fetchAvailableHomes();
      
      // Close the modal
      setIsJoinModalOpen(false);
      setSelectedHomeToJoin(null);
    } catch (err) {
      console.error("Error joining smart home:", err);
      throw err; // Re-throw to be handled by the modal
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
          joinPassword={joinPassword}
          setJoinPassword={setJoinPassword}
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
          onSelectHome={handleSelectHomeToJoin}
        />
        
        {/* Add the join password modal */}
        <JoinPasswordModal
          isOpen={isJoinModalOpen}
          onClose={() => {
            setIsJoinModalOpen(false);
            setSelectedHomeToJoin(null);
          }}
          onSubmit={handleJoinHomeWithPassword}
          homeId={selectedHomeToJoin?.id}
          homeName={selectedHomeToJoin?.name}
        />
      </div>
    </div>
  );
}

export default SmartHomeList;