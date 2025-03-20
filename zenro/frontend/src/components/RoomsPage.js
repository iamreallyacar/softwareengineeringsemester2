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
import "../css/rooms-page.css";

function RoomsPage() {
    const { roomId, smartHomeId } = useParams();
    const chartRef = useRef(null);
    const weeklyChartRef = useRef(null);
    
    // New state variables for device management
    const [roomData, setRoomData] = useState(null);
    const [unlockedDevices, setUnlockedDevices] = useState([]);
    const [lockedDevices, setLockedDevices] = useState([]);
    const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
    const [selectedDeviceToUnlock, setSelectedDeviceToUnlock] = useState(null);
    const [deviceTypes, setDeviceTypes] = useState({});

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

    // New useEffect to fetch room and device data
    useEffect(() => {
        const fetchRoomAndDevices = async () => {
            try {
                // Get room data including devices
                const roomResponse = await api.get(`/rooms/${roomId}/`);
                setRoomData(roomResponse.data);
                
                // Get supported device details to determine device types
                const supportedDevicesResponse = await api.get('/supporteddevices/');
                const deviceTypeMap = {};
                supportedDevicesResponse.data.forEach(device => {
                    deviceTypeMap[device.id] = {
                        type: device.type,
                        model_name: device.model_name
                    };
                });
                setDeviceTypes(deviceTypeMap);
                
                // Sort devices into locked and unlocked categories
                const allDevices = roomResponse.data.devices || [];
                const unlocked = allDevices.filter(device => device.is_unlocked);
                const locked = allDevices.filter(device => !device.is_unlocked);
                
                console.log("Unlocked devices:", unlocked);
                console.log("Locked devices:", locked);
                
                setUnlockedDevices(unlocked);
                setLockedDevices(locked);
            } catch (error) {
                console.error("Error fetching room and device data:", error);
            }
        };
        
        fetchRoomAndDevices();
    }, [roomId]);

    // Function to unlock a device
    const handleUnlockDevice = async () => {
        if (!selectedDeviceToUnlock) {
            alert("Please select a device to add");
            return;
        }
        
        try {
            // Find the device object from our lockedDevices array
            const deviceToUnlock = lockedDevices.find(
                device => device.id === parseInt(selectedDeviceToUnlock)
            );
            
            if (!deviceToUnlock) {
                throw new Error("Selected device not found in locked devices list");
            }
            
            // Update device with is_unlocked=true
            const updatedDevice = {
                ...deviceToUnlock,
                is_unlocked: true
            };
            
            // PUT request to update the device
            const response = await api.put(`/devices/${selectedDeviceToUnlock}/`, updatedDevice);
            console.log("Device unlocked successfully:", response.data);
            
            // Update local state
            setUnlockedDevices(prevDevices => [...prevDevices, response.data]);
            setLockedDevices(prevDevices => 
                prevDevices.filter(device => device.id !== parseInt(selectedDeviceToUnlock))
            );
            
            // Reset form fields
            setSelectedDeviceToUnlock(null);
            setIsAddDeviceModalOpen(false);
        } catch (error) {
            console.error("Error unlocking device:", error.response?.data || error.message);
            alert("Failed to add device. Please try again.");
        }
    };

    // Function to control device status (on/off)
    const handleToggleDeviceStatus = async (deviceId, currentStatus) => {
        try {
            const response = await api.post(`/devices/${deviceId}/control/`, {
                status: !currentStatus
            });
            
            // Update the device in our state
            setUnlockedDevices(prevDevices => 
                prevDevices.map(device => 
                    device.id === deviceId 
                        ? { ...device, status: !currentStatus } 
                        : device
                )
            );
            
            console.log("Device status updated:", response.data);
        } catch (error) {
            console.error("Error toggling device status:", error);
            alert("Failed to update device status. Please try again.");
        }
    };

    // Function to control device analog value (brightness, temperature, etc.)
    const handleUpdateAnalogValue = async (deviceId, newValue) => {
        try {
            const response = await api.post(`/devices/${deviceId}/control/`, {
                analogue_value: newValue
            });
            
            // Update the device in our state
            setUnlockedDevices(prevDevices => 
                prevDevices.map(device => 
                    device.id === deviceId 
                        ? { ...device, analogue_value: newValue } 
                        : device
                )
            );
            
            console.log("Device analog value updated:", response.data);
        } catch (error) {
            console.error("Error updating device analog value:", error);
            alert("Failed to update device settings. Please try again.");
        }
    };

    // Helper function to get device icon based on type
    const getDeviceIcon = (device) => {
        if (!device || !device.supported_device) return lightBulb;
        
        const deviceType = deviceTypes[device.supported_device]?.type?.toLowerCase();
        
        if (deviceType?.includes('light')) return lightBulb;
        if (deviceType?.includes('blind') || deviceType?.includes('shade')) return smartBlind;
        if (deviceType?.includes('ac') || deviceType?.includes('heat')) return airCond;
        if (deviceType?.includes('tv')) return smartTV;
        
        // Default icon
        return lightBulb;
    };

    // Helper to get user-friendly device type name
    const getDeviceTypeName = (device) => {
        if (!device || !device.supported_device) return "Device";
        
        const deviceType = deviceTypes[device.supported_device]?.type?.toLowerCase();
        
        if (deviceType?.includes('light')) return "Light";
        if (deviceType?.includes('blind') || deviceType?.includes('shade')) return "Smart Blind";
        if (deviceType?.includes('ac')) return "Air Conditioner";
        if (deviceType?.includes('heat')) return "Heater";
        if (deviceType?.includes('tv')) return "Smart TV";
        if (deviceType?.includes('sensor')) return "Sensor";
        
        return deviceTypes[device.supported_device]?.model_name || "Device";
    };

    // Helper to determine if a device has analog control
    const hasAnalogControl = (device) => {
        if (!device || !device.supported_device) return false;
        
        const deviceType = deviceTypes[device.supported_device]?.type?.toLowerCase();
        
        // Only lights and heaters have analog controls
        return deviceType?.includes('light') || 
               deviceType?.includes('heat') || 
               deviceType?.includes('ac');
    };

    // Helper to determine if a device is controllable
    const isControllable = (device) => {
        if (!device || !device.supported_device) return false;
        
        const deviceType = deviceTypes[device.supported_device]?.type?.toLowerCase();
        
        // Sensors are not controllable
        return !deviceType?.includes('sensor');
    };

    // Helper to map analog value to temperature (for heaters)
    const mapValueToTemperature = (value) => {
        // Map 1-10 to 12-30°C
        return Math.round(12 + ((value - 1) * (30 - 12) / 9));
    };

    // Helper to map temperature to analog value (for heaters)
    const mapTemperatureToValue = (temp) => {
        // Map 12-30°C to 1-10
        return Math.round(1 + ((temp - 12) * (10 - 1) / (30 - 12)));
    };

    // Helper to render analog value control based on device type
    const renderAnalogControl = (device) => {
        if (!hasAnalogControl(device)) return null;
        
        const deviceType = deviceTypes[device.supported_device]?.type?.toLowerCase();
        
        if (deviceType?.includes('light')) {
            return (
                <div className="analog-control">
                    <h3 className="room-text-val">Brightness</h3>
                    <h3 className="room-text">{device.analogue_value * 10}%</h3>
                    <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={device.analogue_value || 1} 
                        onChange={(e) => handleUpdateAnalogValue(device.id, parseInt(e.target.value))}
                        disabled={!device.status}
                        className="slider-control"
                    />
                </div>
            );
        }
        
        if (deviceType?.includes('heat') || deviceType?.includes('ac')) {
            const temperature = mapValueToTemperature(device.analogue_value || 1);
            return (
                <div className="analog-control">
                    <h3 className="room-text-val">Temperature</h3>
                    <h3 className="room-text">{temperature}°C</h3>
                    <input 
                        type="range" 
                        min="12" 
                        max="30" 
                        value={temperature} 
                        onChange={(e) => {
                            const tempValue = parseInt(e.target.value);
                            const analogValue = mapTemperatureToValue(tempValue);
                            handleUpdateAnalogValue(device.id, analogValue);
                        }}
                        disabled={!device.status}
                        className="slider-control"
                    />
                </div>
            );
        }
        
        return null;
    };

    return (
        <div className="room-page">
            <Sidebar />
            {/* Page Header Section */}
            <div className="page-header">
                <Link to={`/smarthomepage/${smartHomeId}`}>
                    <h1><i className="fas fa-arrow-left"></i> Overview</h1>
                </Link>
                {roomData && <h1>{roomData.name}</h1>}
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
                    {/* Add Device Button */}
                    {lockedDevices.length > 0 && (
                        <button 
                            className="add-device-button"
                            onClick={() => setIsAddDeviceModalOpen(true)}
                            style={{
                                background: '#C14600',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                padding: '8px 15px',
                                margin: '10px 0 20px 0',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%'
                            }}
                        >
                            <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i>
                            Add Device
                        </button>
                    )}

                    {/* Unlocked Devices */}
                    {unlockedDevices.length > 0 ? (
                        unlockedDevices.map(device => (
                            <div className="energy-consumption" key={device.id}>
                                {/* Only show toggle for controllable devices */}
                                {isControllable(device) && (
                                    <label className="switch">
                                        <input 
                                            type="checkbox" 
                                            checked={device.status} 
                                            onChange={() => handleToggleDeviceStatus(device.id, device.status)}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                )}

                                <h3 className="room-text">
                                    {device.name}
                                </h3>
                                <h3 className="room-text">
                                    {getDeviceTypeName(device)}
                                    {!isControllable(device) && " (Read-only)"}
                                </h3>

                                <div className="col-12 room-container">
                                    <div className="room-content">
                                        <div className="room-text-container">
                                            {/* Render appropriate controls based on device type */}
                                            {renderAnalogControl(device)}
                                        </div>
                                        <div className="room-appliances-img-container">
                                            <img 
                                                className="room-appliances-img" 
                                                src={getDeviceIcon(device)} 
                                                alt={getDeviceTypeName(device)} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-devices-message" style={{ textAlign: 'center', color: '#666' }}>
                            <p>No devices have been added to this room yet.</p>
                            {lockedDevices.length > 0 && (
                                <p>Click "Add Device" to add available devices.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Device Modal */}
            {isAddDeviceModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Add a Device</h2>
                        {lockedDevices.length > 0 ? (
                            <>
                                <select
                                    value={selectedDeviceToUnlock || ''}
                                    onChange={(e) => setSelectedDeviceToUnlock(e.target.value)}
                                    className="device-dropdown"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        marginBottom: '20px',
                                        borderRadius: '5px',
                                        border: '1px solid #ddd'
                                    }}
                                >
                                    <option value="">Select a Device to Add</option>
                                    {lockedDevices.map((device) => (
                                        <option key={device.id} value={device.id}>
                                            {device.name} ({getDeviceTypeName(device)})
                                        </option>
                                    ))}
                                </select>
                                <div className="modal-buttons">
                                    <button onClick={handleUnlockDevice}>Add Device</button>
                                    <button onClick={() => setIsAddDeviceModalOpen(false)}>Cancel</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p style={{ margin: "20px 0", color: "#666" }}>
                                    All available devices have already been added to this room.
                                </p>
                                <div className="modal-buttons">
                                    <button onClick={() => setIsAddDeviceModalOpen(false)}>Close</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default RoomsPage;
