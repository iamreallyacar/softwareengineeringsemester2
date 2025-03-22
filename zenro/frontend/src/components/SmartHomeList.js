import React, { useState, useEffect } from "react";
import { ChevronDown, Home, Users, UserPlus, LogIn, Edit, Key, Trash } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import Background from "./Background.js";

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

// Update the OwnedHomesList component to include dropdown management options
const OwnedHomesList = ({ isOwnedExpanded, setIsOwnedExpanded, smartHomes, onDeleteHome, onUpdateHome }) => {
    const [expandedHomeId, setExpandedHomeId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editing, setEditing] = useState(null); // 'name' or 'password'
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    
    // New states for password verification modal
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [homeToDelete, setHomeToDelete] = useState(null);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteError, setDeleteError] = useState("");

    const toggleHomeOptions = (homeId) => {
        setExpandedHomeId(expandedHomeId === homeId ? null : homeId);
        setEditing(null);
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

    const cancelEditing = () => {
        setEditing(null);
        setEditName('');
        setEditPassword('');
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
            setEditing(null);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update smart home');
        } finally {
            setIsUpdating(false);
        }
    };

    // New function to initiate deletion confirmation
    const initiateDeleteHome = (home) => {
        setHomeToDelete(home);
        setShowDeleteConfirm(true);
        setDeletePassword("");
        setDeleteError("");
    };
    
    // Updated handleDeleteHome with password verification
    const handleDeleteHome = async () => {
        if (!homeToDelete) return;
        
        if (!deletePassword) {
            setDeleteError("Please enter your password to confirm deletion");
            return;
        }
        
        setIsDeleting(true);
        setDeleteError("");
        
        try {
            const userId = localStorage.getItem("userId");
            
            // First verify the password
            try {
                // Using the password change endpoint to verify (changing to same password)
                await api.post(`/users/${userId}/change_password/`, {
                    current_password: deletePassword,
                    new_password: deletePassword // Same password to avoid actual change
                });
                
                // If we get here, password is correct, proceed with deletion
                await onDeleteHome(homeToDelete.id);
                setShowDeleteConfirm(false);
                setExpandedHomeId(null);
            } catch (err) {
                // Password verification failed
                if (err.response?.status === 400) {
                    setDeleteError("Incorrect password. Please try again.");
                } else {
                    throw err; // Re-throw for the outer catch to handle
                }
            }
        } catch (err) {
            console.error("Error deleting smart home:", err);
            setDeleteError("Failed to delete smart home. Please try again.");
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
                                                        <button onClick={cancelEditing}>Cancel</button>
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
                                                        <button onClick={cancelEditing}>Cancel</button>
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
                                                        onClick={() => initiateDeleteHome(home)}
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
            
            {/* Delete Smart Home Confirmation Modal */}
            {showDeleteConfirm && homeToDelete && (
                <div className="modal-overlay">
                    <div className="delete-confirm-modal">
                        <div className="modal-header">
                            <h3>Confirm Smart Home Deletion</h3>
                            <button 
                                className="close-modal-button"
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeletePassword("");
                                    setDeleteError("");
                                }}
                            >
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        
                        <div className="modal-content">
                            <p className="warning-text">
                                <i className="fa-solid fa-exclamation-triangle"></i>
                                This action cannot be undone. "{homeToDelete.name}" and all its rooms and devices will be permanently deleted.
                            </p>
                            
                            <div className="confirm-password-field">
                                <label>Enter your account password to confirm:</label>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    placeholder="Your account password"
                                />
                                {deleteError && (
                                    <div className="field-error">{deleteError}</div>
                                )}
                            </div>
                            
                            <div className="modal-actions">
                                <button 
                                    className="cancel-delete-button"
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeletePassword("");
                                        setDeleteError("");
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="confirm-delete-button"
                                    onClick={handleDeleteHome}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Deleting..." : "Permanently Delete Smart Home"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

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
  
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

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
            onDeleteHome={handleDeleteHome}
            onUpdateHome={handleUpdateHome}
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