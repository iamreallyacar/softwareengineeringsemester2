import React, { useEffect, useState } from "react";
import api from "../api";
import LoadingElement from "./LoadingElement.js";
import Background from "./Background.js";
import Navbar from "./NavigationBar";
import "../css/profile.css";

function ProfilePage() {
    const [userData, setUserData] = useState(null);
    const [editingField, setEditingField] = useState(null);
    const [editValues, setEditValues] = useState({});
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(true);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });
    const [passwordErrors, setPasswordErrors] = useState({});

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get("/user/current/");
            console.log("User data:", response.data);
            setUserData(response.data);
            // Initialize edit values with current data
            setEditValues({
                username: response.data.username || "",
                email: response.data.email || "",
                first_name: response.data.first_name || "",
                last_name: response.data.last_name || "",
                phone_number: response.data.profile?.phone_number || "",
                date_of_birth: response.data.profile?.date_of_birth || "",
                gender: response.data.profile?.gender || ""
            });
        } catch (error) {
            console.error("Profile fetch error:", error.response?.data || error.message);
            setError("Failed to load profile information.");
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (field) => {
        setEditingField(field);
        // Set empty value for the field being edited
        setEditValues(prev => ({
            ...prev,
            [field]: ""
        }));
        // Reset any previous errors/success messages
        setError("");
        setSuccess("");
    };

    const handleCancelEdit = () => {
        setEditingField(null);
        // Reset edit values to current data
        if (userData) {
            setEditValues({
                username: userData.username || "",
                email: userData.email || "",
                first_name: userData.first_name || "",
                last_name: userData.last_name || "",
                phone_number: userData.profile?.phone_number || "",
                date_of_birth: userData.profile?.date_of_birth || "",
                gender: userData.profile?.gender || ""
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditValues(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear specific error when typing
        if (passwordErrors[name]) {
            setPasswordErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const saveField = async () => {
        if (!userData) return;
        
        try {
            setLoading(true);
            const fieldName = editingField;
            const newValue = editValues[fieldName];
            
            // Different handling based on field type
            if (['username', 'email', 'first_name', 'last_name'].includes(fieldName)) {
                try {
                    // Update user basic information
                    await api.patch(`/users/${userData.id}/`, {
                        [fieldName]: newValue
                    });
                    
                    // Update local state
                    setUserData(prev => ({
                        ...prev,
                        [fieldName]: newValue
                    }));
                    
                    setSuccess(`${fieldName.replace('_', ' ')} updated successfully!`);
                    setEditingField(null);
                } catch (err) {
                    // Handle specific error for username uniqueness
                    if (fieldName === 'username' && err.response?.data?.username) {
                        setError("This username is already taken. Please choose a different one.");
                    } else if (fieldName === 'email' && err.response?.data?.email) {
                        setError("This email is already registered. Please use a different one.");
                    } else {
                        throw err; // Re-throw for the outer catch to handle other errors
                    }
                }
            } else if (['phone_number', 'date_of_birth', 'gender'].includes(fieldName)) {
                // Update user profile information
                if (userData.profile) {
                    // Update existing profile
                    await api.patch(`/user-profiles/${userData.profile.id}/`, {
                        [fieldName]: newValue || null
                    });
                } else {
                    // Create new profile
                    const profileResponse = await api.post('/user-profiles/', {
                        user: userData.id,
                        [fieldName]: newValue || null
                    });
                    
                    // Update local state with new profile
                    setUserData(prev => ({
                        ...prev,
                        profile: profileResponse.data
                    }));
                }
                
                // Update local state for profile fields
                setUserData(prev => ({
                    ...prev,
                    profile: {
                        ...prev.profile,
                        [fieldName]: newValue
                    }
                }));
            }
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess("");
            }, 3000);
        } catch (error) {
            console.error("Error updating field:", error);
            setError(error.response?.data?.detail || `Failed to update ${editingField}`);
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async () => {
        // Validate password inputs
        const errors = {};
        if (!passwordData.current_password) {
            errors.current_password = "Current password is required";
        }
        if (!passwordData.new_password) {
            errors.new_password = "New password is required";
        }
        if (passwordData.new_password.length < 8) {
            errors.new_password = "Password must be at least 8 characters";
        }
        if (!passwordData.confirm_password) {
            errors.confirm_password = "Please confirm your new password";
        }
        if (passwordData.new_password !== passwordData.confirm_password) {
            errors.confirm_password = "Passwords do not match";
        }
        
        if (Object.keys(errors).length > 0) {
            setPasswordErrors(errors);
            return;
        }
        
        try {
            setLoading(true);
            
            await api.post(`/users/${userData.id}/change_password/`, {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            
            // Reset form and show success message
            setPasswordData({
                current_password: "",
                new_password: "",
                confirm_password: ""
            });
            
            setIsChangingPassword(false);
            setSuccess("Password changed successfully!");
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess("");
            }, 3000);
        } catch (error) {
            console.error("Error changing password:", error);
            
            if (error.response && error.response.data) {
                // Handle specific errors from the backend
                if (error.response.data.current_password) {
                    setPasswordErrors({
                        current_password: "Current password is incorrect"
                    });
                } else {
                    setError("Failed to change password. Please try again.");
                }
            } else {
                setError("An error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Format gender for display
    const formatGender = (genderCode) => {
        if (!genderCode) return "-";
        
        const genderMap = {
            'M': 'Male',
            'F': 'Female',
            'O': 'Other'
        };
        
        return genderMap[genderCode] || genderCode;
    };

    if (loading && !userData) return <LoadingElement />;

    return (
        <div className="profile-container">
            <Navbar />
            
            <div className="profile-content">
                <h1 className="profile-title">My Profile</h1>
                
                {success && (
                    <div className="profile-success-message">
                        <i className="fa-solid fa-check-circle"></i> {success}
                    </div>
                )}
                
                {error && (
                    <div className="profile-error-message">
                        <i className="fa-solid fa-exclamation-circle"></i> {error}
                    </div>
                )}

                <div className="profile-card">
                    <div className="profile-avatar">
                        <i className="fa-solid fa-user-circle"></i>
                    </div>
                    
                    <div className="profile-fields">
                        {/* Username Field */}
                        <div className="profile-field">
                            {editingField === 'username' ? (
                                <div className="field-edit">
                                    <input 
                                        type="text" 
                                        name="username" 
                                        value={editValues.username} 
                                        onChange={handleInputChange}
                                        placeholder={userData?.username || ""}
                                    />
                                    {error && error.includes("username") && (
                                        <div className="field-note">
                                            <i className="fa-solid fa-info-circle"></i> {error}
                                        </div>
                                    )}
                                    <div className="edit-actions">
                                        <button onClick={saveField} disabled={loading}>Save</button>
                                        <button onClick={handleCancelEdit}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="field-row">
                                    <div className="field-info">
                                        <label>Username</label>
                                        <div className="field-value">{userData?.username || "-"}</div>
                                    </div>
                                    <button 
                                        className="edit-field-button"
                                        onClick={() => handleEditClick('username')}
                                        disabled={editingField === 'username'}
                                    >
                                        <i className="fa-solid fa-pencil"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Email Field */}
                        <div className="profile-field">
                            {editingField === 'email' ? (
                                <div className="field-edit">
                                    <input 
                                        type="email" 
                                        name="email" 
                                        value={editValues.email} 
                                        onChange={handleInputChange}
                                        placeholder={userData?.email || ""}
                                    />
                                    <div className="edit-actions">
                                        <button onClick={saveField} disabled={loading}>Save</button>
                                        <button onClick={handleCancelEdit}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="field-row">
                                    <div className="field-info">
                                        <label>Email</label>
                                        <div className="field-value">{userData?.email || "-"}</div>
                                    </div>
                                    <button 
                                        className="edit-field-button"
                                        onClick={() => handleEditClick('email')}
                                        disabled={editingField === 'email'}
                                    >
                                        <i className="fa-solid fa-pencil"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* First Name Field */}
                        <div className="profile-field">
                            {editingField === 'first_name' ? (
                                <div className="field-edit">
                                    <input 
                                        type="text" 
                                        name="first_name" 
                                        value={editValues.first_name} 
                                        onChange={handleInputChange}
                                        placeholder={userData?.first_name || ""}
                                    />
                                    <div className="edit-actions">
                                        <button onClick={saveField} disabled={loading}>Save</button>
                                        <button onClick={handleCancelEdit}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="field-row">
                                    <div classname="field-info">
                                        <label>First Name</label>
                                        <div className="field-value">{userData?.first_name || "-"}</div>
                                    </div>
                                    <button 
                                        className="edit-field-button"
                                        onClick={() => handleEditClick('first_name')}
                                        disabled={editingField === 'first_name'}
                                    >
                                        <i className="fa-solid fa-pencil"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Last Name Field */}
                        <div className="profile-field">
                            {editingField === 'last_name' ? (
                                <div className="field-edit">
                                    <input 
                                        type="text" 
                                        name="last_name" 
                                        value={editValues.last_name} 
                                        onChange={handleInputChange}
                                        placeholder={userData?.last_name || ""}
                                    />
                                    <div className="edit-actions">
                                        <button onClick={saveField} disabled={loading}>Save</button>
                                        <button onClick={handleCancelEdit}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="field-row">
                                    <div className="field-info">
                                        <label>Last Name</label>
                                        <div className="field-value">{userData?.last_name || "-"}</div>
                                    </div>
                                    <button 
                                        className="edit-field-button"
                                        onClick={() => handleEditClick('last_name')}
                                        disabled={editingField === 'last_name'}
                                    >
                                        <i className="fa-solid fa-pencil"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Phone Number Field */}
                        <div className="profile-field">
                            {editingField === 'phone_number' ? (
                                <div className="field-edit">
                                    <input 
                                        type="tel" 
                                        name="phone_number" 
                                        value={editValues.phone_number} 
                                        onChange={handleInputChange}
                                        placeholder={userData?.profile?.phone_number || ""}
                                    />
                                    <div className="edit-actions">
                                        <button onClick={saveField} disabled={loading}>Save</button>
                                        <button onClick={handleCancelEdit}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="field-row">
                                    <div className="field-info">
                                        <label>Phone Number</label>
                                        <div className="field-value">{userData?.profile?.phone_number || "-"}</div>
                                    </div>
                                    <button 
                                        className="edit-field-button"
                                        onClick={() => handleEditClick('phone_number')}
                                        disabled={editingField === 'phone_number'}
                                    >
                                        <i className="fa-solid fa-pencil"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Date of Birth Field */}
                        <div className="profile-field">
                            {editingField === 'date_of_birth' ? (
                                <div className="field-edit">
                                    <input 
                                        type="date" 
                                        name="date_of_birth" 
                                        value={editValues.date_of_birth} 
                                        onChange={handleInputChange}
                                        placeholder={userData?.profile?.date_of_birth || ""}
                                    />
                                    <div className="edit-actions">
                                        <button onClick={saveField} disabled={loading}>Save</button>
                                        <button onClick={handleCancelEdit}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="field-row">
                                    <div className="field-info">
                                        <label>Date of Birth</label>
                                        <div className="field-value">{userData?.profile?.date_of_birth || "-"}</div>
                                    </div>
                                    <button 
                                        className="edit-field-button"
                                        onClick={() => handleEditClick('date_of_birth')}
                                        disabled={editingField === 'date_of_birth'}
                                    >
                                        <i className="fa-solid fa-pencil"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Gender Field */}
                        <div className="profile-field">
                            {editingField === 'gender' ? (
                                <div className="field-edit">
                                    <select 
                                        name="gender" 
                                        value={editValues.gender} 
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                        <option value="O">Other</option>
                                    </select>
                                    <div className="edit-actions">
                                        <button onClick={saveField} disabled={loading}>Save</button>
                                        <button onClick={handleCancelEdit}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="field-row">
                                    <div className="field-info">
                                        <label>Gender</label>
                                        <div className="field-value">{userData?.profile?.gender ? formatGender(userData.profile.gender) : "-"}</div>
                                    </div>
                                    <button 
                                        className="edit-field-button"
                                        onClick={() => handleEditClick('gender')}
                                        disabled={editingField === 'gender'}
                                    >
                                        <i className="fa-solid fa-pencil"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="password-section">
                        <div className="section-header">
                            <h2>Password Management</h2>
                            {!isChangingPassword && (
                                <button 
                                    className="change-password-button"
                                    onClick={() => setIsChangingPassword(true)}
                                >
                                    <i className="fa-solid fa-key"></i> Change Password
                                </button>
                            )}
                        </div>

                        {isChangingPassword && (
                            <div className="password-change-form">
                                <div className="password-field">
                                    <label>Current Password</label>
                                    <input
                                        type="password"
                                        name="current_password"
                                        value={passwordData.current_password}
                                        onChange={handlePasswordChange}
                                        className={passwordErrors.current_password ? "error" : ""}
                                    />
                                    {passwordErrors.current_password && (
                                        <div className="field-error">{passwordErrors.current_password}</div>
                                    )}
                                </div>
                                
                                <div className="password-field">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        name="new_password"
                                        value={passwordData.new_password}
                                        onChange={handlePasswordChange}
                                        className={passwordErrors.new_password ? "error" : ""}
                                    />
                                    {passwordErrors.new_password && (
                                        <div className="field-error">{passwordErrors.new_password}</div>
                                    )}
                                </div>
                                
                                <div className="password-field">
                                    <label>Confirm New Password</label>
                                    <input
                                        type="password"
                                        name="confirm_password"
                                        value={passwordData.confirm_password}
                                        onChange={handlePasswordChange}
                                        className={passwordErrors.confirm_password ? "error" : ""}
                                    />
                                    {passwordErrors.confirm_password && (
                                        <div className="field-error">{passwordErrors.confirm_password}</div>
                                    )}
                                </div>
                                
                                <div className="password-actions">
                                    <button 
                                        className="save-password-button"
                                        onClick={changePassword}
                                        disabled={loading}
                                    >
                                        {loading ? "Changing..." : "Save New Password"}
                                    </button>
                                    <button 
                                        className="cancel-button"
                                        onClick={() => {
                                            setIsChangingPassword(false);
                                            setPasswordData({
                                                current_password: "",
                                                new_password: "",
                                                confirm_password: ""
                                            });
                                            setPasswordErrors({});
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;