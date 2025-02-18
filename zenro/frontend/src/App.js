import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import CreateAccount from "./components/CreateAccount";
import SmartHomeList from "./components/SmartHomeList";
import SmartHomePage from './components/SmartHomePage';
import RoomsPage from "./components/RoomsPage";
import 'font-awesome/css/font-awesome.min.css';
import './css/App.css';

/*
 * Things that are missing:
 * 1. Device page
 * 2. Room page
 */
function App() {
    return (
        <BrowserRouter>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/create-account" element={<CreateAccount />} />
                    <Route path="/smart-homes" element={<SmartHomeList />} />
                    <Route path="/smarthomepage/:id" element={<SmartHomePage />} />
                    <Route path="/room/:roomId/:smartHomeId" element={<RoomsPage />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
