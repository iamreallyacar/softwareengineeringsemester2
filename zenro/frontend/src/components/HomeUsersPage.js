import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom"; // Add Link import
import Navbar from "./NavigationBar";
import api from "../api";
import "../css/home-users-page.css";
import { ChevronLeft, UserPlus, ChevronDown } from "lucide-react"; // Import ChevronLeft, UserPlus, ChevronDown icons

function HomeUsersPage() {
  const { id: smartHomeId } = useParams();
  const [smartHome, setSmartHome] = useState(null);
  const [owner, setOwner] = useState(null);
  const [members, setMembers] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [expandedMember, setExpandedMember] = useState(null);
  const [profileData, setProfileData] = useState({});
  const [loadingProfiles, setLoadingProfiles] = useState({});
  const [isAddMemberDropdownOpen, setIsAddMemberDropdownOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');
  
  // Fetch current user info from localStorage token
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      // Simple way to get user ID from token
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        if (tokenData.user_id) {
          // Fetch current user details
          api.get(`/users/${tokenData.user_id}/`)
            .then(response => {
              setCurrentUser(response.data);
              // Refetch available users if user changes and smart home data is loaded
              if (smartHome && response.data.id === smartHome.creator) {
                fetchAvailableUsers();
              }
            })
            .catch(err => {
              console.error("Error fetching current user:", err);
            });
        }
      } catch (e) {
        console.error("Error parsing token:", e);
      }
    }
  }, [smartHome]);
  
  // Fetch smart home data
  useEffect(() => {
    const fetchSmartHomeData = async () => {
      try {
        setLoading(true);
        
        // Get smart home details
        const smartHomeResponse = await api.get(`/smarthomes/${smartHomeId}/`);
        const homeData = smartHomeResponse.data;
        setSmartHome(homeData);
        
        // Get owner details
        const ownerResponse = await api.get(`/users/${homeData.creator}/`);
        setOwner(ownerResponse.data);
        
        // Get all members details
        if (homeData.members && homeData.members.length > 0) {
          const memberPromises = homeData.members.map(memberId => 
            api.get(`/users/${memberId}/`)
          );
          
          const memberResponses = await Promise.all(memberPromises);
          const memberData = memberResponses.map(response => response.data);
          setMembers(memberData);
        }
        
        setLoading(false);

        if (homeData.creator === currentUser?.id) {
          fetchAvailableUsers();
        }
      } catch (err) {
        console.error("Error fetching smart home data:", err);
        setError("Failed to load home users. Please try again.");
        setLoading(false);
      }
    };
    
    fetchSmartHomeData();
  }, [smartHomeId]);
  
  // Toggle member profile dropdown
  const toggleMemberProfile = async (memberId) => {
    // If this member is already expanded, collapse it
    if (expandedMember === memberId) {
      setExpandedMember(null);
      return;
    }
    
    // If we're switching to a new member, set it as expanded
    setExpandedMember(memberId);
    
    // Check if we already have this profile data
    if (!profileData[memberId]) {
      // Set loading state for this profile
      setLoadingProfiles(prev => ({ ...prev, [memberId]: true }));
      
      try {
        // First, get the basic user information (it might already include profile data)
        const userResponse = await api.get(`/users/${memberId}/`);
        const userData = userResponse.data;
        
        // Attempt to fetch additional profile data if it exists
        try {
          const profileResponse = await api.get(`/users/${memberId}/profile/`);
          const profileData = profileResponse.data;
          
          // Combine user and profile data
          setProfileData(prev => ({
            ...prev,
            [memberId]: {
              ...userData,
              profile: profileData
            }
          }));
        } catch (profileErr) {
          // If profile endpoint fails, just use the basic user data
          console.warn("Couldn't fetch detailed profile, using basic user data:", profileErr);
          setProfileData(prev => ({
            ...prev,
            [memberId]: userData
          }));
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setLoadingProfiles(prev => ({ ...prev, [memberId]: false }));
      }
    }
  };
  
  // Handle member removal
  const handleRemoveMember = async () => {
    if (!memberToRemove || !smartHome) return;
    
    try {
      // Create updated smart home object with member removed
      const updatedMembers = smartHome.members.filter(id => id !== memberToRemove.id);
      
      // Update smart home with new members list
      await api.put(`/smarthomes/${smartHomeId}/`, {
        ...smartHome,
        members: updatedMembers
      });
      
      // Update local state
      setMembers(prevMembers => prevMembers.filter(member => member.id !== memberToRemove.id));
      setSmartHome(prev => ({...prev, members: updatedMembers}));
      setIsDeleteModalOpen(false);
      setMemberToRemove(null);
      
      // Also clean up profile data and expanded state if needed
      if (expandedMember === memberToRemove.id) {
        setExpandedMember(null);
      }
      
      // Remove profile data for this member
      const newProfileData = {...profileData};
      delete newProfileData[memberToRemove.id];
      setProfileData(newProfileData);
      
    } catch (err) {
      console.error("Error removing member:", err);
      alert("Failed to remove member. Please try again.");
    }
  };
  
  // Show confirmation dialog for member removal
  const confirmMemberRemoval = (member, event) => {
    // Prevent the dropdown toggle from firing
    if (event) {
      event.stopPropagation();
    }
    
    setMemberToRemove(member);
    setIsDeleteModalOpen(true);
  };
  
  // Format date string (YYYY-MM-DD to readable format)
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format gender code to readable text
  const formatGender = (genderCode) => {
    if (!genderCode) return "-";
    
    const genderMap = {
      'M': 'Male',
      'F': 'Female',
      'O': 'Other'
    };
    
    return genderMap[genderCode] || genderCode;
  };
  
  // Check if current user is the owner
  const isOwner = currentUser && owner && currentUser.id === owner.id;
  
  // Add this function inside the component
  const fetchAvailableUsers = async (forceRefresh = false) => {
    if (!isOwner) return;
    
    try {
      setAddMemberError('');
      
      // If forceRefresh is true, get the latest smart home data first
      let currentSmartHome = smartHome;
      if (forceRefresh) {
        const refreshedHomeResponse = await api.get(`/smarthomes/${smartHomeId}/`);
        currentSmartHome = refreshedHomeResponse.data;
        setSmartHome(currentSmartHome); // Update state with fresh data
      }
      
      // Get all users
      const usersResponse = await api.get('/users/');
      const allUsers = usersResponse.data;
      
      // Filter out users who are already members or the owner using the latest data
      const currentMemberIds = [...(currentSmartHome?.members || []), currentSmartHome?.creator];
      
      const filteredUsers = allUsers.filter(user => 
        !currentMemberIds.includes(user.id)
      );
      
      setAvailableUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching available users:", error);
      setAddMemberError("Failed to load available users. Click to retry.");
    }
  };

  // Add this function inside the component
  const handleAddMember = async () => {
    if (!selectedUser) return;
    
    setIsAddingMember(true);
    setAddMemberError('');
    
    try {
      // Get current members array
      const currentMembers = [...(smartHome.members || [])];
      
      // Add the selected user to members array
      const updatedMembers = [...currentMembers, parseInt(selectedUser)];
      
      // Update the smart home with new members list
      await api.patch(`/smarthomes/${smartHomeId}/`, {
        members: updatedMembers
      });
      
      // Update local state
      setSmartHome(prev => ({...prev, members: updatedMembers}));
      
      // Fetch the new member's details to add to members list
      const newMemberResponse = await api.get(`/users/${selectedUser}/`);
      setMembers(prev => [...prev, newMemberResponse.data]);
      
      // Reset dropdown state
      setSelectedUser('');
      setIsAddMemberDropdownOpen(false);
      
      // Refresh available users
      fetchAvailableUsers();
      
    } catch (error) {
      console.error("Error adding member:", error);
      setAddMemberError("Failed to add member. Please try again.");
    } finally {
      setIsAddingMember(false);
    }
  };

  // Update the dropdown button click handler to force a refresh
  const toggleMemberDropdown = () => {
    // If we're opening the dropdown, refresh the data first
    if (!isAddMemberDropdownOpen) {
      fetchAvailableUsers(true); // Pass true to force a refresh
    }
    
    setIsAddMemberDropdownOpen(!isAddMemberDropdownOpen);
  };

  return (
    <div className="home-users-page">
      <Navbar />
      
      {/* Move back button here, outside the content div */}
      <div className="back-to-overview">
        <Link to={`/smarthomepage/${smartHomeId}`} className="back-button">
          <span>Overview</span>
          <ChevronLeft />
        </Link>
      </div>
      
      <div className="home-users-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading home details...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <div className="home-header">
              <div className="title-row">
                <h1 className="home-name">{smartHome?.name}</h1>
                <p className="home-owner">
                  Created and managed by <span>{owner?.username}</span>
                </p>
              </div>
              
              {/* Add Member Dropdown - Only visible to the owner */}
              {isOwner && (
                <div className="add-member-dropdown">
                  <button 
                    className="add-member-button"
                    onClick={toggleMemberDropdown} // Use the new function
                  >
                    <UserPlus size={18} />
                    <span>Add Members</span>
                    <ChevronDown 
                      size={16} 
                      className={`dropdown-arrow ${isAddMemberDropdownOpen ? 'open' : ''}`}
                    />
                  </button>
                  
                  {isAddMemberDropdownOpen && (
                    <div className="member-dropdown-menu">
                      {addMemberError && (
                        <div 
                          className="add-member-error clickable" 
                          onClick={() => fetchAvailableUsers(true)}
                        >
                          {addMemberError}
                        </div>
                      )}
                      
                      {availableUsers.length === 0 && !addMemberError ? (
                        <div className="no-available-users">
                          No users available to add
                          <button className="refresh-button" onClick={() => fetchAvailableUsers(true)}>
                            Refresh List
                          </button>
                        </div>
                      ) : (
                        <>
                          <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="user-select"
                          >
                            <option value="">Select a user...</option>
                            {availableUsers.map(user => (
                              <option key={user.id} value={user.id}>{user.username}</option>
                            ))}
                          </select>
                          
                          <button 
                            className="add-user-button"
                            onClick={handleAddMember}
                            disabled={!selectedUser || isAddingMember}
                          >
                            {isAddingMember ? "Adding..." : "Add User"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="members-container">
              <h2>Home Members</h2>
              
              {members.length === 0 ? (
                <p className="no-members-message">
                  This home currently has no additional members besides the owner.
                </p>
              ) : (
                <ul className="members-list">
                  {members.map(member => (
                    <li 
                      key={member.id} 
                      className={`member-item ${expandedMember === member.id ? 'expanded' : ''}`}
                      onClick={() => toggleMemberProfile(member.id)}
                    >
                      <div className="member-item-header">
                        <div className="member-info">
                          <div className="member-icon">
                            <i className="fa-solid fa-user"></i>
                          </div>
                          <span className="member-name">{member.username}</span>
                        </div>
                        
                        <div className="member-actions">
                          <span className="dropdown-indicator">
                            <i className={`fa-solid ${expandedMember === member.id ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                          </span>
                          
                          {isOwner && (
                            <button 
                              className="remove-button"
                              onClick={(e) => confirmMemberRemoval(member, e)}
                            >
                              <i className="fa-solid fa-user-minus"></i> Remove
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Profile Dropdown Content */}
                      {expandedMember === member.id && (
                        <div className="member-profile">
                          {loadingProfiles[member.id] ? (
                            <div className="profile-loading">
                              <div className="loading-spinner-small"></div>
                              <span>Loading profile...</span>
                            </div>
                          ) : profileData[member.id] ? (
                            <div className="profile-details">
                              <div className="profile-section simplified">
                                <div className="profile-fields">
                                  <div className="profile-field">
                                    <span className="field-label">Email:</span>
                                    <span className="field-value">{profileData[member.id].email || "-"}</span>
                                  </div>
                                  <div className="profile-field">
                                    <span className="field-label">Full Name:</span>
                                    <span className="field-value">
                                      {profileData[member.id].first_name || profileData[member.id].last_name 
                                        ? `${profileData[member.id].first_name || ""} ${profileData[member.id].last_name || ""}`.trim()
                                        : "-"}
                                    </span>
                                  </div>
                                  <div className="profile-field">
                                    <span className="field-label">Phone:</span>
                                    <span className="field-value">
                                      {profileData[member.id]?.profile?.phone_number || "-"}
                                    </span>
                                  </div>
                                  <div className="profile-field date-of-birth-field">
                                    <span className="field-label">Date of Birth:</span>
                                    <span className="field-value">
                                      {profileData[member.id]?.profile?.date_of_birth 
                                        ? formatDate(profileData[member.id].profile.date_of_birth)
                                        : "-"}
                                    </span>
                                  </div>
                                  <div className="profile-field">
                                    <span className="field-label">Gender:</span>
                                    <span className="field-value">
                                      {profileData[member.id]?.profile?.gender 
                                        ? formatGender(profileData[member.id].profile.gender)
                                        : "-"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="profile-error">
                              <i className="fa-solid fa-triangle-exclamation"></i>
                              <span>Could not load profile information</span>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              
              {!isOwner && members.length > 0 && (
                <p className="owner-note">
                  Note: Only the home owner can add or remove members.
                </p>
              )}
            </div>
          </>
        )}
        
        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Remove Member</h2>
              <p>
                Are you sure you want to remove <strong>{memberToRemove?.username}</strong> from this home?
                <br /><br />
                They will lose access to all devices and rooms in this smart home.
              </p>
              <div className="modal-buttons">
                <button onClick={handleRemoveMember} className="remove-confirm-btn">
                  Yes, Remove
                </button>
                <button onClick={() => setIsDeleteModalOpen(false)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeUsersPage;