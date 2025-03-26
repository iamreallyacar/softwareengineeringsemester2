import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Background from "./Background";
import "../css/recovery-page.css";

function RecoveryPage() {
  const navigate = useNavigate();
  
  // State for multi-step form
  const [step, setStep] = useState(1);
  
  // Form data
  const [username, setUsername] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [userFound, setUserFound] = useState(false);
  
  // New recovery codes (if generated)
  const [newRecoveryCodes, setNewRecoveryCodes] = useState([]);
  const [showingNewCodes, setShowingNewCodes] = useState(false);
  
  // Handler for username submission (Step 1)
  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter your username");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Verify the user exists
      const response = await api.get(`/users/?username=${encodeURIComponent(username)}`);
      
      if (Array.isArray(response.data) && 
          response.data.some(user => user.username.toLowerCase() === username.toLowerCase())) {
        setUserFound(true);
        setStep(2);
        setError("");
      } else {
        setError("Username not found. Please check and try again.");
      }
    } catch (err) {
      console.error("Error verifying username:", err);
      setError("Error verifying username. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for recovery code submission (Step 2)
  const handleRecoveryCodeSubmit = async (e) => {
    e.preventDefault();
    if (!recoveryCode.trim()) {
      setError("Please enter a recovery code");
      return;
    }
    
    // Format code to ensure it follows xxxxx-xxxxx pattern
    let formattedCode = formatRecoveryCode(recoveryCode);
    setRecoveryCode(formattedCode);
    
    setLoading(true);
    setError("");
    
    try {
      // Verify the recovery code is valid for this user before proceeding
      // make a special validation request that doesn't consume the code
      const validationResponse = await api.post('/validate-recovery-code/', {
        username: username,
        recovery_code: formattedCode
      });
      
      // If we get here, the code is valid for this user
      setStep(3);
    } catch (err) {
      console.error("Error validating recovery code:", err);
      // Handle specific error responses from the API
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Invalid or already used recovery code. Please try another code.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for password reset submission (Step 3)
  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (!newPassword) {
      setError("Please enter a new password");
      return;
    }
    
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Reset password using recovery code
      const response = await api.post('/reset-password-with-code/', {
        recovery_code: recoveryCode,
        new_password: newPassword
      });
      
      setSuccess(response.data.message || "Password reset successful!");
      
      // Check if this was the last code - response would indicate this
      const isLastCode = response.data.was_last_code;
      
      if (isLastCode) {
        try {
          // Get the user ID from the response
          const userId = response.data.user_id;
          
          // Set auth token temporarily for the user
          const tempToken = response.data.temp_token;
          localStorage.setItem("accessToken", tempToken);
          
          // Generate new recovery codes
          const codesResponse = await api.post('/recovery-codes/generate/');
          
          // Remove the temporary token
          localStorage.removeItem("accessToken");
          
          // Store the new codes to show to the user
          setNewRecoveryCodes(codesResponse.data.codes || []);
          setShowingNewCodes(true);
        } catch (codeErr) {
          console.error("Error generating new recovery codes:", codeErr);
          // Don't block the flow if this fails
        }
      } else {
        // Set a timeout to redirect to login page
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to reset password. Please check your recovery code and try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle continuing after viewing new recovery codes
  const handleContinue = () => {
    navigate("/login");
  };
  
  // Utility to format recovery code (xxxxx-xxxxx)
  const formatRecoveryCode = (code) => {
    // Remove any non-alphanumeric characters
    const cleaned = code.replace(/[^a-z0-9]/gi, '').toLowerCase();
    
    // If we have at least 10 characters, format as xxxxx-xxxxx
    if (cleaned.length >= 10) {
      return `${cleaned.substring(0, 5)}-${cleaned.substring(5, 10)}`;
    }
    
    // Otherwise, return as is
    return code;
  };
  
  // Handle recovery code format as user types
  const handleCodeChange = (e) => {
    const value = e.target.value;
    setRecoveryCode(value);
    
    // Only auto-format on blur
    if (e.type === 'blur' && value.trim() !== '') {
      setRecoveryCode(formatRecoveryCode(value));
    }
  };
  
  // Handle recovery code copy to clipboard
  const handleCopyRecoveryCodes = () => {
    const codesText = newRecoveryCodes.join('\n');
    navigator.clipboard.writeText(codesText)
      .then(() => {
        alert("Recovery codes copied to clipboard!");
      })
      .catch(err => {
        console.error('Failed to copy codes: ', err);
        alert("Failed to copy codes. Please copy them manually.");
      });
  };
  
  // Handle printing recovery codes
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
            ${newRecoveryCodes.map(code => `<div class="code-item">${code}</div>`).join('\n')}
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
  
  return (
    <div className="recovery-page">
      <Background showLogo={true} />
      
      {!showingNewCodes ? (
        <div className="recovery-container">
          <div className="recovery-content">
            <h1 className="recovery-title">Account Recovery</h1>
            
            {success && (
              <div className="recovery-success">
                {success}
              </div>
            )}
            
            {error && (
              <div className="recovery-error">
                {error}
              </div>
            )}
            
            {step === 1 && (
              <form className="recovery-form" onSubmit={handleUsernameSubmit}>
                <div className="recovery-step-indicator">
                  Step 1 of 3: Identify Your Account
                </div>
                
                <p className="recovery-description">
                  Enter your username to start the account recovery process.
                </p>
                
                <div className="recovery-input-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your username"
                    required
                  />
                </div>
                
                <div className="recovery-actions">
                  <button 
                    type="submit" 
                    className="recovery-button"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Continue"}
                  </button>
                  
                  <button 
                    type="button" 
                    className="recovery-secondary-button"
                    onClick={() => navigate("/login")}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
            
            {step === 2 && (
              <form className="recovery-form" onSubmit={handleRecoveryCodeSubmit}>
                <div className="recovery-step-indicator">
                  Step 2 of 3: Enter Recovery Code
                </div>
                
                <p className="recovery-description">
                  Enter one of your recovery codes. These are the codes you received when you created your account or generated from your profile.
                </p>
                
                <div className="recovery-input-group">
                  <label htmlFor="recoveryCode">Recovery Code</label>
                  <input
                    type="text"
                    id="recoveryCode"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    onBlur={handleCodeChange}
                    placeholder="Format: xxxxx-xxxxx"
                    required
                  />
                  <small className="recovery-input-hint">
                    The code should be in format: xxxxx-xxxxx
                  </small>
                </div>
                
                <div className="recovery-actions">
                  <button 
                    type="submit" 
                    className="recovery-button"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Continue"}
                  </button>
                  
                  <button 
                    type="button" 
                    className="recovery-secondary-button"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
            
            {step === 3 && (
              <form className="recovery-form" onSubmit={handlePasswordResetSubmit}>
                <div className="recovery-step-indicator">
                  Step 3 of 3: Reset Your Password
                </div>
                
                <p className="recovery-description">
                  Create a new password for your account.
                </p>
                
                <div className="recovery-input-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                  />
                </div>
                
                <div className="recovery-input-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                
                <div className="recovery-actions">
                  <button 
                    type="submit" 
                    className="recovery-button"
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                  
                  <button 
                    type="button" 
                    className="recovery-secondary-button"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="recovery-container">
          <div className="recovery-content">
            <h1 className="recovery-title">New Recovery Codes</h1>
            
            <div className="recovery-codes-info">
              <p className="recovery-codes-message">
                <strong>Important:</strong> These are your new account recovery codes. 
                Save these codes in a secure location - they're the only way to access 
                your account if you forget your password again.
              </p>
              <p className="recovery-codes-message">
                Each code can only be used once. Once you've used a code to recover 
                your account, it will be invalidated.
              </p>
            </div>
            
            <div className="recovery-codes-list">
              {newRecoveryCodes.map((code, index) => (
                <div key={index} className="recovery-code-item">
                  <span>{index + 1}.</span> {code}
                </div>
              ))}
            </div>
            
            <div className="recovery-codes-actions">
              <button 
                className="recovery-secondary-button"
                onClick={handleCopyRecoveryCodes}
              >
                Copy Codes
              </button>
              <button 
                className="recovery-secondary-button"
                onClick={handlePrintRecoveryCodes}
              >
                Print Codes
              </button>
            </div>
            
            <div className="recovery-actions">
              <button 
                className="recovery-button" 
                onClick={handleContinue}
              >
                Continue to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecoveryPage;