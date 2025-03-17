import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/Sidebar.css";
import peachesLogo from "../assets/images/peaches-logo.png";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

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
              <i class="fa-solid fa-circle-user"></i>
            </Link>
          </li>
          <li>
            <Link to="/" onClick={closeSidebar}>Home</Link>
          </li>
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