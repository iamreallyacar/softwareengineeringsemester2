import React from 'react';
import { useParams } from 'react-router-dom';
import { Link } from "react-router-dom";
import api from "../api";

function RoomsPage() {
    const { roomId, smartHomeId } = useParams();
  
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
                <label className="switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                </label>
                <h3 className="room-text">
                    <span className="number">4</span> devices
                </h3>
                <h3 className="room-text">Lights</h3>
                <h3 className="room-text-val">Brightness</h3>
                <h3 className="room-text">50%</h3>
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
                <h3 className="room-text-val">UV Index</h3>
                <h3 className="room-text">Low</h3>
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
                <h3 className="room-text-val">UV Index</h3>
                <h3 className="room-text">Low</h3>
                {/* Content for weekly living room energy consumption */}
                </div>

            </div>
        </div>

    </div>
  );
}

export default RoomsPage;
