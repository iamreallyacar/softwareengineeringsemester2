import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import CreateAccount from "./components/CreateAccount";
import SmartHomeList from "./components/SmartHomeList";
import SmartHomePage from './components/SmartHomePage';
import 'font-awesome/css/font-awesome.min.css';
import './css/App.css';

function App() {
    return (
        // The BrowserRouter manages client-side routing
        <BrowserRouter>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/create-account" element={<CreateAccount />} />
                    <Route path="/smart-homes" element={<SmartHomeList />} />
                    <Route path="/smarthomepage/:id" element={<SmartHomePage />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
