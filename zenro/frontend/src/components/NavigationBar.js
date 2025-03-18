import { Link } from "react-router-dom";
import user from "../assets/images/user.svg";
import notification from "../assets/images/notification.svg";
import overview from "../assets/images/overview.svg";
import security from "../assets/images/security.svg";
import temperature from "../assets/images/Temperature.svg";
import logo from "../assets/images/logo.svg";

const Navbar = () => {
  return (
    <div className="container">
      {/* Sidebar */}
      <nav className="sidebar">
        <Link to="/profile"><img src={user} alt="Profile" className="nav-icon" /></Link>
        <Link to="/landing-page"><img src={overview} alt="Home" className="nav-icon" /></Link>
        <Link to="/smarthomepage/:id"><img src={temperature} alt="Temperature" className="nav-icon" /></Link>
        <Link to="/security"><img src={security} alt="Security" className="nav-icon" /></Link>
        <Link to="/notifications"><img src={notification} alt="Notifications" className="nav-icon" /></Link>
        <div className="sidebar-logo">
          <img src={logo} alt="Peaches Smart Home" />
        </div>
      </nav>

    </div>
  );
};

export default Navbar;
