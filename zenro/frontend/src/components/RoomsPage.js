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
    
    // Device management state
    const [roomData, setRoomData] = useState(null);
    const [unlockedDevices, setUnlockedDevices] = useState([]);
    const [lockedDevices, setLockedDevices] = useState([]);
    const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
    const [selectedDeviceToUnlock, setSelectedDeviceToUnlock] = useState(null);
    const [deviceTypes, setDeviceTypes] = useState({});
    
    // New state for analog controls
    const [sliderValues, setSliderValues] = useState({});
    const [updatingDevices, setUpdatingDevices] = useState({});
    const [isDeleteDeviceModalOpen, setIsDeleteDeviceModalOpen] = useState(false);
    const [deviceToDelete, setDeviceToDelete] = useState(null);

    // Add these right after other state variables
    const energyChartRef = useRef(null);
    const [selectedPeriod, setSelectedPeriod] = useState('day');
    const [selectedEnergyDevice, setSelectedEnergyDevice] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [isDataEmpty, setIsDataEmpty] = useState(false);

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

                // Set a default device for energy monitoring if available
                if (unlocked.length > 0 && !selectedEnergyDevice) {
                    setSelectedEnergyDevice(unlocked[0].id);
                }
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
            
            // Update local state - sorting is handled in the render function
            setUnlockedDevices(prevDevices => [...prevDevices, response.data]);

            // Update locked devices list - keep alphabetical order here too
            setLockedDevices(prevDevices => 
                prevDevices
                    .filter(device => device.id !== parseInt(selectedDeviceToUnlock))
                    .sort((a, b) => a.name.localeCompare(b.name))
            );
            
            // Reset form fields
            setSelectedDeviceToUnlock(null);
            setIsAddDeviceModalOpen(false);
        } catch (error) {
            console.error("Error unlocking device:", error.response?.data || error.message);
            alert("Failed to add device. Please try again.");
        }
    };

    // Function to lock a device (remove it from display)
    const handleLockDevice = async (deviceId) => {
        try {
            // Find the device in unlockedDevices
            const deviceToLock = unlockedDevices.find(device => device.id === deviceId);
            
            if (!deviceToLock) {
                throw new Error("Device not found in unlocked devices list");
            }
            
            // First turn off the device
            setUpdatingDevices(prev => ({...prev, [deviceId]: true}));
            
            // Update device to turn it off and lock it
            const updatedDevice = {
                ...deviceToLock,
                status: false,
                is_unlocked: false
            };
            
            // PUT request to update the device
            const response = await api.put(`/devices/${deviceId}/`, updatedDevice);
            console.log("Device locked successfully:", response.data);
            
            // Update local state - remove from unlocked devices
            setUnlockedDevices(prevDevices => 
                prevDevices.filter(device => device.id !== deviceId)
            );
            
            // Add to locked devices - also sort these alphabetically
            setLockedDevices(prevDevices => 
                [...prevDevices, response.data].sort((a, b) => a.name.localeCompare(b.name))
            );
            
            // Clear updating state
            setUpdatingDevices(prev => ({...prev, [deviceId]: false}));
        } catch (error) {
            setUpdatingDevices(prev => ({...prev, [deviceId]: false}));
            console.error("Error locking device:", error.response?.data || error.message);
            alert("Failed to remove device. Please try again.");
        }
    };

    // Function to control device status (on/off)
    const handleToggleDeviceStatus = async (deviceId, currentStatus) => {
        try {
            // Set loading state for this specific device
            setUnlockedDevices(prevDevices => 
                prevDevices.map(device => 
                    device.id === deviceId 
                        ? { ...device, isUpdating: true } 
                        : device
                )
            );
            
            const response = await api.post(`/devices/${deviceId}/control/`, {
                status: !currentStatus
            });
            
            // Update the device in our state with new status and clear loading state
            setUnlockedDevices(prevDevices => 
                prevDevices.map(device => 
                    device.id === deviceId 
                        ? { ...device, status: !currentStatus, isUpdating: false } 
                        : device
                )
            );
            
            console.log("Device status updated:", response.data);
        } catch (error) {
            // Clear loading state on error
            setUnlockedDevices(prevDevices => 
                prevDevices.map(device => 
                    device.id === deviceId 
                        ? { ...device, isUpdating: false } 
                        : device
                )
            );
            console.error("Error toggling device status:", error);
            alert("Failed to update device status. Please try again.");
        }
    };

    // Function to control device analog value (brightness, temperature, etc.)
    const handleUpdateAnalogValue = async (deviceId, newValue) => {
        try {
            // Update the "updating" state for this device
            setUpdatingDevices(prev => ({...prev, [deviceId]: true}));
            
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
            
            // Clear updating state
            setUpdatingDevices(prev => ({...prev, [deviceId]: false}));
            
            console.log("Device analog value updated:", response.data);
        } catch (error) {
            // Clear updating state on error
            setUpdatingDevices(prev => ({...prev, [deviceId]: false}));
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
        return true; // All devices are now controllable
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
        const deviceId = device.id;
        
        // Initialize slider value if not set
        if (sliderValues[deviceId] === undefined) {
            // This is safe to do conditionally since it doesn't use hooks
            setSliderValues(prev => ({ 
                ...prev, 
                [deviceId]: device.analogue_value || 1 
            }));
        }
        
        const isUpdating = !!updatingDevices[deviceId];
        const currentSliderValue = sliderValues[deviceId] || device.analogue_value || 1;
        
        const handleSliderChange = (e) => {
            const newValue = parseInt(e.target.value);
            setSliderValues(prev => ({...prev, [deviceId]: newValue}));
        };
        
        const applyChange = () => {
            handleUpdateAnalogValue(deviceId, currentSliderValue);
        };
        
        if (deviceType?.includes('light')) {
            return (
                <div className="analog-control">
                    <h3 className="room-text-val">Brightness</h3>
                    <h3 className="room-text">{(device.analogue_value || 1) * 10}%</h3>
                    
                    <div className="slider-container">
                        <div className="slider-with-ticks">
                            <input 
                                type="range" 
                                min="1" 
                                max="10" 
                                step="1"
                                value={currentSliderValue} 
                                onChange={handleSliderChange}
                                disabled={!device.status || isUpdating}
                                className="slider-control"
                            />
                            {/* Reduce number of ticks for better readability */}
                            <div className="slider-ticks">
                                {[1, 3, 5, 7, 10].map((value) => (
                                    <span key={value} className="tick-mark" style={{left: `${(value-1) * 100/9}%`}}>
                                        <span className="tick-label">{value*10}%</span>
                                    </span>
                                ))}
                            </div>
                            
                            {/* Current value indicator */}
                            <div 
                                className="slider-current-value"
                                style={{
                                    left: `${(currentSliderValue-1) * 100/9}%`,
                                    display: currentSliderValue === device.analogue_value ? 'none' : 'block'
                                }}
                            >
                                {currentSliderValue * 10}%
                            </div>
                        </div>
                        
                        <button 
                            className={`set-value-button ${isUpdating ? 'loading' : ''}`}
                            onClick={applyChange}
                            disabled={!device.status || isUpdating || currentSliderValue === device.analogue_value}
                        >
                            {isUpdating ? 'Setting...' : 'Set'}
                        </button>
                    </div>
                </div>
            );
        }
        
        if (deviceType?.includes('heat') || deviceType?.includes('ac')) {
            const currentTemp = mapValueToTemperature(device.analogue_value || 1);
            const sliderTemp = mapValueToTemperature(currentSliderValue);
            
            return (
                <div className="analog-control">
                    <h3 className="room-text-val">Temperature</h3>
                    <h3 className="room-text">{currentTemp}°C</h3>
                    
                    <div className="slider-container">
                        <div className="slider-with-ticks">
                            <input 
                                type="range" 
                                min="12" 
                                max="30" 
                                step="1"
                                value={sliderTemp} 
                                onChange={(e) => {
                                    const tempValue = parseInt(e.target.value);
                                    setSliderValues(prev => ({
                                        ...prev, 
                                        [deviceId]: mapTemperatureToValue(tempValue)
                                    }));
                                }}
                                disabled={!device.status || isUpdating}
                                className="slider-control"
                            />
                            <div className="slider-ticks">
                                {[12, 18, 24, 30].map((temp) => (
                                    <span key={temp} className="tick-mark" style={{left: `${(temp-12) * 100/18}%`}}>
                                        <span className="tick-label">{temp}°C</span>
                                    </span>
                                ))}
                            </div>
                            
                            {/* Current value indicator */}
                            <div 
                                className="slider-current-value"
                                style={{
                                    left: `${(sliderTemp-12) * 100/18}%`,
                                    display: currentSliderValue === device.analogue_value ? 'none' : 'block'
                                }}
                            >
                                {sliderTemp}°C
                            </div>
                        </div>
                        
                        <button 
                            className={`set-value-button ${isUpdating ? 'loading' : ''}`}
                            onClick={applyChange}
                            disabled={!device.status || isUpdating || currentSliderValue === device.analogue_value}
                        >
                            {isUpdating ? 'Setting...' : 'Set'}
                        </button>
                    </div>
                </div>
            );
        }
        
        return null;
    };

    // Add these helper functions before the return statement
    const generateDateOptions = () => {
        const options = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Format date to YYYY-MM-DD for value and readable format for label
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            const formattedValue = `${year}-${month}-${day}`;
            const formattedLabel = date.toLocaleDateString();
            
            options.push({ value: formattedValue, label: formattedLabel });
        }
        return options;
    };

    const generateMonthOptions = () => {
        const options = [];
        for (let i = 0; i < 12; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const formattedValue = `${year}-${month}`;
            
            const formattedLabel = date.toLocaleDateString('default', { 
                month: 'long', 
                year: 'numeric' 
            });
            
            options.push({ value: formattedValue, label: formattedLabel });
        }
        return options;
    };

    const generateYearOptions = () => {
        const options = [];
        const currentYear = new Date().getFullYear();
        
        for (let i = 0; i < 5; i++) {
            const year = currentYear - i;
            options.push({ value: year.toString(), label: year.toString() });
        }
        return options;
    };

    const dateOptions = generateDateOptions();
    const monthOptions = generateMonthOptions();
    const yearOptions = generateYearOptions();

    // Sort unlocked devices alphabetically by name
    const sortedUnlockedDevices = [...unlockedDevices].sort((a, b) => 
        a.name.localeCompare(b.name)
    );

    // Add this useEffect
    useEffect(() => {
        if (!energyChartRef.current || !selectedEnergyDevice) return;
        
        const fetchEnergyData = async () => {
            try {
                let labels = [];
                let dataPoints = [];
                let chartTitle = '';
                
                // Find the device object for display name
                const deviceObj = unlockedDevices.find(d => d.id === parseInt(selectedEnergyDevice));
                const deviceName = deviceObj ? deviceObj.name : 'Selected Device';
                
                console.log(`Fetching ${selectedPeriod} data for device ID: ${selectedEnergyDevice}`);
                
                switch (selectedPeriod) {
                    case 'day':
                        // Fetch 1-minute logs for the selected day
                        const minuteResponse = await api.get(`/devicelogs1min/?device=${selectedEnergyDevice}`);
                        console.log("Day data response:", minuteResponse.data);
                        
                        const dailyLogs = minuteResponse.data.filter(log => {
                            const logDate = log.created_at.split('T')[0];
                            return logDate === selectedDate;
                        });
                        
                        // Group by hour (0-23)
                        const hourlyData = Array(24).fill(0);
                        dailyLogs.forEach(log => {
                            const hour = new Date(log.created_at).getHours();
                            hourlyData[hour] += parseFloat(log.energy_usage);
                        });
                        
                        labels = Array.from({length: 24}, (_, i) => `${i}:00`);
                        dataPoints = hourlyData;
                        
                        // Format date for display
                        const displayDate = new Date(selectedDate).toLocaleDateString();
                        chartTitle = `Energy Usage on ${displayDate} - ${deviceName}`;
                        break;
                        
                    case 'month':
                        // Fetch daily logs for selected month
                        const dailyResponse = await api.get(`/devicelogsdaily/?device=${selectedEnergyDevice}`);
                        console.log("Month data response:", dailyResponse.data);
                        
                        // Debug the actual data structure
                        if (dailyResponse.data.length > 0) {
                            console.log("Month data example:", dailyResponse.data[0]);
                            console.log("Month data fields:", Object.keys(dailyResponse.data[0]));
                        } else {
                            console.log("No monthly data returned");
                        }
                        
                        const [year, month] = selectedMonth.split('-');
                        console.log("Filtering for year:", year, "month:", month);
                        
                        // More flexible filtering that handles different field names
                        const monthlyLogs = dailyResponse.data.filter(log => {
                            try {
                                // Try different possible date field names
                                const dateString = log.date || log.created_at || log.timestamp;
                                if (!dateString) return false;
                                
                                const logDate = new Date(dateString);
                                const logYear = logDate.getFullYear();
                                const logMonth = logDate.getMonth() + 1; // JavaScript months are 0-based
                                
                                console.log(`Log date: ${dateString}, parsed as: ${logDate}, year: ${logYear}, month: ${logMonth}`);
                                
                                return logYear === parseInt(year) && logMonth === parseInt(month);
                            } catch (e) {
                                console.error("Error parsing date:", log, e);
                                return false;
                            }
                        });
                        
                        console.log("Filtered month logs:", monthlyLogs);
                        
                        // Get days in month and prepare data array
                        const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
                        labels = Array.from({length: daysInMonth}, (_, i) => `${i+1}`);
                        dataPoints = Array(daysInMonth).fill(0);
                        
                        // Map daily logs to days of month with better error handling
                        monthlyLogs.forEach(log => {
                            try {
                                const dateString = log.date || log.created_at || log.timestamp;
                                const logDate = new Date(dateString);
                                const day = logDate.getDate();
                                
                                // Try different possible energy field names
                                const energyValue = parseFloat(
                                    log.total_energy_usage || 
                                    log.energy_usage || 
                                    log.usage || 
                                    log.energy || 
                                    0
                                );
                                
                                console.log(`Day ${day}: Energy value = ${energyValue}`);
                                
                                if (day >= 1 && day <= daysInMonth) {
                                    dataPoints[day-1] = energyValue;
                                }
                            } catch (err) {
                                console.error("Error processing monthly log:", log, err);
                            }
                        });
                        
                        // Format month name for display
                        const monthName = new Date(selectedMonth + '-01').toLocaleDateString('default', { 
                            month: 'long', 
                            year: 'numeric' 
                        });
                        chartTitle = `Energy Usage for ${monthName} - ${deviceName}`;
                        break;
                        
                    case 'year':
                        // Fetch monthly logs for selected year
                        const monthlyResponse = await api.get(`/devicelogsmonthly/?device=${selectedEnergyDevice}`);
                        console.log("Year data response:", monthlyResponse.data);
                        
                        // Debug the actual data structure
                        if (monthlyResponse.data.length > 0) {
                            console.log("Year data example:", monthlyResponse.data[0]);
                            console.log("Year data fields:", Object.keys(monthlyResponse.data[0]));
                        } else {
                            console.log("No yearly data returned");
                        }
                        
                        console.log("Filtering for year:", selectedYear);
                        
                        // More flexible filtering that handles different field names
                        const yearLogs = monthlyResponse.data.filter(log => {
                            try {
                                // Try to get year from various possible field names
                                const logYear = log.year || 
                                               (log.date ? new Date(log.date).getFullYear() : null) ||
                                               (log.created_at ? new Date(log.created_at).getFullYear() : null);
                                    
                                return logYear === parseInt(selectedYear);
                            } catch (e) {
                                console.error("Error parsing year:", log, e);
                                return false;
                            }
                        });
                        
                        console.log("Filtered year logs:", yearLogs);
                        
                        // Set up month labels and data array
                        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        dataPoints = Array(12).fill(0);
                        
                        // Map monthly logs to months with better field detection
                        yearLogs.forEach(log => {
                            try {
                                // Try different possible month field names
                                let monthIndex;
                                
                                if (log.month !== undefined) {
                                    monthIndex = parseInt(log.month) - 1; // Convert 1-based to 0-based
                                } else if (log.date) {
                                    monthIndex = new Date(log.date).getMonth();
                                } else if (log.created_at) {
                                    monthIndex = new Date(log.created_at).getMonth();
                                } else {
                                    console.error("No month field found in log:", log);
                                    return;
                                }
                                
                                // Try different possible energy field names
                                const energyValue = parseFloat(
                                    log.total_energy_usage || 
                                    log.energy_usage || 
                                    log.usage ||
                                    log.energy ||
                                    0
                                );
                                
                                console.log(`Month ${monthIndex + 1}: Energy value = ${energyValue}`);
                                
                                if (monthIndex >= 0 && monthIndex < 12) {
                                    dataPoints[monthIndex] = energyValue;
                                }
                            } catch (err) {
                                console.error("Error processing yearly log:", log, err);
                            }
                        });
                        
                        chartTitle = `Energy Usage for ${selectedYear} - ${deviceName}`;
                        break;
                }
                
                console.log("Chart data points:", dataPoints);
                console.log("Chart labels:", labels);
                
                // Check if we have any data to display
                const isEmpty = dataPoints.every(val => val === 0);
                
                // Always destroy the previous chart before creating a new one
                const existingChart = Chart.getChart(energyChartRef.current);
                if (existingChart) {
                    existingChart.destroy();
                }
                
                // Update the state AFTER clearing the chart
                setIsDataEmpty(isEmpty);
                
                if (isEmpty) {
                    // Create empty chart with "No data" message
                    new Chart(energyChartRef.current.getContext('2d'), {
                        type: 'bar',
                        data: {
                            labels: ['No data available'],
                            datasets: [{
                                data: [0],
                                backgroundColor: 'rgba(0, 0, 0, 0.1)'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                title: {
                                    display: true,
                                    text: chartTitle,
                                    font: { size: 16, weight: 'bold' }
                                },
                                legend: { display: false },
                                tooltip: { enabled: false }
                            },
                            scales: {
                                y: { display: false, beginAtZero: true },
                                x: { display: true }
                            }
                        }
                    });
                    return;
                }
                
                // Create the chart with data
                new Chart(energyChartRef.current.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Energy Usage (kWh)',
                            data: dataPoints,
                            backgroundColor: 'rgba(193, 70, 0, 0.2)',
                            borderColor: 'rgb(193, 70, 0)',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        resizeDelay: 100,
                        animation: {
                            duration: 1000, // Animation duration in milliseconds
                            easing: 'easeOutQuart', // Animation easing function
                            delay: function(context) {
                                // Stagger animations of each bar
                                return context.dataIndex * 50;
                            }
                        },
                        plugins: {
                            title: {
                                display: true,
                                text: chartTitle,
                                font: { size: 16, weight: 'bold' },
                                padding: { top: 10, bottom: 20 }
                            },
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(200, 200, 200, 0.3)'
                                },
                                ticks: {
                                    padding: 10,
                                    font: { size: 12 }
                                },
                                title: {
                                    display: true,
                                    text: 'Energy (kWh)',
                                    padding: {top: 0, bottom: 10},
                                    font: { size: 14 }
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                },
                                ticks: {
                                    padding: 10,
                                    font: { size: 12 }
                                }
                            }
                        },
                        layout: {
                            padding: {
                                left: 20,
                                right: 30,
                                top: 20,
                                bottom: 40
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Error fetching energy data:', error);
                console.error('API response details:', error.response?.data);
                
                // Set the empty state to ensure clean UI even on errors
                setIsDataEmpty(true);
                
                // Always destroy existing chart on error
                const existingChart = Chart.getChart(energyChartRef.current);
                if (existingChart) {
                    existingChart.destroy();
                }
                
                // Create an empty chart to show error state
                new Chart(energyChartRef.current.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: ['Error loading data'],
                        datasets: [{
                            data: [0],
                            backgroundColor: 'rgba(220, 53, 69, 0.2)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: `Error loading data for ${selectedPeriod}`,
                                font: { size: 16, weight: 'bold' }
                            },
                            legend: { display: false },
                            tooltip: { enabled: false }
                        },
                        scales: {
                            y: { display: false, beginAtZero: true },
                            x: { display: true }
                        }
                    }
                });
            }
        };
        
        fetchEnergyData();
    }, [selectedPeriod, selectedEnergyDevice, selectedDate, selectedMonth, selectedYear, unlockedDevices]);

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

            <div className="columns">
                {/* Left column: Energy chart */}
                <div className="column1">
                    <div className="energy-consumption">
                        <h4 className="room-text-with-line">Device Energy Consumption</h4>
                        <div className="chart-controls">
                            <div className="period-selector">
                                <div className="period-buttons">
                                    {['day', 'month', 'year'].map((period) => (
                                        <button
                                            key={period}
                                            onClick={() => setSelectedPeriod(period)}
                                            className={`period-button ${selectedPeriod === period ? 'active' : ''}`}
                                            style={{ 
                                                padding: '8px 15px', 
                                                margin: '0 5px',
                                                background: selectedPeriod === period ? '#c14600' : '#f0f0f0',
                                                color: selectedPeriod === period ? 'white' : '#333',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {period.charAt(0).toUpperCase() + period.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="selectors-container" style={{ display: 'flex', marginTop: '10px' }}>
                                    <div className="time-selector" style={{ flex: '1', marginRight: '10px' }}>
                                        {selectedPeriod === 'day' && (
                                            <select
                                                value={selectedDate}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '8px'
                                                }}
                                            >
                                                {dateOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        
                                        {selectedPeriod === 'month' && (
                                            <select
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(e.target.value)}
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '8px'
                                                }}
                                            >
                                                {monthOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        
                                        {selectedPeriod === 'year' && (
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(e.target.value)}
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '8px'
                                                }}
                                            >
                                                {yearOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    
                                    <div className="device-selector" style={{ flex: '1' }}>
                                        <select
                                            value={selectedEnergyDevice || ''}
                                            onChange={(e) => setSelectedEnergyDevice(e.target.value)}
                                            disabled={unlockedDevices.length === 0}
                                            style={{ 
                                                width: '100%', 
                                                padding: '8px'
                                            }}
                                        >
                                            {unlockedDevices.length > 0 ? (
                                                unlockedDevices.map((device) => (
                                                    <option key={device.id} value={device.id}>
                                                        {device.name}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="">No devices available</option>
                                            )}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="chart-wrapper">
                            {!selectedEnergyDevice && (
                                <div style={{ 
                                    position: 'absolute', 
                                    top: '50%', 
                                    left: '50%', 
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center',
                                    color: '#666'
                                }}>
                                    <p>No device selected. Add a device to view energy usage.</p>
                                </div>
                            )}
                            <canvas ref={energyChartRef}></canvas>
                            {isDataEmpty && selectedEnergyDevice && (
                                <div style={{ 
                                    position: 'absolute', 
                                    top: '50%', 
                                    left: '50%', 
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center',
                                    color: '#666'
                                }}>
                                    <p>No energy data available for this device during the selected {selectedPeriod}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Right column: Device management */}
                <div className="column2">
                    {/* Add Device Button */}
                    {lockedDevices.length > 0 && (
                        <button 
                            className="add-device-button"
                            onClick={() => setIsAddDeviceModalOpen(true)}
                        >
                            <i className="fa-solid fa-plus" style={{ marginRight: '8px' }}></i>
                            Add Device
                        </button>
                    )}

                    {/* Unlocked Devices - keep this part the same */}
                    {sortedUnlockedDevices.length > 0 ? (
                        sortedUnlockedDevices.map(device => {
                            const deviceType = deviceTypes[device.supported_device]?.type?.toLowerCase();
                            const isSensor = deviceType?.includes('sensor');
                            const isUpdating = !!updatingDevices[device.id];
                            
                            return (
                                <div className="energy-consumption" key={device.id}>
                                    {/* Rest of the device rendering remains the same */}
                                    {/* Add device removal button */}
                                    <button
                                        className="delete-device-button"
                                        onClick={() => {
                                            setDeviceToDelete(device.id);
                                            setIsDeleteDeviceModalOpen(true);
                                        }}
                                        disabled={isUpdating}
                                        title="Remove Device"
                                    >
                                        <i className="fa-solid fa-trash delete-icon"></i>
                                    </button>
                                    
                                    {/* Show toggle for all devices */}
                                    <label className={`switch ${device.isUpdating ? 'updating' : ''}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={device.status} 
                                            onChange={() => handleToggleDeviceStatus(device.id, device.status)}
                                            disabled={device.isUpdating}
                                        />
                                        <span className="slider"></span>
                                    </label>

                                    {/* Only show device name, not type */}
                                    <h3 className="room-text">
                                        {device.name}
                                    </h3>

                                    <div className="col-12 room-container">
                                        <div className="room-content">
                                            <div className="room-text-container">
                                                {/* Only render analog controls for non-sensor devices */}
                                                {!isSensor && renderAnalogControl(device)}
                                            </div>
                                            
                                            {/* Only show icon for non-sensor devices */}
                                            {!isSensor && (
                                                <div className="room-appliances-img-container">
                                                    <img 
                                                        className="room-appliances-img" 
                                                        src={getDeviceIcon(device)} 
                                                        alt={device.name}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        // Empty state message
                        <div className="no-devices-message" style={{ textAlign: 'center', color: '#666' }}>
                            <p>No devices have been added to this room yet.</p>
                            {lockedDevices.length > 0 && (
                                <p>Click "Add Device" to add available devices.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Device Confirmation Modal */}
            {isDeleteDeviceModalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Delete Device</h2>
                        <p style={{ fontSize: "17px", color: "#666", marginTop: "10px" }}>
                            Are you sure you want to remove this device?
                            It will no longer appear in this room until you add it again.
                        </p>
                        <div className="modal-buttons">
                            <button
                                onClick={() => {
                                    handleLockDevice(deviceToDelete);
                                    setIsDeleteDeviceModalOpen(false);
                                }}
                            >
                                Yes, Delete Device
                            </button>
                            <button
                                onClick={() => {
                                    setIsDeleteDeviceModalOpen(false);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                            {device.name}
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