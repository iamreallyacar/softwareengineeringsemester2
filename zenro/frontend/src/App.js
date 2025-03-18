import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import CreateAccount from "./components/CreateAccount";
import SmartHomeList from "./components/SmartHomeList";
import SmartHomePage from './components/SmartHomePage';
import RoomsPage from "./components/RoomsPage";
import 'font-awesome/css/font-awesome.min.css';
import './css/App.css';
import LandingPage from "./components/LandingPage";

function App() {
    return (
        <BrowserRouter>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/create-account" element={<CreateAccount />} />
                    <Route path="/smart-homes" element={<SmartHomeList />} />
                    <Route path="/smarthomepage/:id" element={<SmartHomePage />} />
                    <Route path="/room/:roomId/:smartHomeId" element={<RoomsPage />} />
                    <Route path="/landing-page" element={<LandingPage />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;