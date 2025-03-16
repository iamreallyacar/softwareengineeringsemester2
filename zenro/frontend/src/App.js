import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Login from "./components/Login";
import CreateAccount from "./components/CreateAccount";
import SmartHomeList from "./components/SmartHomeList";
import SmartHomePage from './components/SmartHomePage';
import RoomsPage from "./components/RoomsPage";
import HomeUsersPage from "./components/HomeUsersPage";
import 'font-awesome/css/font-awesome.min.css';
import './css/App.css';
import LandingPage from "./components/LandingPage";
import NavigationBar from "./components/NavigationBar";
import RecoveryPage from "./components/RecoveryPage";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem("accessToken") ? true : false
    );

    // takes the current location
    const location = useLocation();

    // defines where the navigation bars are shown
    const hideNavbarOnPaths = ["/", "/login", "/create-account", "/recovery-page"];
    const shouldShowNavbar = isAuthenticated && !hideNavbarOnPaths.includes(location.pathname);

    return (
        <div className="App">
            {/* show navigation bar conditionally */}
            {shouldShowNavbar && <NavigationBar />}
            
            <Routes>
                <Route path="/" element={<CreateAccount />} />
                <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
                <Route path="/create-account" element={<CreateAccount />} />
                <Route path="/recovery-page" element={<RecoveryPage />} />

                {/* Protected Routes (Require Authentication) */}
                {isAuthenticated ? (
                    <>
                        <Route path="/smart-homes" element={<SmartHomeList />} />
                        <Route path="/smarthomepage/:id" element={<SmartHomePage />} />
                        <Route path="/room/:roomId/:smartHomeId" element={<RoomsPage />} />
                        <Route path="/home-users/:id" element={<HomeUsersPage />} />
                    <Route path="/landing-page" element={<LandingPage />} />
                    </>
                ) : (
                    <Route path="*" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
                )}
            </Routes>
        </div>
    );
}

function AppWrapper() {
    return (
        <BrowserRouter>
            <App />
        </BrowserRouter>
    );
}

export default AppWrapper;
