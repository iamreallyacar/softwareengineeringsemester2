import React, { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import "../css/Sidebar.css";
import peachesLogo from "../assets/images/peaches-logo.png";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const params = useParams();
  const location = useLocation();
  const [smartHomeId, setSmartHomeId] = useState(null);
  
  // Extract smart home ID from URL
  useEffect(() => {
    // The ID could be in different places depending on the route
    const id = params.id || params.smartHomeId;
    
    // Try to extract from path if not in params
    if (!id && location.pathname.includes('/smarthomepage/')) {
      const pathParts = location.pathname.split('/');
      const idIndex = pathParts.indexOf('smarthomepage') + 1;
      if (idIndex < pathParts.length) {
        setSmartHomeId(pathParts[idIndex]);
        return;
      }
    }
    
    // Try to extract from room path
    if (!id && location.pathname.includes('/room/')) {
      const pathParts = location.pathname.split('/');
      if (pathParts.length >= 4) {
        setSmartHomeId(pathParts[3]); // The smart home ID in room URLs
        return;
      }
    }
    
    setSmartHomeId(id);
  }, [params, location]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Burger Menu */}
      <button className="burger-menu" onClick={toggleSidebar}>
        ☰
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? "active" : ""}`}>
        <ul>
          <li style={{ fontSize: "35px" }}>
            <Link to="/" onClick={closeSidebar}>
              <i className="fa-solid fa-circle-user"></i>
            </Link>
          </li>
          <li>
            <Link to="/" onClick={closeSidebar}>Home</Link>
          </li>
          {smartHomeId && (
            <>
              <li>
                <Link to={`/smarthomepage/${smartHomeId}`} onClick={closeSidebar}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to={`/home-users/${smartHomeId}`} onClick={closeSidebar}>
                  Manage Users
                </Link>
              </li>
            </>
          )}
          <li>
            <Link to="/about" onClick={closeSidebar}>About</Link>
          </li>
          <li>
            <Link to="/services" onClick={closeSidebar}>Services</Link>
          </li>
          <li>
            <Link to="/contact" onClick={closeSidebar}>Contact</Link>
          </li>
          <li>
            <Link to="/smart-homes" onClick={closeSidebar}>Back</Link>
          </li>
        </ul>

        {/* Logo at the bottom */}
        <div className="sidebar-logo">
          <img src={peachesLogo} alt="Peaches Logo" />
        </div>
      </div>
    </>
  );
}

export default Sidebar;