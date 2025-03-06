import React, { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import { Link } from "react-router-dom";
import api from "../api";

import lightBulb from "../assets/images/light-bulb.png";
import smartBlind from "../assets/images/smart-blind.png";

function RoomsPage() {
    const { roomId, smartHomeId } = useParams();
    const [isOn, setIsOn] = useState(false);
  
  return (
    <div className="room-page">
      {/* Page Header Section */}
      <div className="page-header">
        {/* <div className="sidebar">
          <ul>
              <li><a href="#">Home</a></li>
              <li><a href="#">About</a></li>
              <li><a href="#">Services</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="/smart-homes">Back</a></li>
          </ul>
        </div> */}
        
        <Link to={`/smarthomepage/${smartHomeId}`}>
            <h1><i className="fas fa-arrow-left"></i> Overview</h1>
        </Link>
      </div>

        {/* Columns for Energy Consumption */}
        <div className="columns">
            {/* Column 1 */}
            <div className="column1">
                {/* Row 1: Bedroom energy consumption for today */}
                <div className="energy-consumption">
                <h4 className="room-text-with-line">{roomId} Energy Consumption Today</h4>
                {/* Content for today's energy consumption */}
                </div>

                {/* Row 2: Weekly bedroom energy consumption */}
                <div className="energy-consumption">
                <h4 className="room-text-with-line">Weekly {roomId} Energy Consumption</h4>
                <h4 className="room-text-val">Daily Average</h4>
                <h4 className="room-text">2h 20m</h4>
                </div>
            </div>

            {/* Column 2 */}
            <div className="column2">
                {/* Row 1: Living Room energy consumption for today */}
                <div className="energy-consumption">
                {/* button for on/off  */}
                <label className="switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                </label>

                <h3 className="room-text">
                    <span className="number">4</span> devices
                </h3>
                <h3 className="room-text">Lights</h3>
                <div className="col-12 room-container">
                    <div className="room-content">
                        <div className="room-text-container">
                            <h3 className="room-text-val">Brightness</h3>
                            <h3 className="room-text">50%</h3>
                        </div>
                        <div className="room-appliances-img-container">
                            <img className="room-appliances-img" src={lightBulb} alt="Light Bulb"/>
                        </div>
                    </div>
                </div>
                
                {/* Content for living room energy consumption */}
                </div>

                {/* Row 2: Weekly living room energy consumption */}
                <div className="energy-consumption">
                <label className="switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                </label>
                <h3 className="room-text">
                    <span className="number">4</span> devices
                </h3>
                <h3 className="room-text">Smart Blinds</h3>
                <div className="col-12 room-container">
                    <div className="room-content">
                        <div className="room-text-container">
                            <h3 className="room-text-val">UV Index</h3>
                            <h3 className="room-text">Low</h3>
                        </div>
                        <div className="room-appliances-img-container">
                            <img className="room-appliances-img" src={smartBlind} alt="Smart Blind"/>
                        </div>
                    </div>
                </div>
                {/* Content for weekly living room energy consumption */}
                </div>

                {/* Row 2: Weekly living room energy consumption */}
                <div className="energy-consumption">
                <label className="switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                </label>
                <h3 className="room-text">
                    <span className="number">4</span> devices
                </h3>
                <h3 className="room-text">Smart Blinds</h3>
                <div className="col-12 room-container">
                    <div className="room-content">
                        <div className="room-text-container">
                            <h3 className="room-text-val">UV Index</h3>
                            <h3 className="room-text">Low</h3>
                        </div>
                        <div className="room-appliances-img-container">
                            <img className="room-appliances-img" src={smartBlind} alt="Smart Blind"/>
                        </div>
                    </div>
                </div>

                {/* Content for weekly living room energy consumption */}
                </div>

            </div>
        </div>

    </div>
  );
}

export default RoomsPage;
