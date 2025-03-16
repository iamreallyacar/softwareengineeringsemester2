import { Link } from "react-router-dom";
import user from "../assets/images/user.svg";
import notification from "../assets/images/notification.svg";
import overview from "../assets/images/overview.svg";
import security from "../assets/images/security.svg";
import temperature from "../assets/images/temperature.svg";

const Navbar = () => {
    return (
      <nav className="sidebar">
        <Link to="/profile"><img src={userIcon2} alt="Profile" className="nav-icon" /></Link>
        {/* <Link to="/overview"><img src={HomeIcon} alt="Home" className="nav-icon" /></Link>
        <Link to="/temperature"><img src={TempIcon} alt="Temperature" className="nav-icon" /></Link>
        <Link to="/security"><img src={SecurityIcon} alt="Security" className="nav-icon" /></Link>
        <Link to="/notifications"><img src={NotificationIcon} alt="Notifications" className="nav-icon" /></Link>
   */}
        <div className="brand">
          <img src="/logo.png" alt="Peaches Smart Home" />
        </div>
      </nav>
    );
  };
  
  export default Navbar;

 