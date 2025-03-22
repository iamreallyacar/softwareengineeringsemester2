import React, { useEffect, useState } from "react";
import api from "../api";
import LoadingElement from "./LoadingElement.js";
import Background from "./Background.js";
import Navbar from "./NavigationBar";
import "../css/profile.css";
import { useNavigate } from "react-router-dom";

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
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteError, setDeleteError] = useState("");

    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
    const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
    const [regenerateLoading, setRegenerateLoading] = useState(false);
    const [recoveryCodesError, setRecoveryCodesError] = useState("");
    const [expandedCodeIndex, setExpandedCodeIndex] = useState(null);

    useEffect(() => {
        fetchProfile();
        fetchRecoveryCodes();
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

    const fetchRecoveryCodes = async () => {
        setLoadingCodes(true);
        setRecoveryCodesError('');
        
        try {
          const response = await api.get('/recovery-codes/list/');
          console.log('Recovery codes response:', response.data); // Debug log
          
          // Make sure we're extracting the codes array correctly
          if (response.data && response.data.codes) {
            // This is the important line - we need to make sure we're getting the actual code strings
            setRecoveryCodes(response.data.codes);
            // DO NOT set showRecoveryCodes to true here
          } else {
            console.error('Unexpected response format:', response.data);
            setRecoveryCodesError('Unable to read recovery codes from server response');
            setRecoveryCodes([]);
          }
        } catch (error) {
          console.error('Error fetching recovery codes:', error);
          setRecoveryCodesError('Unable to fetch recovery codes. Please try again.');
          setRecoveryCodes([]);
        } finally {
          setLoadingCodes(false);
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

    // Update the saveField function to check phone number uniqueness
    const saveField = async () => {
        if (!userData) return;
        
        try {
            setLoading(true);
            const fieldName = editingField;
            const newValue = editValues[fieldName];
            
            // Different handling based on field type
            if (['username', 'email', 'first_name', 'last_name'].includes(fieldName)) {
                try {
                    // For email field, check uniqueness first
                    if (fieldName === 'email' && newValue) {
                        // Check if email already exists
                        try {
                            const checkResponse = await api.get(`/users/?email=${newValue}`);
                            // If response contains users with this email (excluding current user)
                            const existingUsers = checkResponse.data.filter(user => 
                                user.email === newValue && user.id !== userData.id
                            );
                            
                            if (existingUsers.length > 0) {
                                setError("This email is already registered. Please use a different one.");
                                // Add timeout to clear error
                                setTimeout(() => {
                                    setError("");
                                }, 3000);
                                setLoading(false);
                                return; // Stop the process here
                            }
                        } catch (checkErr) {
                            console.error("Error checking email uniqueness:", checkErr);
                            // Continue with update and let the backend handle any issues
                        }
                    }
                    
                    // Update user information
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
                    console.error("API error details:", err.response?.data);
                    
                    // Handle all possible error formats from Django REST Framework
                    if (fieldName === 'username') {
                        if (err.response?.data?.username || 
                            (typeof err.response?.data === 'object' && err.response?.data?.detail?.includes("username"))) {
                            setError("This username is already taken. Please choose a different one.");
                            // Add timeout to clear error
                            setTimeout(() => {
                                setError("");
                            }, 3000);
                            return;
                        }
                    } 
                    else if (fieldName === 'email') {
                        // Check all possible error response formats
                        if (err.response?.data?.email || 
                            (typeof err.response?.data === 'object' && err.response?.data?.detail?.includes("email")) ||
                            (err.response?.status === 400 && err.response?.data?.non_field_errors)) {
                            setError("This email is already registered. Please use a different one.");
                            // Add timeout to clear error
                            setTimeout(() => {
                                setError("");
                            }, 3000);
                            return;
                        }
                    }
                    
                    // For other errors
                    throw err;
                }
            } else if (['phone_number', 'date_of_birth', 'gender'].includes(fieldName)) {
                try {
                    // Update profile fields without uniqueness checks
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
                    
                    // Exit edit mode and show success message for profile fields
                    setSuccess(`${fieldName.replace('_', ' ')} updated successfully!`);
                    setEditingField(null);
                } catch (err) {
                    console.error("Profile update error:", err);
                    setError(`Failed to update ${fieldName.replace('_', ' ')}. Please try again.`);
                    
                    // Add timeout to clear error
                    setTimeout(() => {
                        setError("");
                    }, 3000);
                }
            }
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess("");
            }, 3000);
        } catch (error) {
            console.error("Error updating field:", error);
            console.error("Response data:", error.response?.data);
            setError(error.response?.data?.detail || `Failed to update ${editingField}`);
            // Add timeout to clear error
            setTimeout(() => {
                setError("");
            }, 3000);
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
                    // Add timeout to clear error
                    setTimeout(() => {
                        setError("");
                    }, 3000);
                }
            } else {
                setError("An error occurred. Please try again.");
                // Add timeout to clear error
                setTimeout(() => {
                    setError("");
                }, 3000);
            }
        } finally {
            setLoading(false);
        }
    };

    // Update the handleDeleteAccount function to redirect to create account page
    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setDeleteError("Please enter your password to confirm account deletion");
            return;
        }
        
        try {
            setLoading(true);
            
            // First authenticate the password
            try {
                await api.post(`/users/${userData.id}/change_password/`, {
                    current_password: deletePassword,
                    new_password: deletePassword // Using same password - just verifying it's correct
                });
                
                // If we get here, password is correct, proceed with deletion
                await api.delete(`/users/${userData.id}/`);
                
                // On successful deletion, log out and redirect to create account page
                localStorage.removeItem("token");
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
                
                // Redirect to the root path which shows create account for non-authenticated users
                navigate("/");
                window.location.reload(); // Force reload to update authentication state
            } catch (err) {
                // Password verification failed
                if (err.response?.status === 400) {
                    setDeleteError("Incorrect password. Please try again.");
                } else {
                    throw err; // Re-throw for the outer catch to handle
                }
            }
        } catch (error) {
            console.error("Error deleting account:", error);
            setDeleteError("Failed to delete your account. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerateCodes = async () => {
        // If there are existing codes, show confirmation first
        if (recoveryCodes.length > 0 && !showRegenerateConfirm) {
          setShowRegenerateConfirm(true);
          return;
        }
        
        setRegenerateLoading(true);
        setRecoveryCodesError('');
        
        try {
          const response = await api.post('/recovery-codes/generate/');
          setRecoveryCodes(response.data.codes || []);
          setShowRecoveryCodes(true);
          setShowRegenerateConfirm(false);
        } catch (error) {
          console.error('Error regenerating recovery codes:', error);
          setRecoveryCodesError('Failed to generate new recovery codes. Please try again.');
        } finally {
          setRegenerateLoading(false);
        }
    };

    const handleCopyRecoveryCodes = () => {
        const codesText = recoveryCodes.join('\n');
        navigator.clipboard.writeText(codesText)
          .then(() => {
            alert('Recovery codes copied to clipboard!');
          })
          .catch(err => {
            console.error('Failed to copy codes:', err);
            alert('Failed to copy. Please select and copy the codes manually.');
          });
    };

    const handlePrintRecoveryCodes = () => {
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
          <html>
            <head>
              <title>Your Recovery Codes - Peaches Smart Home</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #C14600; margin-bottom: 20px; }
                h2 { color: #333; margin-top: 30px; }
                .code-list { margin: 20px 0; }
                .code-item { 
                  font-family: monospace; 
                  padding: 8px 15px;
                  margin: 5px 0;
                  background-color: #f5f5f5;
                  border-radius: 4px;
                  display: inline-block;
                  margin-right: 10px;
                  font-size: 16px;
                }
                .warning {
                  background-color: #fff8e1;
                  border-left: 4px solid #ffc107;
                  padding: 15px;
                  margin: 20px 0;
                }
                .footer {
                  margin-top: 40px;
                  border-top: 1px solid #eee;
                  padding-top: 20px;
                  font-size: 12px;
                  color: #666;
                }
              </style>
            </head>
            <body>
              <h1>Your Recovery Codes - Peaches Smart Home</h1>
              
              <div class="warning">
                <strong>IMPORTANT:</strong> Keep these codes in a safe place. They are the only way to recover your account 
                if you forget your password. Each code can only be used once.
              </div>
              
              <h2>Your Recovery Codes:</h2>
              <div class="code-list">
                ${recoveryCodes.map(code => `<div class="code-item">${code}</div>`).join('\n')}
              </div>
              
              <div class="warning">
                <strong>Remember:</strong>
                <ul>
                  <li>Keep these codes private and secure</li>
                  <li>Each code can be used only once</li>
                  <li>Store these somewhere safe like a password manager</li>
                </ul>
              </div>
              
              <div class="footer">
                <p>Generated on ${new Date().toLocaleString()}</p>
                <p>Peaches Smart Home - Account Recovery</p>
              </div>
            </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
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
            <Background showLogo={false} blurEffect={true}  />
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
                        
                        {/* Email Field - add clear error feedback */}
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
                                    {error && error.includes("email") && (
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
                        
                        {/* First Name Field - fix className typo */}
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
                                    <div className="field-info">
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
                        
                        {/* Phone Number Field - simplified without uniqueness checks */}
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
                                        <button onClick={saveField} disabled={loading}>
                                            {loading ? 'Saving...' : 'Save'}
                                        </button>
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

                    <div className="section-divider"></div>

                    {/* RECOVERY CODES SECTION */}
                    <div className="profile-card">
                        <h2 className="profile-section-title">Account Recovery Codes</h2>
                        
                        <div className="profile-section-content">
                            <p className="profile-section-description">
                                Recovery codes allow you to regain access to your account if you forget your password.
                                Each code can be used only once for account recovery.
                            </p>
                            
                            {recoveryCodesError && (
                            <div className="profile-error-message">
                                {recoveryCodesError}
                            </div>
                            )}
                            
                            {loadingCodes ? (
                            <div className="profile-loading">Loading recovery codes...</div>
                            ) : (
                            <>
                                {recoveryCodes.length > 0 ? (
                                <div className="recovery-codes-container">
                                    <div className="recovery-codes-header" onClick={() => setShowRecoveryCodes(!showRecoveryCodes)}>
                                        <div className="recovery-codes-status">
                                            <strong>{recoveryCodes.length}</strong> recovery {recoveryCodes.length === 1 ? 'code' : 'codes'} remaining
                                        </div>
                                        <div className="recovery-codes-toggle">
                                            <i className={`fa-solid ${showRecoveryCodes ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                                        </div>
                                    </div>
                                    
                                    {showRecoveryCodes && (
                                    <>
                                        <div className="recovery-codes-actions">
                                            <button 
                                                className="recovery-action-button"
                                                onClick={handleCopyRecoveryCodes}
                                            >
                                                <i className="fa-solid fa-copy"></i> Copy Codes
                                            </button>
                                            
                                            <button 
                                                className="recovery-action-button"
                                                onClick={handlePrintRecoveryCodes}
                                            >
                                                <i className="fa-solid fa-print"></i> Print Codes
                                            </button>
                                        </div>
                                        
                                        <div className="recovery-codes-list">
                                            {recoveryCodes.map((code, index) => (
                                                <div key={index} className="recovery-code-item">
                                                    <span className="code-number">{index + 1}.</span>
                                                    <code className="code-text">{code}</code>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                    )}
                                </div>
                                ) : (
                                <p className="no-recovery-codes">
                                    You don't have any recovery codes. Generate some to ensure you can recover your account if needed.
                                </p>
                                )}
                                
                                {showRegenerateConfirm ? (
                                <div className="regenerate-confirm">
                                    <p className="warning-message">
                                    <strong>Warning:</strong> Generating new recovery codes will invalidate all existing ones. 
                                    Are you sure you want to continue?
                                    </p>
                                    <div className="confirm-buttons">
                                    <button 
                                        className="profile-danger-button"
                                        onClick={handleRegenerateCodes}
                                        disabled={regenerateLoading}
                                    >
                                        {regenerateLoading ? 'Generating...' : 'Yes, Generate New Codes'}
                                    </button>
                                    <button 
                                        className="profile-cancel-button"
                                        onClick={() => setShowRegenerateConfirm(false)}
                                        disabled={regenerateLoading}
                                    >
                                        Cancel
                                    </button>
                                    </div>
                                </div>
                                ) : (
                                <button 
                                    className="profile-primary-button" 
                                    onClick={handleRegenerateCodes}
                                    disabled={regenerateLoading}
                                >
                                    {regenerateLoading ? 'Generating...' : recoveryCodes.length > 0 ? 'Regenerate Recovery Codes' : 'Generate Recovery Codes'}
                                </button>
                                )}
                            </>
                            )}
                        </div>
                    </div>

                    {/* Account Deletion Section - Updated Layout */}
                    <div className="account-deletion-section">
                        <h2 className="deletion-title">Delete Account</h2>
                        
                        <p className="danger-text">
                            Deleting your account is permanent and will remove all your data, including smart homes, rooms, and devices.
                        </p>
                        
                        <div className="deletion-button-container">
                            <button 
                                className="delete-account-button"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <i className="fa-solid fa-trash"></i> Delete My Account
                            </button>
                        </div>
                    </div>

                    {/* Delete Account Confirmation Modal */}
                    {showDeleteConfirm && (
                        <div className="modal-overlay">
                            <div className="delete-confirm-modal">
                                <div className="modal-header">
                                    <h3>Confirm Account Deletion</h3>
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
                                        This action cannot be undone. All your data will be permanently deleted.
                                    </p>
                                    
                                    <div className="confirm-password-field">
                                        <label>Enter your password to confirm:</label>
                                        <input
                                            type="password"
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            placeholder="Your current password"
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
                                            onClick={handleDeleteAccount}
                                            disabled={loading}
                                        >
                                            {loading ? "Deleting..." : "Permanently Delete Account"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;