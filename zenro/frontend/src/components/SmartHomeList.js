import React, { useState, useEffect } from "react";
import { ChevronDown, Home, Users, UserPlus, LogIn, Edit, Key, Trash, LogOut } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { ChevronLeft, User, UserRoundCog } from "lucide-react";
import Background from "./Background.js";

const DashboardHeader = () => {
    return (
        <div className="dashboard-header">
            {/* Back button removed */}
        </div>
    );
};

const UserProfile = ({ username }) => (
    <div className="user-profile">
        <div className="avatar-container">
            <User className="avatar-icon" />
        </div>
        <h1 className="welcome-text">Welcome, {username || "User"}</h1>
        <p className="welcome-caption">Manage your smart homes here</p>
    </div>
);

const CreateHomeForm = ({ homeName, setHomeName, joinPassword, setJoinPassword, handleCreateSmartHome, isCreating, formError }) => (
    <div className="create-home">
        <h2 className="create-home-title">Create Smart Homes</h2>
        <form onSubmit={handleCreateSmartHome}>
            <div className="form-field">
                <input
                    type="text"
                    value={homeName}
                    onChange={(e) => setHomeName(e.target.value)}
                    placeholder="Home Name"
                    required
                    className={formError ? "input-error" : ""}
                />
                {formError && <div className="form-error-message">{formError}</div>}
            </div>
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

const OwnedHomesList = ({ isOwnedExpanded, setIsOwnedExpanded, smartHomes, onDeleteHome, onUpdateHome }) => {
    const [expandedHomeId, setExpandedHomeId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editing, setEditing] = useState(null); 
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const toggleHomeOptions = (homeId) => {
        setExpandedHomeId(expandedHomeId === homeId ? null : homeId);
        resetEditState();
    };

    const resetEditState = () => {
        setEditing(null);
        setEditName('');
        setEditPassword('');
        setError('');
    };

    const startEditing = (type, home) => {
        setEditing(type);
        if (type === 'name') {
            setEditName(home.name);
        } else if (type === 'password') {
            setEditPassword(home.join_password || '');
        }
        setError('');
    };

    const handleSaveChanges = async (homeId) => {
        setIsUpdating(true);
        setError('');
        
        try {
            const updateData = editing === 'name' 
                ? { name: editName } 
                : { join_password: editPassword };
                
            await onUpdateHome(homeId, updateData);
            resetEditState();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update smart home');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async (homeId) => {
        setIsDeleting(true);
        setError('');
        
        try {
            await onDeleteHome(homeId);
            setExpandedHomeId(null);
            resetEditState();
        } catch (err) {
            console.error("Error deleting smart home:", err);
            setError("Failed to delete smart home. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const enterSmartHome = (homeId) => {
        navigate(`/smarthomepage/${homeId}`);
    };

    return (
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
                                <div key={home.id} className="owned-home-item">
                                    <button 
                                        className="home-button home-owner-button"
                                        onClick={() => toggleHomeOptions(home.id)}
                                    >
                                        <span>{home.name}</span>
                                        <ChevronDown className={`home-chevron ${expandedHomeId === home.id ? "rotated" : ""}`} />
                                    </button>
                                    
                                    {expandedHomeId === home.id && (
                                        <div className="home-options">
                                            {error && <div className="error-message">{error}</div>}
                                            
                                            {editing === 'name' ? (
                                                <div className="edit-field">
                                                    <input 
                                                        type="text" 
                                                        value={editName} 
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        placeholder="Enter new name"
                                                    />
                                                    <div className="edit-actions">
                                                        <button 
                                                            onClick={() => handleSaveChanges(home.id)}
                                                            disabled={isUpdating || !editName.trim()}
                                                        >
                                                            {isUpdating ? "Saving..." : "Save"}
                                                        </button>
                                                        <button onClick={resetEditState}>Cancel</button>
                                                    </div>
                                                </div>
                                            ) : editing === 'password' ? (
                                                <div className="edit-field">
                                                    <input 
                                                        type="password" 
                                                        value={editPassword} 
                                                        onChange={(e) => setEditPassword(e.target.value)}
                                                        placeholder="Enter new join password"
                                                    />
                                                    <div className="edit-actions">
                                                        <button 
                                                            onClick={() => handleSaveChanges(home.id)}
                                                            disabled={isUpdating}
                                                        >
                                                            {isUpdating ? "Saving..." : "Save"}
                                                        </button>
                                                        <button onClick={resetEditState}>Cancel</button>
                                                    </div>
                                                </div>
                                            ) : editing === 'delete' ? (
                                                <div className="delete-confirmation">
                                                    <div className="delete-warning">
                                                        <Trash className="warning-icon" />
                                                        <p className="delete-warning-title">Delete "{home.name}"?</p>
                                                        <p className="delete-warning-message">
                                                            This will permanently delete this smart home and all its rooms and devices.
                                                            This action cannot be undone.
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="delete-actions">
                                                        <button 
                                                            className="delete-cancel-btn"
                                                            onClick={resetEditState}
                                                        >
                                                            No, Cancel
                                                        </button>
                                                        <button 
                                                            className="delete-confirm-btn"
                                                            onClick={() => handleDelete(home.id)}
                                                            disabled={isDeleting}
                                                        >
                                                            {isDeleting ? "Deleting..." : "Yes, Delete Smart Home"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="action-buttons">
                                                    <button className="action-btn enter-btn" onClick={() => enterSmartHome(home.id)}>
                                                        <LogIn className="action-icon" />
                                                        <span>Enter</span>
                                                    </button>
                                                    <button className="action-btn edit-name-btn" onClick={() => startEditing('name', home)}>
                                                        <Edit className="action-icon" />
                                                        <span>Change Smart Home Name</span>
                                                    </button>
                                                    <button className="action-btn edit-password-btn" onClick={() => startEditing('password', home)}>
                                                        <Key className="action-icon" />
                                                        <span>Change Join Password</span>
                                                    </button>
                                                    <button 
                                                        className="action-btn delete-btn" 
                                                        onClick={() => startEditing('delete', home)}
                                                    >
                                                        <Trash className="action-icon" />
                                                        <span>Delete Smart Home</span>
                                                    </button>
                                                </div>
                                            )}
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

const JoinedHomesList = ({ isJoinedHomesExpanded, setIsJoinedHomesExpanded, joinedHomes, onRefreshHomes }) => {
    const [expandedHomeId, setExpandedHomeId] = useState(null);
    const [isLeaving, setIsLeaving] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [homeToLeave, setHomeToLeave] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const toggleHomeOptions = (homeId, e) => {
        e.preventDefault(); // Prevent navigation
        setExpandedHomeId(expandedHomeId === homeId ? null : homeId);
        setError('');
    };

    const enterSmartHome = (homeId) => {
        navigate(`/smarthomepage/${homeId}`);
    };

    const initiateLeaveHome = (home) => {
        setHomeToLeave(home);
        setShowLeaveConfirm(true);
    };

    const cancelLeaveHome = () => {
        setShowLeaveConfirm(false);
        setHomeToLeave(null);
        setError('');
    };

    const confirmLeaveHome = async () => {
        if (!homeToLeave) return;
        
        setIsLeaving(true);
        setError('');
        
        try {
            // Use the dedicated leave endpoint instead of manually updating members
            await api.post(`/smarthomes/${homeToLeave.id}/leave/`);
            
            // Reset UI state
            setShowLeaveConfirm(false);
            setHomeToLeave(null);
            setExpandedHomeId(null);
            
            // Refresh the homes lists
            onRefreshHomes();
            
        } catch (err) {
            console.error("Error leaving smart home:", err);
            setError("Failed to leave smart home. Please try again.");
        } finally {
            setIsLeaving(false);
        }
    };

    return (
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
                                <div key={home.id} className="joined-home-item">
                                    <button 
                                        className="home-button joined-home-button"
                                        onClick={(e) => toggleHomeOptions(home.id, e)}
                                    >
                                        <span>{home.name}</span>
                                        <div className="home-button-right">
                                            <span className="owner-tag">(Owner: {home.creator_username})</span>
                                            <ChevronDown className={`home-chevron ${expandedHomeId === home.id ? "rotated" : ""}`} />
                                        </div>
                                    </button>
                                    
                                    {expandedHomeId === home.id && (
                                        <div className="home-options">
                                            {error && <div className="error-message">{error}</div>}
                                            
                                            {showLeaveConfirm && homeToLeave?.id === home.id ? (
                                                <div className="leave-confirmation">
                                                    <div className="leave-warning">
                                                        <LogOut className="warning-icon" />
                                                        <p className="leave-warning-title">Leave "{home.name}"?</p>
                                                        <p className="leave-warning-message">
                                                            You will no longer have access to this smart home and will need to rejoin with the password if you want to access it again.
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="leave-actions">
                                                        <button 
                                                            className="leave-cancel-btn"
                                                            onClick={cancelLeaveHome}
                                                        >
                                                            No, Cancel
                                                        </button>
                                                        <button 
                                                            className="leave-confirm-btn"
                                                            onClick={confirmLeaveHome}
                                                            disabled={isLeaving}
                                                        >
                                                            {isLeaving ? "Leaving..." : "Yes, Leave Smart Home"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="action-buttons">
                                                    <button className="action-btn enter-btn" onClick={() => enterSmartHome(home.id)}>
                                                        <LogIn className="action-icon" />
                                                        <span>Enter</span>
                                                    </button>
                                                    <button 
                                                        className="action-btn leave-btn" 
                                                        onClick={() => initiateLeaveHome(home)}
                                                    >
                                                        <LogOut className="action-icon" />
                                                        <span>Leave Smart Home</span>
                                                    </button>
                                                </div>
                                            )}
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

// AvailableHomesList to display owner's username
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
                    <div key={home.id} className="shl-home-item">
                    <button
                        className="home-button"
                        onClick={() => togglePasswordDropdown(home.id)}
                    >
                        {home.name} <span className="owner-tag">(Owner: {home.creator_username})</span>
                    </button>
                    
                    {homeWithPasswordOpen === home.id && (
                        <div className="password-dropdown">
                            <p className="dropdown-prompt">Enter join password for "{home.name}"</p>
                            
                            <input
                                type="password"
                                value={joinPassword}
                                onChange={(e) => setJoinPassword(e.target.value)}
                                placeholder="Join Password"
                                className={`join-password-input ${joinError ? 'has-error' : ''}`}
                            />
                            
                            {joinError && <div className="error-message">{joinError}</div>}
                            
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
  const [ownedHomes, setOwnedHomes] = useState([]);
  const [joinedHomes, setJoinedHomes] = useState([]);
  const [availableHomes, setAvailableHomes] = useState([]);
  const [error, setError] = useState("");
  const [homeName, setHomeName] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [isOwnedExpanded, setIsOwnedExpanded] = useState(false);
  const [isJoinedHomesExpanded, setIsJoinedHomesExpanded] = useState(false);
  const [isAvailableExpanded, setIsAvailableExpanded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [homeWithPasswordOpen, setHomeWithPasswordOpen] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // New state variable for form-specific errors
  const [formError, setFormError] = useState("");
  
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    fetchSmartHomes();
    fetchAvailableHomes();
    fetchCurrentUser();
  }, []);

  // Function to fetch the current user's info
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("/user/current/");
      setCurrentUser(response.data);
      console.log("Current user:", response.data);
    } catch (err) {
      console.error("Failed to fetch current user:", err);
    }
  };

  // Data fetching to properly get creator usernames
const fetchSmartHomes = async () => {
  try {
    const response = await api.get("/smarthomes/");
    console.log("Smart homes data:", response.data);
    
    const homesWithCreatorPromises = response.data.map(async home => {
      // If creator_username already exists, use it
      if (home.creator_username) {
        return home;
      }
      
      // If creator is an object with username, extract it
      if (home.creator && typeof home.creator === 'object' && home.creator.username) {
        return { ...home, creator_username: home.creator.username };
      }
      
      // If creator is just an ID, fetch the username
      if (home.creator && (typeof home.creator === 'number' || typeof home.creator === 'string')) {
        try {
          const creatorId = home.creator;
          const userResponse = await api.get(`/users/${creatorId}/`);
          return { ...home, creator_username: userResponse.data.username };
        } catch (err) {
          console.error(`Failed to fetch username for creator ID ${home.creator}:`, err);
          return { ...home, creator_username: `Unknown (${home.creator})` };
        }
      }
      
      // Fallback
      return { ...home, creator_username: "Unknown" };
    });
    
    // Wait for all username fetches to complete
    const processedHomes = await Promise.all(homesWithCreatorPromises);
    
    // Split homes into owned and joined
    const owned = processedHomes.filter(home => home.is_creator === true);
    const joined = processedHomes.filter(home => home.is_creator === false);
    
    setOwnedHomes(owned);
    setJoinedHomes(joined);
  } catch (err) {
    console.error("Failed to load smart homes:", err);
    setError("Failed to load smart homes");
  }
};

const fetchAvailableHomes = async () => {
  try {
    const response = await api.get("/smarthomes/available/");
    console.log("Available homes data:", response.data);
    
    // Same approach for available homes
    const homesWithCreatorPromises = response.data.map(async home => {
      if (home.creator_username) {
        return home;
      }
      
      if (home.creator && typeof home.creator === 'object' && home.creator.username) {
        return { ...home, creator_username: home.creator.username };
      }
      
      if (home.creator && (typeof home.creator === 'number' || typeof home.creator === 'string')) {
        try {
          const creatorId = home.creator;
          const userResponse = await api.get(`/users/${creatorId}/`);
          return { ...home, creator_username: userResponse.data.username };
        } catch (err) {
          console.error(`Failed to fetch username for creator ID ${home.creator}:`, err);
          return { ...home, creator_username: `Unknown (${home.creator})` };
        }
      }
      
      return { ...home, creator_username: "Unknown" };
    });
    
    const processedHomes = await Promise.all(homesWithCreatorPromises);
    setAvailableHomes(processedHomes);
  } catch (err) {
    console.error("Failed to load available homes:", err);
    setError("Failed to load available homes");
  }
};

  const handleCreateSmartHome = async (event) => {
    event.preventDefault();
    
    // Clear any previous errors
    setFormError("");
    setError("");
    
    // Check if the name is empty (though HTML required should prevent this)
    if (!homeName.trim()) {
      setFormError("Home name cannot be empty");
      return;
    }
    
    // Check if the current user already has a home with the same name
    const hasDuplicateName = ownedHomes.some(
      home => home.name.toLowerCase() === homeName.toLowerCase()
    );
    
    if (hasDuplicateName) {
      setFormError(`You already have a smart home named "${homeName}"`);
      return;
    }
    
    setIsCreating(true);
    try {
      await api.post("/smarthomes/", {
        name: homeName,
        join_password: joinPassword
      });
      
      // Reset form fields after successful creation
      setHomeName("");
      setJoinPassword("");
      fetchSmartHomes();
    } catch (err) {
      console.error("Error creating smart home:", err);
      
      // Check for specific error codes from the API
      if (err.response && err.response.data) {
        if (err.response.data.name) {
          // If the API returns a validation error for the name field
          setFormError(err.response.data.name[0]);
        } else {
          // General error
          setError("Error creating new smart home");
        }
      } else {
        setError("Error connecting to the server");
      }
    } finally {
      setIsCreating(false);
    }
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
    } catch (err) {
      console.error("Error joining smart home:", err);
      throw err; // Re-throw to be handled by the dropdown
    }
  };

  const handleDeleteHome = async (homeId) => {
    try {
      await api.delete(`/smarthomes/${homeId}/`);
      await fetchSmartHomes(); // Refresh the list
      return true;
    } catch (err) {
      console.error("Error deleting smart home:", err);
      throw err;
    }
  };

  const handleUpdateHome = async (homeId, updateData) => {
    try {
      await api.patch(`/smarthomes/${homeId}/`, updateData);
      await fetchSmartHomes(); // Refresh the list
      return true;
    } catch (err) {
      console.error("Error updating smart home:", err);
      throw err;
    }
  };

  // Function to refresh all homes lists
  const refreshAllHomes = async () => {
    await fetchSmartHomes();
    await fetchAvailableHomes();
  };

  return (
    <div className="shl-main-content">
        <Background showLogo={false} blurEffect={true} />
        <div className="shl-title-grouping">
            <UserRoundCog className="shl-title-icon" />
            <h1 className="shl-title">My Smart Homes</h1>
        </div>
        <div className="dashboard-container">
            <DashboardHeader />
            <UserProfile username={currentUser?.username} />
            <div className="dashboard-content">
                {error && <p className="error">{error}</p>}
                <CreateHomeForm
                homeName={homeName}
                setHomeName={setHomeName}
                joinPassword={joinPassword}
                setJoinPassword={setJoinPassword}
                handleCreateSmartHome={handleCreateSmartHome}
                isCreating={isCreating}
                formError={formError}
                />
                <OwnedHomesList
                isOwnedExpanded={isOwnedExpanded}
                setIsOwnedExpanded={setIsOwnedExpanded}
                smartHomes={ownedHomes}
                onDeleteHome={handleDeleteHome}
                onUpdateHome={handleUpdateHome}
                />
                <JoinedHomesList
                isJoinedHomesExpanded={isJoinedHomesExpanded}
                setIsJoinedHomesExpanded={setIsJoinedHomesExpanded}
                joinedHomes={joinedHomes}
                onRefreshHomes={refreshAllHomes}
                />
                <AvailableHomesList
                isJoinedExpanded={isAvailableExpanded}
                setIsJoinedExpanded={setIsAvailableExpanded}
                availableHomes={availableHomes}
                homeWithPasswordOpen={homeWithPasswordOpen}
                setHomeWithPasswordOpen={setHomeWithPasswordOpen}
                onJoinHome={handleJoinHomeWithPassword}
                />
            </div>
        </div>
    </div>
  );
}

export default SmartHomeList;