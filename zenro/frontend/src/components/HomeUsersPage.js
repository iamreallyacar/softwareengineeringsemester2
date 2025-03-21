import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import api from "../api";
import "../css/home-users-page.css";

function HomeUsersPage() {
  const { id: smartHomeId } = useParams();
  const [smartHome, setSmartHome] = useState(null);
  const [owner, setOwner] = useState(null);
  const [members, setMembers] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch smart home data and members
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
      } catch (err) {
        console.error("Error fetching smart home data:", err);
        setError("Failed to load home users. Please try again later.");
        setLoading(false);
      }
    };
    
    fetchSmartHomeData();
  }, [smartHomeId]);
  
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
      setIsDeleteModalOpen(false);
      setMemberToRemove(null);
      
    } catch (err) {
      console.error("Error removing member:", err);
      alert("Failed to remove member. Please try again.");
    }
  };
  
  // Show confirmation dialog for member removal
  const confirmMemberRemoval = (member) => {
    setMemberToRemove(member);
    setIsDeleteModalOpen(true);
  };
  
  // Check if current user is the owner
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Try to get the user info from JWT token or session
        const response = await api.get('/users/me/');  // Or your actual current user endpoint
        setCurrentUser(response.data);
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };
    
    fetchCurrentUser();
  }, []);
  
  const isOwner = currentUser && owner && currentUser.id === owner.id;
  
  return (
    <div className="home-users-page">
      <Sidebar />
      
      <div className="home-users-content">
        {loading ? (
          <div className="loading-message">Loading home details...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <div className="home-header">
              <h1 className="home-name">{smartHome?.name}</h1>
              <p className="home-owner">
                Created and managed by <span>{owner?.username}</span>
              </p>
            </div>
            
            <div className="members-container">
              <h2>Home Members</h2>
              
              {members.length === 0 ? (
                <p className="no-members-message">
                  This home currently has no members besides the owner.
                </p>
              ) : (
                <ul className="members-list">
                  {members.map(member => (
                    <li key={member.id} className="member-item">
                      <div className="member-info">
                        <div className="member-icon">
                          <i className="fa-solid fa-user"></i>
                        </div>
                        <span className="member-name">{member.username}</span>
                      </div>
                      
                      {isOwner && (
                        <button 
                          className="remove-button"
                          onClick={() => confirmMemberRemoval(member)}
                        >
                          <i className="fa-solid fa-user-minus"></i> Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              
              {!isOwner && (
                <p className="owner-note">
                  Note: Only the home owner can remove members.
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
                Are you sure you want to remove {memberToRemove?.username} from this home?
                They will lose access to all devices and rooms.
              </p>
              <div className="modal-buttons">
                <button onClick={handleRemoveMember}>
                  Yes, Remove
                </button>
                <button onClick={() => setIsDeleteModalOpen(false)}>
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