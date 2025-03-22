import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react"; // Add useRef
import user from "../assets/images/user.svg";
import notification from "../assets/images/notification.svg";
import overview from "../assets/images/overview.svg";
import security from "../assets/images/security.svg";
import temperature from "../assets/images/Temperature.svg";
import logo from "../assets/images/logo.svg";
import logOut from "../assets/images/logout.svg";

const Sidebar = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    
    // Add state for logout confirmation
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    
    // Ref for the logout button to position the dropdown
    const logoutButtonRef = useRef(null);

    const toggleSidebar = () => {
      setIsOpen(!isOpen);
    };

    // Update logout functionality to show confirmation first
    const initiateLogout = (e) => {
      e.stopPropagation(); // Prevent clicks from bubbling up
      setShowLogoutConfirm(true);
    };
    
    // Actual logout function when confirmed
    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userId");
        navigate("/login");
    };
    
    // Cancel logout
    const cancelLogout = (e) => {
        e.stopPropagation(); // Prevent event bubbling
        setShowLogoutConfirm(false);
    };

    useEffect(() => {
      const handleClickOutside = (event) => {
          // Close sidebar if clicked outside
          if (
              isOpen &&
              !event.target.closest(".sidebar") &&
              !event.target.closest(".navbar-burger-menu")
          ) {
              setIsOpen(false);
          }
          
          // Close logout confirmation if clicked outside
          if (
              showLogoutConfirm &&
              !event.target.closest(".logout-confirm") &&
              !event.target.closest(".nav-item.logout-button")
          ) {
              setShowLogoutConfirm(false);
          }
      };

      document.addEventListener("click", handleClickOutside);
      return () => {
          document.removeEventListener("click", handleClickOutside);
      };
    }, [isOpen, showLogoutConfirm]);

    return (
        <>
          {/* Burger Menu Button */}
          <button className={`navbar-burger-menu ${isOpen ? 'hidden' : ''}`} onClick={toggleSidebar} >
            ☰
          </button>

          <nav className={`sidebar ${isOpen ? "active" : ""}`}>
            {/* Profile icon at the top */}
            <div className="navbar-top">
              <Link to="/profile" className="nav-item">
                <img src={user} alt="Profile" className="nav-icon" />
                <span className="nav-text">Profile</span>
              </Link>
            </div>

            {/* Middle icons are spaced evenly */}
            <div className="navbar-middle">
              <Link to="/smart-homes" className="nav-item">
                <img src={overview} alt="Homes" className="nav-icon" />
                <span className="nav-text">Home</span>
              </Link>
              <Link to="/smarthomepage/:id" className="nav-item">
                <img src={temperature} alt="Temperature" className="nav-icon" />
                <span className="nav-text">Temperature</span>
              </Link>
              <Link to="/room/:roomId/:smartHomeId" className="nav-item">
                <img src={security} alt="Security" className="nav-icon" />
                <span className="nav-text">Security</span>
              </Link>
              <Link to="/landing-page" className="nav-item">
                <img src={notification} alt="Notifications" className="nav-icon" />
                <span className="nav-text">Notifications</span>
              </Link>
              
              {/* Updated logout button with ref and class */}
              <div 
                className="nav-item logout-button" 
                onClick={initiateLogout}
                ref={logoutButtonRef}
              >
                <img src={logOut} alt="Logout" className="nav-icon" />
                <span className="nav-text">Logout</span>
                
                {/* Logout confirmation dropdown */}
                {showLogoutConfirm && (
                  <div className="logout-confirm">
                    <p>Are you sure you want to log out?</p>
                    <div className="logout-buttons">
                      <button 
                        className="logout-yes" 
                        onClick={handleLogout}
                      >
                        Yes
                      </button>
                      <button 
                        className="logout-no" 
                        onClick={cancelLogout}
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Logo at the bottom */}
            <div className="navbar-bottom">
              <div className="sidebar-logo">
                <img src={logo} alt="Peaches Smart Home" />
              </div>
            </div>
          </nav>
        </>
    );
};

export default Sidebar;






