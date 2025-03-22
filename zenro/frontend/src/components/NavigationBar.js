import { Link, useNavigate } from "react-router-dom"; // Add useNavigate
import { useState, useEffect } from "react";
import user from "../assets/images/user.svg";
import notification from "../assets/images/notification.svg";
import overview from "../assets/images/overview.svg";
import security from "../assets/images/security.svg";
import temperature from "../assets/images/Temperature.svg";
import logo from "../assets/images/logo.svg";
import logOut from "../assets/images/logout.svg"; // You'll need to add this SVG file

const Sidebar = () => {
    // Add navigate for logout functionality
    const navigate = useNavigate();
    
    // State to manage sidebar visibility
    const [isOpen, setIsOpen] = useState(false);

    // Toggle function for sidebar
    const toggleSidebar = () => {
      setIsOpen(!isOpen);
    };

    // Handle logout functionality
    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userId");
        navigate("/login");
    };

    useEffect(() => {
      const handleClickOutside = (event) => {
          if (
              isOpen &&
              !event.target.closest(".sidebar") && // Click is outside sidebar
              !event.target.closest(".navbar-burger-menu") // Click is not on burger button
          ) {
              setIsOpen(false);
          }
      };

      document.addEventListener("click", handleClickOutside);
      return () => {
          document.removeEventListener("click", handleClickOutside);
      };
    }, [isOpen]);

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
          {/* Add logout button */}
          <div className="nav-item" onClick={handleLogout}>
            <img src={logOut} alt="Logout" className="nav-icon" />
            <span className="nav-text">Logout</span>
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






