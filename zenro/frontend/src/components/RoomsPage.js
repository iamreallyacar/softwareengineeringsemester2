import React, { useEffect, useRef, useState } from "react";
import { useParams } from 'react-router-dom';
import { Link } from "react-router-dom";
import { Chart } from 'chart.js/auto';
import api from "../api";

import lightBulb from "../assets/images/light-bulb.png";
import smartBlind from "../assets/images/smart-blind.png";
import airCond from "../assets/images/aircond.png";
import smartTV from "../assets/images/smart-tv.png";
import Sidebar from "./Sidebar";

function RoomsPage() {
    const { roomId, smartHomeId } = useParams();
    const [isOn, setIsOn] = useState(false);
    const chartRef = useRef(null);
    const weeklyChartRef = useRef(null);
    const [roomData, setRoomData] = useState(null);
    const [deviceLogs, setDeviceLogs] = useState([]);

    // UseEffect for daily chart data and rendering
    useEffect(() => {
        const fetchDeviceData = async () => {
            try {
                // Get today's date in YYYY-MM-DD format
                const today = new Date().toISOString().split('T')[0];
                
                // First get all devices in the room
                const roomResponse = await api.get(`/rooms/${roomId}/`);
                const devices = roomResponse.data.devices;

                if (!devices || devices.length === 0) {
                    console.log("No devices found in room");
                    return;
                }

                // Get today's logs for each device
                const deviceLogsPromises = devices.map(device => 
                    api.get(`/devicelogs/?device=${device.id}&start_date=${today}&end_date=${today}`)
                );

                const logResponses = await Promise.all(deviceLogsPromises);
                
                // Calculate total energy usage for each device
                const deviceTotals = devices.map((device, index) => {
                    const logs = logResponses[index].data;
                    const totalEnergy = logs.reduce((sum, log) => sum + log.energy_usage, 0);
                    return {
                        name: device.name,
                        energy: totalEnergy
                    };
                });

                // Render the donut chart
                const ctx = chartRef.current.getContext('2d');
                
                // Get existing chart instance if it exists
                const existingChart = Chart.getChart(chartRef.current);
                if (existingChart) {
                    existingChart.destroy();
                }

                // Create new chart
                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: deviceTotals.map(device => device.name),
                        datasets: [{
                            data: deviceTotals.map(device => device.energy),
                            backgroundColor: [
                                '#FFB357', // Orange
                                '#DD946A', // Light Brown
                                '#BF5E40', // Dark Brown
                                '#8C4646'  // Burgundy
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
                                    label: function(context) {
                                        return `${context.label}: ${context.raw.toFixed(2)} kWh`;
                                    }
                                }
                            }
                        }
                    }
                });

            } catch (error) {
                console.error("Error fetching device data:", error);
            }
        };

        if (chartRef.current) {
            fetchDeviceData();
        }
    }, [roomId]);

    //UseEffect for weekly chart data and rendering
    useEffect(() => {
        const fetchWeeklyData = async () => {
            if (!weeklyChartRef.current) {
                console.log("Weekly chart ref not found");
                return;
            }

            try {
                // Get all devices in the room
                const roomResponse = await api.get(`/rooms/${roomId}/`);
                const devices = roomResponse.data.devices;

                if (!devices || devices.length === 0) {
                    console.log("No devices found in room");
                    return;
                }

                // Get weekly logs for each device
                const deviceLogsPromises = devices.map(device => 
                    api.get(`/devicelogs/daily/?device=${device.id}`)
                );

                const logResponses = await Promise.all(deviceLogsPromises);
                
                // Process the data for each device
                const deviceDatasets = devices.map((device, deviceIndex) => {
                    const deviceLogs = logResponses[deviceIndex].data;
                    
                    // Map logs to days of the week
                    const dailyData = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                        .map(day => {
                            const dayLog = deviceLogs.find(log => {
                                const logDate = new Date(log.date);
                                return logDate.getDay() === ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day);
                            });
                            return dayLog ? dayLog.total_energy_usage : 0;
                        });

                    return {
                        label: device.name,
                        data: dailyData,
                        backgroundColor: [
                            '#FFB357',
                            '#DD946A',
                            '#BF5E40',
                            '#8C4646'
                        ][deviceIndex % 4]
                    };
                });

                // Create or update the chart
                const existingChart = Chart.getChart(weeklyChartRef.current);
                if (existingChart) {
                    existingChart.destroy();
                }

                const ctx = weeklyChartRef.current.getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                        datasets: deviceDatasets
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
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${context.dataset.label}: ${context.raw.toFixed(2)} kWh`;
                                    }
                                }
                            }
                        }
                    }
                });

            } catch (error) {
                console.error("Error fetching weekly device data:", error);
            }
        };

        fetchWeeklyData();
    }, [roomId]);

    return (
        <div className="room-page">
            <Sidebar />
            {/* Page Header Section */}
            <div className="page-header">
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
