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
    const weeklyChartRef = useRef(null);
    const [roomData, setRoomData] = useState(null);
    const [deviceLogs, setDeviceLogs] = useState([]);

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

    // Add a new useEffect to fetch device logs
    useEffect(() => {
        const fetchDeviceLogs = async () => {
            try {
                // First get all devices in the room
                const roomResponse = await api.get(`/rooms/${roomId}/`);
                console.log("Room data:", roomResponse.data); // Debug log

                const devices = roomResponse.data.devices;
                if (!devices || devices.length === 0) {
                    console.log("No devices found in room");
                    return;
                }

                // Then get daily logs for each device
                const logsPromises = devices.map(device =>
                    api.get(`/devicelogs/daily/?device=${device.id}`)
                );

                const logResponses = await Promise.all(logsPromises);
                const deviceLogsData = devices.map((device, index) => ({
                    device: device,
                    logs: logResponses[index].data
                }));

                console.log("Device logs data:", deviceLogsData); // Debug log
                setDeviceLogs(deviceLogsData);
            } catch (error) {
                console.error("Error fetching device logs:", error);
            }
        };

        if (roomId) {
            fetchDeviceLogs();
        }
    }, [roomId]);

    // Update the chartRef useEffect
    useEffect(() => {
        const renderChart = () => {
            if (!chartRef.current) {
                console.log("Chart ref not found");
                return;
            }

            console.log("Rendering donut chart"); // Debug log

            const existingChart = Chart.getChart(chartRef.current);
            if (existingChart) {
                existingChart.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            if (!ctx) {
                console.log("Could not get chart context");
                return;
            }

            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Lights', 'Security Camera', 'Air Conditioner'],
                    datasets: [{
                        data: [200, 120, 225],
                        backgroundColor: [
                            '#FFB357', // Orange for Lights
                            '#DD946A', // Light Brown for Camera
                            '#BF5E40'  // Dark Brown for AC
                        ],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                padding: 20,
                                font: {
                                    size: 14
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: `${roomId} Energy Usage by Device (kWh)`,
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return `${context.label}: ${context.raw} kWh`;
                                }
                            }
                        }
                    }
                }
            });
        };

        renderChart();
    }, [roomId]);

    useEffect(() => {
        const renderWeeklyChart = () => {
            if (!weeklyChartRef.current) {
                console.log("Weekly chart ref not found");
                return;
            }

            console.log("Rendering weekly chart"); // Debug log

            const existingChart = Chart.getChart(weeklyChartRef.current);
            if (existingChart) {
                existingChart.destroy();
            }

            const ctx = weeklyChartRef.current.getContext('2d');
            if (!ctx) {
                console.log("Could not get weekly chart context");
                return;
            }

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                    datasets: [
                        {
                            label: 'Lights',
                            data: [90, 90, 120, 200, 40, 250, 250],
                            backgroundColor: '#FFB357'
                        },
                        {
                            label: 'Security Camera',
                            data: [120, 120, 120, 120, 120, 120, 120],
                            backgroundColor: '#DD946A'
                        },
                        {
                            label: 'Air Conditioner',
                            data: [200, 200, 50, 225, 20, 200, 150],
                            backgroundColor: '#BF5E40'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            stacked: true,
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Energy Usage (kWh)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: `Weekly ${roomId} Energy Usage by Device`,
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        }
                    }
                }
            });
        };

        // Call the render function
        renderWeeklyChart();
    }, [roomId]); // Remove roomData dependency since we're using hardcoded data

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
                        <div style={{
                            height: '270px',  // Reduced from 400px
                            width: '90%',     // Reduced from 100%
                            position: 'relative',
                            marginBottom: '1rem',
                            margin: 'auto'    // Center the chart
                        }}>
                            <canvas ref={chartRef}></canvas>
                        </div>
                    </div>

                    {/* Row 2: Weekly bedroom energy consumption */}
                    <div className="energy-consumption">
                        <h4 className="room-text-with-line">Weekly {roomId} Energy Consumption</h4>
                        <div style={{
                            height: '270px',  // Reduced from 400px
                            width: '90%',     // Reduced from 100%
                            margin: 'auto',   // Center the chart
                            position: 'relative'
                        }}>
                            <canvas ref={weeklyChartRef}></canvas>
                        </div>
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
                                    <img className="room-appliances-img" src={lightBulb} alt="Light Bulb" />
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
                                    <img className="room-appliances-img" src={smartBlind} alt="Smart Blind" />
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
                                    <img className="room-appliances-img" src={smartTV} alt="Smart TV" />
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
                                    <img className="room-appliances-img" src={airCond} alt="Air Conditioner" />
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
