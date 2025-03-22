import React, { useEffect, useRef, useState } from "react";
import { useParams } from 'react-router-dom';
import { Link } from "react-router-dom";
import { Chart } from 'chart.js/auto';
import api from "../api";

import lightBulb from "../assets/images/light-bulb.png";
import smartBlind from "../assets/images/smart-blind.png";
import airCond from "../assets/images/aircond.png";
import smartTV from "../assets/images/smart-tv.png";
import Navbar from "./NavigationBar";
import "../css/rooms-page.css";
import { ChevronLeft } from "lucide-react"; // Add this import

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

                // Set a default device for energy monitoring if available (not a sensor)
                if (unlocked.length > 0 && !selectedEnergyDevice) {
                    // Find the first non-sensor device
                    const firstNonSensorDevice = unlocked.find(device => {
                        const deviceType = deviceTypes[device.supported_device]?.type?.toLowerCase();
                        return !deviceType?.includes('sensor');
                    });
                    
                    if (firstNonSensorDevice) {
                        setSelectedEnergyDevice(firstNonSensorDevice.id);
                    }
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
                        // Fetch daily logs for selected month with device ID filter
                        const [year, month] = selectedMonth.split('-');
                        console.log(`Getting daily logs for device ${selectedEnergyDevice} for ${month}/${year}`);
                        
                        // Use direct API filtering to get only the relevant data from backend
                        const startDate = `${year}-${month}-01`;
                        // Calculate end date (first day of next month)
                        const endDate = month === '12' 
                            ? `${parseInt(year) + 1}-01-01` 
                            : `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`;
                        
                        // Get exact data by using proper filtering with date parameters
                        const dailyResponse = await api.get(`/devicelogsdaily/?device=${selectedEnergyDevice}`);
                        console.log("All device daily logs:", dailyResponse.data.length);
                        
                        // Manual log of all data to see what we're getting
                        dailyResponse.data.forEach(log => {
                            console.log(`Log data: date=${log.date}, device=${log.device}, usage=${log.total_energy_usage}`);
                        });
                        
                        // Get days in month and prepare data array
                        const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
                        labels = Array.from({length: daysInMonth}, (_, i) => `${i+1}`);
                        dataPoints = Array(daysInMonth).fill(0);
                        
                        // Create a Map to ensure we only get one value per day (the latest)
                        const dailyData = new Map();
                        
                        // Process all returned logs
                        dailyResponse.data.forEach(log => {
                            try {
                                // Check if this is actually for our device
                                if (log.device !== parseInt(selectedEnergyDevice)) {
                                    console.log(`Skipping log for device ${log.device} - not our device ${selectedEnergyDevice}`);
                                    return;
                                }
                                
                                const logDate = new Date(log.date);
                                const logYear = logDate.getFullYear();
                                const logMonth = logDate.getMonth() + 1;
                                const logDay = logDate.getDate();
                                
                                // Only process logs for our selected month and year
                                if (logYear === parseInt(year) && logMonth === parseInt(month)) {
                                    const dayKey = logDay - 1; // Convert to 0-based index
                                    const usage = parseFloat(log.total_energy_usage || 0);
                                    
                                    console.log(`Found matching log: day=${logDay}, usage=${usage}`);
                                    
                                    // If we already have a value for this day, use the higher value
                                    if (!dailyData.has(dayKey) || dailyData.get(dayKey) < usage) {
                                        dailyData.set(dayKey, usage);
                                    }
                                }
                            } catch (err) {
                                console.error("Error processing daily log:", err, log);
                            }
                        });
                        
                        // Fill the data points array from our Map
                        dailyData.forEach((value, day) => {
                            dataPoints[day] = value;
                        });
                        
                        console.log("Final data points for month chart:", dataPoints);
                        
                        // Format month name for display
                        const monthName = new Date(selectedMonth + '-01').toLocaleDateString('default', { 
                            month: 'long', 
                            year: 'numeric' 
                        });
                        chartTitle = `Energy Usage for ${monthName} - ${deviceName}`;
                        break;
                        
                    case 'year':
                        // Fetch monthly logs for selected year with direct filtering
                        console.log(`Getting monthly logs for device ${selectedEnergyDevice} for year ${selectedYear}`);
                        
                        // Get monthly data
                        const monthlyResponse = await api.get(`/devicelogsmonthly/?device=${selectedEnergyDevice}`);
                        console.log("Year data response:", monthlyResponse.data);
                        
                        // Manual log of all data to see what we're getting
                        monthlyResponse.data.forEach(log => {
                            console.log(`Monthly log: year=${log.year}, month=${log.month}, device=${log.device}, usage=${log.total_energy_usage}`);
                        });
                        
                        // Set up month labels and data array
                        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        dataPoints = Array(12).fill(0);
                        
                        // Create a Map to ensure we only get one value per month (the latest)
                        const monthlyData = new Map();
                        
                        // Process all returned logs - add defensive checks
                        monthlyResponse.data.forEach(log => {
                            try {
                                // Check if this is actually for our device
                                if (log.device !== parseInt(selectedEnergyDevice)) {
                                    console.log(`Skipping log for device ${log.device} - not our device ${selectedEnergyDevice}`);
                                    return;
                                }
                                
                                // Check if it's for the selected year
                                if (log.year === parseInt(selectedYear)) {
                                    const monthIndex = parseInt(log.month) - 1; // Convert to 0-based
                                    const usage = parseFloat(log.total_energy_usage || 0);
                                    
                                    console.log(`Found matching log: month=${log.month}, usage=${usage}`);
                                    
                                    // If we already have a value for this month, use the higher value
                                    if (!monthlyData.has(monthIndex) || monthlyData.get(monthIndex) < usage) {
                                        monthlyData.set(monthIndex, usage);
                                    }
                                }
                            } catch (err) {
                                console.error("Error processing monthly log:", err, log);
                            }
                        });
                        
                        // Fill the data points array from our Map
                        monthlyData.forEach((value, monthIndex) => {
                            dataPoints[monthIndex] = value;
                        });
                        
                        console.log("Final data points for year chart:", dataPoints);
                        
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
                            backgroundColor: 'rgba(237, 62, 62, 0.2)',  // Match SmartHomePage red color
                            borderColor: 'rgb(237, 62, 62)',            // Match SmartHomePage red color
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: {
                            duration: 1000,
                            easing: 'easeOutQuart',
                            delay: function(context) {
                                return context.dataIndex * 50;
                            }
                        },
                        plugins: {
                            title: {
                                display: true,
                                text: chartTitle,
                                font: { size: 16, weight: 'bold' }
                            },
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(200, 200, 200, 0.3)'
                                },
                                ticks: {
                                    padding: 10
                                },
                                title: {
                                    display: true,
                                    text: 'Energy (kWh)',
                                    padding: {top: 10, bottom: 10}
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                },
                                ticks: {
                                    padding: 10
                                }
                            }
                        },
                        layout: {
                            padding: {
                                left: 10,
                                right: 20,
                                top: 20,
                                bottom: 30
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

    // Add these owner-check related state variables
    const [currentUser, setCurrentUser] = useState(null);
    const [owner, setOwner] = useState(null);
    const [smartHome, setSmartHome] = useState(null);

    // Add useEffect to fetch current user - same as in HomeUsersPage.js
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            try {
                const tokenData = JSON.parse(atob(token.split('.')[1]));
                if (tokenData.user_id) {
                    api.get(`/users/${tokenData.user_id}/`)
                        .then(response => {
                            setCurrentUser(response.data);
                        })
                        .catch(err => {
                            console.error("Error fetching current user:", err);
                        });
                }
            } catch (e) {
                console.error("Error parsing token:", e);
            }
        }
    }, []);
    
    // Add smart home owner fetch to the existing useEffect or create a new one
    useEffect(() => {
        const fetchSmartHomeData = async () => {
            try {
                // Get smart home data to determine ownership
                const response = await api.get(`/smarthomes/${smartHomeId}/`);
                setSmartHome(response.data);
                
                // Get owner details
                const ownerResponse = await api.get(`/users/${response.data.creator}/`);
                setOwner(ownerResponse.data);
            } catch (error) {
                console.error("Error fetching smart home data:", error);
            }
        };
        
        fetchSmartHomeData();
    }, [smartHomeId]);
    
    // Add owner check using the same logic as HomeUsersPage.js
    const isOwner = currentUser && owner && currentUser.id === owner.id;

    return (
        <div className="room-page">
            <Navbar />
            
            {/* Add this back button section */}
            <div className="back-to-overview">
                <Link to={`/smarthomepage/${smartHomeId}`} className="back-button">
                    <span>Overview</span>
                    <ChevronLeft />
                </Link>
            </div>
            
            {/* Keep page header for room name */}
            <div className="page-header">
                {roomData && <h1>{roomData.name}</h1>}
            </div>

            <div className="columns">
                {/* Left column: Energy chart */}
                <div className="column1">
                    <div className="energy-consumption">
                        <div className="energy-info-header">
                            <div className="period-selector">
                                <div className="period-buttons">
                                    {['day', 'month', 'year'].map((period) => (
                                        <button
                                            key={period}
                                            onClick={() => setSelectedPeriod(period)}
                                            className={`period-button ${selectedPeriod === period ? 'active' : ''}`}
                                        >
                                            {period.charAt(0).toUpperCase() + period.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="selectors-container">
                                    <div className="time-selector">
                                        {selectedPeriod === 'day' && (
                                            <select
                                                value={selectedDate}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                className="date-selector"
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
                                                className="month-selector"
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
                                                className="year-selector"
                                            >
                                                {yearOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    
                                    <div className="device-selector">
                                        <select
                                            value={selectedEnergyDevice || ''}
                                            onChange={(e) => setSelectedEnergyDevice(e.target.value)}
                                            disabled={unlockedDevices.length === 0}
                                            className="device-selector"
                                        >
                                            {unlockedDevices.length > 0 ? (
                                                unlockedDevices
                                                    .filter(device => {
                                                        // Filter out sensor devices
                                                        const deviceType = deviceTypes[device.supported_device]?.type?.toLowerCase();
                                                        return !deviceType?.includes('sensor');
                                                    })
                                                    .map((device) => (
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
                                <div className="no-data-message">
                                    <p>No device selected. Add a device to view energy usage.</p>
                                </div>
                            )}
                            <canvas ref={energyChartRef}></canvas>
                            {isDataEmpty && selectedEnergyDevice && (
                                <div className="no-data-message">
                                    <p>No energy data available for this device during the selected {selectedPeriod}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Right column: Device management */}
                <div className="column2">
                    {/* Add Device Button */}
                    {isOwner && lockedDevices.length > 0 && (
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
                                    {isOwner && (
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
                                    )}
                                    
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
                            {isOwner && lockedDevices.length > 0 && (
                                <p>Click "Add Device" to add available devices.</p>
                            )}
                            {!isOwner && (
                                <p>Only the home owner can add or remove devices to this room.</p>
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