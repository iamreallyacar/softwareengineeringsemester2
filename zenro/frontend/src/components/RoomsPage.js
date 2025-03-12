import React, { useEffect, useRef, useState } from "react";
import { useParams } from 'react-router-dom';
import { Link } from "react-router-dom";
import { Chart } from 'chart.js/auto';
import api from "../api";

import lightBulb from "../assets/images/light-bulb.png";
import smartBlind from "../assets/images/smart-blind.png";
import airCond from "../assets/images/aircond.png";
import smartTV from "../assets/images/smart-tv.png";

function RoomsPage() {
    const { roomId, smartHomeId } = useParams();
    const [isOn, setIsOn] = useState(false);
    const chartRef = useRef(null);
    const [roomData, setRoomData] = useState(null);

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const response = await api.get(`/roomlogs/?room=${roomId}`);
                setRoomData(response.data);
            } catch (error) {
                console.error("Error fetching room data:", error);
            }
        };

        fetchRoomData();
    }, [roomId]);

    useEffect(() => {
        if (chartRef.current && roomData) {
            const existingChart = Chart.getChart(chartRef.current);
            if (existingChart) {
                existingChart.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                    datasets: [{
                        label: 'Room Energy Usage',
                        data: roomData.slice(0, 7).map(log => log.energy_usage),
                        backgroundColor: '#FFB357',
                        borderColor: '#FFB357',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Energy Usage (kWh)'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `${roomId} Weekly Energy Usage`,
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        }
                    }
                }
            });
        }
    }, [roomData, roomId]);
  
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
                    <div style={{ height: '400px', width: '100%' }}>
                        <canvas ref={chartRef}></canvas>
                    </div>
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
                    <span className="number">1</span> devices
                </h3>
                <h3 className="room-text">Smart TV</h3>
                <div className="col-12 room-container">
                    <div className="room-content">
                        <div className="room-text-container">
                            <h3 className="room-text-val">Attribute</h3>
                            <h3 className="room-text">Desc</h3>
                        </div>
                        <div className="room-appliances-img-container">
                            <img className="room-appliances-img" src={smartTV} alt="Smart TV"/>
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
                    <span className="number">2</span> devices
                </h3>
                <h3 className="room-text">Air Conditioners</h3>
                <div className="col-12 room-container">
                    <div className="room-content">
                        <div className="room-text-container">
                            <h3 className="room-text-val">Temperature</h3>
                            <h3 className="room-text">19</h3>
                        </div>
                        <div className="room-appliances-img-container">
                            <img className="room-appliances-img" src={airCond} alt="Air Conditioner"/>
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
