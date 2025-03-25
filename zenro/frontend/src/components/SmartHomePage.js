import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import Navbar from "./NavigationBar";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { Chart } from 'chart.js/auto';
import Background from "./Background.js";

/**
 * SmartHomePage component displays the main dashboard for a smart home
 * Features include room management, energy monitoring, and device control
 */
function SmartHomePage() {
  const { id: smartHomeId } = useParams();
  
  // Room management state
  const [addedRooms, setAddedRooms] = useState([]);
  const [lockedRooms, setLockedRooms] = useState([]); 
  const [selectedRoomToUnlock, setSelectedRoomToUnlock] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  
  // Energy usage monitoring state
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [selectedEnergyRoom, setSelectedEnergyRoom] = useState(null);
  const [unlockedRooms, setUnlockedRooms] = useState([]);
  const energyChartRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Energy monitoring view state
  const [showGenerationView, setShowGenerationView] = useState(false);
  const energyGenerationChartRef = useRef(null);
  const [isGenerationDataEmpty, setIsGenerationDataEmpty] = useState(false);
  const [isConsumptionDataEmpty, setIsConsumptionDataEmpty] = useState(false);

  const [smartHome, setSmartHome] = useState(null);

  // Add these state variables for owner checking
  const [currentUser, setCurrentUser] = useState(null);
  const [owner, setOwner] = useState(null);

  /**
   * Unlock a room in the smart home
   */
  const handleUnlockRoom = async () => {
    if (!selectedRoomToUnlock) {
      alert("Please select a room to unlock.");
      return;
    }

    try {
      console.log("Unlocking room:", selectedRoomToUnlock);
      
      // Find the room object from our lockedRooms array
      const roomToUnlock = lockedRooms.find(room => room.id === parseInt(selectedRoomToUnlock));
      
      if (!roomToUnlock) {
        throw new Error("Selected room not found in locked rooms list");
      }
      
      // Update room to set is_unlocked to true (keeping original name)
      const updatedRoom = {
        ...roomToUnlock,
        is_unlocked: true
      };
      
      // PUT request to update the room
      const response = await api.put(`/rooms/${selectedRoomToUnlock}/`, updatedRoom);
      console.log("Room unlocked successfully:", response.data);
      
      // Update local state
      setAddedRooms(prevRooms => [...prevRooms, response.data]);
      setLockedRooms(prevRooms => prevRooms.filter(room => room.id !== parseInt(selectedRoomToUnlock)));
      setUnlockedRooms(prevRooms => [...prevRooms, response.data]);
      
      // Reset form field
      setSelectedRoomToUnlock(null);
      setIsModalOpen(false);
      
      // If this is the first room, select it for energy monitoring
      if (!selectedEnergyRoom) {
        setSelectedEnergyRoom(response.data.id);
      }
    } catch (error) {
      console.error("Error unlocking room:", error.response?.data || error.message);
      alert("Failed to unlock room. Please try again.");
    }
  };

  /**
   * "Delete" a room by locking it and its devices
   * This doesn't actually delete the room but sets is_unlocked to false
   * Also turns off any devices that are currently on
   */
  const handleDeleteRoom = async (roomId) => {
    try {
      // Get the room details before updating
      const roomToDelete = addedRooms.find(room => room.id === roomId);
      
      if (!roomToDelete) {
        throw new Error("Room not found");
      }
      
      // 1. Get all devices
      const devicesResponse = await api.get('/devices/');
      const allDevices = devicesResponse.data;
      
      // Filter devices for this room
      const roomDevices = allDevices.filter(device => device.room === parseInt(roomId));
      
      console.log(`Found ${roomDevices.length} devices in room ${roomId}`);
      
      // 2. Update each unlocked device to turn off and lock it
      const updatePromises = roomDevices
        .filter(device => device.is_unlocked) // Only update unlocked devices
        .map(device => {
          const updatedDevice = {
            ...device,
            status: false, // Turn off the device if it was on
            is_unlocked: false // Lock the device
          };
          console.log(`Turning off and locking device: ${device.id} - ${device.name}`);
          return api.put(`/devices/${device.id}/`, updatedDevice);
        });
      
      // Wait for all device updates to complete
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log(`Turned off and locked ${updatePromises.length} devices in room ${roomId}`);
      }
      
      // 3. Update the room to is_unlocked=false
      const updatedRoom = {
        ...roomToDelete,
        is_unlocked: false
      };
      
      const roomResponse = await api.put(`/rooms/${roomId}/`, updatedRoom);
      console.log("Room locked:", roomResponse.data);
      
      // 4. Update state
      // Remove from addedRooms (unlocked)
      setAddedRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
      
      // Add to lockedRooms
      setLockedRooms(prevRooms => [...prevRooms, {...roomToDelete, is_unlocked: false}]);
      
      // Update UI message
      alert("Selected room has been successfully deleted");
      
    } catch (error) {
      console.error("Failed to lock room:", error.response?.data || error.message);
      alert("Failed to lock room. Please try again.");
    }
  };

  /**
   * Fetch smart home data on initial load
   */
  useEffect(() => {
    // Fetch ALL rooms for this smart home (both locked and unlocked)
    api.get(`/rooms/?smart_home=${smartHomeId}`)
      .then((res) => {
        const allSmartHomeRooms = res.data;
        console.log("All rooms for smart home:", allSmartHomeRooms);
        
        // Filter rooms into locked and unlocked categories
        const unlockedRooms = allSmartHomeRooms.filter(room => room.is_unlocked);
        const locked = allSmartHomeRooms.filter(room => !room.is_unlocked);
        
        console.log("Unlocked rooms:", unlockedRooms);
        console.log("Locked rooms:", locked);
        
        // Update both state variables
        setAddedRooms(unlockedRooms);
        setLockedRooms(locked);
        
        // Set for energy monitor
        setUnlockedRooms(unlockedRooms);
        
        // Set default room if available
        if (unlockedRooms.length > 0 && !selectedEnergyRoom) {
          setSelectedEnergyRoom(unlockedRooms[0].id);
        }
      })
      .catch((error) => {
        console.error("Error fetching rooms:", error);
      });
  }, [smartHomeId, selectedEnergyRoom]);

  // Fetch smart home data
  useEffect(() => {
    api.get(`/smarthomes/${smartHomeId}/`)
      .then((res) => {
        setSmartHome(res.data);
        
        // Get owner details
        api.get(`/users/${res.data.creator}/`)
          .then(ownerResponse => {
            setOwner(ownerResponse.data);
          })
          .catch(err => {
            console.error("Error fetching owner:", err);
          });
      })
      .catch((error) => {
        console.error("Error fetching smart home details:", error);
      });
  }, [smartHomeId]);

  // Add this useEffect to fetch the current user - Exact same approach as HomeUsersPage.js
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

  // Add this check exactly like in HomeUsersPage.js
  const isOwner = currentUser && owner && currentUser.id === owner.id;

  /**
   * Update energy chart when data selection changes
   */
  useEffect(() => {
    if (!energyChartRef.current || !selectedEnergyRoom) return;
    
    const fetchEnergyData = async () => {
      try {
        let labels = [];
        let dataPoints = [];
        let chartTitle = '';
        
        // Find the room object for display name
        const roomObj = unlockedRooms.find(r => r.id === selectedEnergyRoom);
        const roomName = roomObj ? roomObj.name : 'Selected Room';
        
        switch (selectedPeriod) {
          case 'day':
            // Fetch and filter minute-level logs
            const response = await api.get(`/roomlogs1min/?room=${selectedEnergyRoom}`);
            
            const dailyLogs = response.data.filter(log => {
              // Get date as string in format "YYYY-MM-DD"
              const createdAtDateString = log.created_at.split('T')[0];
              return createdAtDateString === selectedDate;
            });
            
            // Group logs by hour
            const hourlyData = Array(24).fill(0);
            dailyLogs.forEach(log => {
              const hour = new Date(log.created_at).getHours();
              hourlyData[hour] += log.energy_usage;
            });
            
            labels = Array.from({length: 24}, (_, i) => `${i}:00`);
            dataPoints = hourlyData;
            
            // Format date for display without timezone issues
            const parts = selectedDate.split('-');
            const displayDate = `${parts[1]}/${parts[2]}/${parts[0]}`;
            chartTitle = `Energy Usage on ${displayDate} (${roomName})`;
            break;
            
          case 'month':
            // Fetch and filter daily logs
            const monthlyResponse = await api.get(`/roomlogsdaily/?room=${selectedEnergyRoom}`);
            console.log("Month data response for room:", monthlyResponse.data);
            
            const [year, month] = selectedMonth.split('-');
            
            // Use a Map to handle potential duplicates by date
            const dailyUsageMap = new Map();
            
            // First pass: organize data by day to avoid duplicates
            monthlyResponse.data.forEach(log => {
              try {
                // Only include data from our target room
                if (log.room !== parseInt(selectedEnergyRoom)) {
                  return;
                }
      
                const dateStr = log.date;
                if (!dateStr) return;
                
                const logDate = new Date(dateStr);
                const logYear = logDate.getFullYear();
                const logMonth = logDate.getMonth() + 1;
                
                // Only include data from our target month and year
                if (logYear === parseInt(year) && logMonth === parseInt(month)) {
                  // Use ISO date as key to avoid duplicates
                  const dayKey = logDate.toISOString().split('T')[0];
                  const day = logDate.getDate();
                  
                  // Get energy value
                  const energyValue = parseFloat(log.total_energy_usage || 0);
                  
                  console.log(`Day ${day}: Found energy value: ${energyValue} for ${dayKey}`);
                  
                  // Only store the value if it doesn't already exist or if it's larger
                  if (!dailyUsageMap.has(dayKey) || dailyUsageMap.get(dayKey) < energyValue) {
                    dailyUsageMap.set(dayKey, energyValue);
                  }
                }
              } catch (err) {
                console.error("Error processing monthly room log:", log, err);
              }
            });
            
            // Create day labels based on days in month
            const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
            labels = Array.from({length: daysInMonth}, (_, i) => `${i+1}`);
            
            // Second pass: fill the dataPoints array from our map
            dataPoints = Array(daysInMonth).fill(0);
            dailyUsageMap.forEach((value, dateStr) => {
              const day = new Date(dateStr).getDate();
              if (day >= 1 && day <= daysInMonth) {
                dataPoints[day-1] = value;
                console.log(`Final value for day ${day}: ${value} kWh`);
              }
            });
            
            // Format month for display
            const displayMonth = new Date(selectedMonth + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' });
            chartTitle = `Energy Usage for ${displayMonth} (${roomName})`;
            break;
            
          case 'year':
            // Fetch and filter monthly logs
            const yearlyResponse = await api.get(`/roomlogsmonthly/?room=${selectedEnergyRoom}`);
            console.log("Year data response for room:", yearlyResponse.data);
            
            // Use a Map to handle potential duplicates by month
            const monthlyUsageMap = new Map();
            
            // First pass: organize data by month to avoid duplicates
            yearlyResponse.data.forEach(log => {
              try {
                // Only include data from our target room
                if (log.room !== parseInt(selectedEnergyRoom)) {
                  return;
                }
                
                // Only include data from our target year
                if (log.year === parseInt(selectedYear)) {
                  const monthIndex = parseInt(log.month) - 1; // Convert to 0-based
                  
                  // Get energy value
                  const energyValue = parseFloat(log.total_energy_usage || 0);
                  
                  console.log(`Month ${monthIndex+1}: Found energy value: ${energyValue}`);
                  
                  // Only store the value if it doesn't already exist or if it's larger
                  if (!monthlyUsageMap.has(monthIndex) || monthlyUsageMap.get(monthIndex) < energyValue) {
                    monthlyUsageMap.set(monthIndex, energyValue);
                  }
                }
              } catch (err) {
                console.error("Error processing yearly room log:", log, err);
              }
            });
            
            // Set up month labels
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            // Second pass: fill the dataPoints array from our map
            dataPoints = Array(12).fill(0);
            monthlyUsageMap.forEach((value, monthIndex) => {
              if (monthIndex >= 0 && monthIndex < 12) {
                dataPoints[monthIndex] = value;
                console.log(`Final value for month ${monthIndex+1}: ${value} kWh`);
              }
            });
            
            chartTitle = `Energy Usage for ${selectedYear} (${roomName})`;
            break;
        }
        
        // Check if we have any data to display
        const isEmpty = dataPoints.every(val => val === 0 || val === null);
        setIsConsumptionDataEmpty(isEmpty);

        if (isEmpty) {
          const existingChart = Chart.getChart(energyChartRef.current);
          if (existingChart) {
            existingChart.destroy();
          }
          
          // Create empty chart to clear canvas
          new Chart(energyChartRef.current.getContext('2d'), {
            type: 'bar',
            data: {
              labels: [],
              datasets: [{
                data: []
              }]
            },
            options: {
              plugins: { legend: { display: false } },
              scales: { x: { display: false }, y: { display: false } }
            }
          });
          
          return;
        }
        
        // Create or update energy chart
        const chartConfig = {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Energy Usage (kWh)',
              data: dataPoints,
              backgroundColor: 'rgba(237, 62, 62, 0.2)',
              borderColor: 'rgb(237, 62, 62)',
              borderWidth: 2,
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
              legend: {
                display: false // Changed from position: 'bottom' to hide the legend
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Energy (kWh)'
                }
              }
            }
          }
        };
        
        const existingChart = Chart.getChart(energyChartRef.current);
        if (existingChart) {
          existingChart.destroy();
        }
        
        new Chart(energyChartRef.current.getContext('2d'), chartConfig);
        
      } catch (error) {
        console.error('Error fetching energy data:', error);
      }
    };
    
    fetchEnergyData();
  }, [selectedPeriod, selectedEnergyRoom, selectedDate, selectedMonth, selectedYear, unlockedRooms]);

  /**
   * Toggle between energy consumption and generation views
   */
  const toggleEnergyView = () => {
    // Store current state before toggling (for conditional logic)
    const isCurrentlyShowingGeneration = showGenerationView;
    
    // Update the view state
    setShowGenerationView(!showGenerationView);
    
    // When switching FROM generation TO consumption, set up default display
    if (isCurrentlyShowingGeneration && unlockedRooms.length > 0) {
      // Select a random unlocked room for variety
      const randomIndex = Math.floor(Math.random() * unlockedRooms.length);
      const randomRoom = unlockedRooms[randomIndex];
      
      // Force chart to display today's data for the random room
      setSelectedPeriod('day');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      
      // Set selected room last to trigger the useEffect
      setTimeout(() => {
        setSelectedEnergyRoom(randomRoom.id);
      }, 100);
    }
  };

  /**
   * Fetch and render energy generation data when view changes
   */
  useEffect(() => {
    if (!energyGenerationChartRef.current || !showGenerationView) return;
    
    const fetchEnergyGenerationData = async () => {
      try {
        let labels = [];
        let dataPoints = [];
        let chartTitle = '';
        
        switch (selectedPeriod) {
          case 'day':
            // Fetch minute-level generation logs for the selected day
            const response = await api.get(`/energy-generation/?home=${smartHomeId}`);
            
            const dailyLogs = response.data.filter(log => {
              const createdAtDateString = log.created_at.split('T')[0];
              return createdAtDateString === selectedDate;
            });
            
            // Group logs by hour
            const hourlyData = Array(24).fill(0);
            dailyLogs.forEach(log => {
              const hour = new Date(log.created_at).getHours();
              hourlyData[hour] += log.energy_generation;
            });
            
            labels = Array.from({length: 24}, (_, i) => `${i}:00`);
            dataPoints = hourlyData;
            
            // Format date for display
            const parts = selectedDate.split('-');
            const displayDate = `${parts[1]}/${parts[2]}/${parts[0]}`;
            chartTitle = `Energy Generation on ${displayDate}`;
            break;
            
          case 'month':
            // Fetch daily generation logs for the selected month
            const monthlyResponse = await api.get(`/energy-generation-daily/?home=${smartHomeId}`);
            
            const [year, month] = selectedMonth.split('-');
            const monthlyLogs = monthlyResponse.data.filter(log => {
              const logDate = new Date(log.date);
              return logDate.getFullYear() === parseInt(year) && 
                     logDate.getMonth() === parseInt(month) - 1;
            });
            
            // Create day labels based on days in month
            const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
            labels = Array.from({length: daysInMonth}, (_, i) => `${i+1}`);
            
            // Map daily logs to days
            dataPoints = Array(daysInMonth).fill(0);
            monthlyLogs.forEach(log => {
              const day = new Date(log.date).getDate();
              dataPoints[day-1] = log.total_energy_generation;
            });
            
            // Format month for display
            const displayMonth = new Date(selectedMonth + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' });
            chartTitle = `Energy Generation for ${displayMonth}`;
            break;
            
          case 'year':
            // Fetch monthly generation logs for the selected year
            const yearlyResponse = await api.get(`/energy-generation-monthly/?home=${smartHomeId}`);
            
            const yearlyLogs = yearlyResponse.data.filter(log => 
              log.year === parseInt(selectedYear)
            );
            
            // Set up month labels
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            // Map logs to months
            dataPoints = Array(12).fill(0);
            yearlyLogs.forEach(log => {
              dataPoints[log.month-1] = log.total_energy_generation;
            });
            
            chartTitle = `Energy Generation for ${selectedYear}`;
            break;
        }
        
        // Check if we have any data to display
        const isEmpty = dataPoints.every(val => val === 0 || val === null);
        setIsGenerationDataEmpty(isEmpty);

        if (isEmpty) {
          const existingChart = Chart.getChart(energyGenerationChartRef.current);
          if (existingChart) {
            existingChart.destroy();
          }
          
          // Create empty chart to clear canvas
          new Chart(energyGenerationChartRef.current.getContext('2d'), {
            type: 'bar',
            data: {
              labels: [],
              datasets: [{
                data: []
              }]
            },
            options: {
              plugins: { legend: { display: false } },
              scales: { x: { display: false }, y: { display: false } }
            }
          });
          
          return;
        }
        
        // Create or update energy generation chart
        const chartConfig = {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Energy Generation (kWh)',
              data: dataPoints,
              backgroundColor: 'rgba(75, 192, 75, 0.2)',
              borderColor: 'rgb(75, 192, 75)',
              borderWidth: 2,
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
              legend: {
                display: false // Changed from position: 'bottom' to hide the legend
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Energy (kWh)'
                }
              }
            }
          }
        };
        
        const existingChart = Chart.getChart(energyGenerationChartRef.current);
        if (existingChart) {
          existingChart.destroy();
        }
        
        new Chart(energyGenerationChartRef.current.getContext('2d'), chartConfig);
        
      } catch (error) {
        console.error('Error fetching energy generation data:', error);
      }
    };
    
    fetchEnergyGenerationData();
  }, [selectedPeriod, selectedDate, selectedMonth, selectedYear, smartHomeId, showGenerationView]);

  /**
   * Generate date options for the energy chart selectors
   */
  const generateDateOptions = () => {
    const options = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Create date strings in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const formattedValue = `${year}-${month}-${day}`;
      const formattedLabel = date.toLocaleDateString();
      
      options.push({ value: formattedValue, label: formattedLabel });
    }
    return options;
  };

  /**
   * Generate month options for the energy chart selectors
   */
  const generateMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const formattedMonth = `${year}-${month}`;
      const label = date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
      options.push({ value: formattedMonth, label });
    }
    return options;
  };

  /**
   * Generate year options for the energy chart selectors
   */
  const generateYearOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      options.push({ value: year.toString(), label: year.toString() });
    }
    return options;
  };

  // Prepare date options for dropdowns
  const dateOptions = generateDateOptions();
  const monthOptions = generateMonthOptions();
  const yearOptions = generateYearOptions();

  return (
    <div className="shp-main-content">
        <div className="smart-home-page">
        <Background showLogo={false} blurEffect={true} />
        <Navbar />
        <div className="shp-information">
          {/* Simple smart home name header - just text, no card */}
          {smartHome && (
            <h1 className="smart-home-title">{smartHome.name}</h1>
          )}

          {/* Delete Room Confirmation Modal */}
          {isDeleteModalOpen && (
              <div className="modal-overlay">
                <div className="modal">
                  <h2>Delete Room</h2>
                  <p>
                    Are you sure you want to delete this room?
                    This will remove the room and all its devices from your home.
                  </p>
                  <div className="modal-buttons">
                    <button
                      onClick={() => {
                        handleDeleteRoom(roomToDelete);
                        setIsDeleteModalOpen(false);
                      }}
                    >
                      Yes, Delete Room
                    </button>
                    <button
                      onClick={() => {
                        setIsDeleteModalOpen(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* Energy Information Section */}
          <div className={`energy-info ${showGenerationView ? 'generation-view' : 'consumption-view'}`}>
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
              </div>
              
              {/* Toggle button that changes based on current view */}
              <button 
                onClick={toggleEnergyView} 
                className={`view-toggle-button ${showGenerationView ? 'consumption' : 'generation'}`}
              >
                {showGenerationView 
                  ? "View Room Energy Consumption" 
                  : "View Home Energy Generation"}
              </button>
            </div>

            {/* Consumption view */}
            {!showGenerationView && (
              <div className="chart-container consumption-chart">
                <select
                  value={selectedEnergyRoom}
                  onChange={(e) => setSelectedEnergyRoom(e.target.value)}
                  className="room-selector"
                  disabled={unlockedRooms.length === 0}
                >
                  {unlockedRooms.length === 0 ? (
                    <option value="">No unlocked rooms</option>
                  ) : (
                    unlockedRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))
                  )}
                </select>
                <canvas ref={energyChartRef}></canvas>
                {isConsumptionDataEmpty && (
                  <div className="no-data-message">
                    <p>No energy data available for this {selectedPeriod} for this room</p>
                  </div>
                )}
                {unlockedRooms.length === 0 && (
                  <div className="no-data-message">
                    <p>No unlocked rooms available. Please unlock rooms to view energy data.</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Generation view */}
            {showGenerationView && (
              <div className="chart-container generation-chart">
                <canvas ref={energyGenerationChartRef}></canvas>
                {isGenerationDataEmpty && (
                  <div className="no-data-message">
                    <p>No energy generation data available for this {selectedPeriod}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rooms Container */}
          <div className="shp-rooms">
            <h1>Rooms</h1>
            <hr className="shp-rooms-divider" />

            <div className="shp-rooms-list-container">
              <ul className="shp-rooms-list">
                {addedRooms.length === 0 ? (
                  <h4 style={{ color: "#515739", fontSize: "0.9rem" }}>No rooms added yet. {isOwner ? "Use the \"Add Room\" button to add a room." : "Only the home owner can add or remove rooms."}</h4>
                ) : (
                  addedRooms.map((room) => (
                    <div
                      key={room.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                      }}
                    >
                      <li >
                        <div className="shp-room-icon" style={{ marginRight: "10px" }}>
                          <i className="fa-solid fa-couch"></i>
                        </div>
                        <Link
                          to={`/room/${room.id}/${smartHomeId}`}
                          className="shp-rooms-list-links"
                        >
                          {room.name}
                        </Link>
                      </li>
                      {/* Only render delete button for owners */}
                      {isOwner && (
                        <button
                          className="delete-room-button"
                          onClick={() => {
                            setRoomToDelete(room.id);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <i className="fa-solid fa-trash delete-icon"></i>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </ul>
            </div>

            {/* Only render Add Room button for owners */}
            {isOwner && (
              <button
                className="shp-add-room-button"
                onClick={() => {
                  if (lockedRooms.length > 0) {
                    setIsModalOpen(true);
                  } else {
                    alert("All rooms have already been added to the Home. Consider expanding your Home to include more rooms?");
                  }
                }}
              >
                + Add Room
              </button>
            )}
          </div>

          {/* Add Room Modal */}
          {isModalOpen && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>Add a Room</h2>
                {lockedRooms.length > 0 ? (
                  <>
                    <select
                      value={selectedRoomToUnlock}
                      onChange={(e) => setSelectedRoomToUnlock(e.target.value)}
                      className="room-dropdown"
                    >
                      <option value="">Select a Room to Add</option>
                      {lockedRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name || room.home_io_room_name}
                        </option>
                      ))}
                    </select>
                    <div className="modal-buttons" style={{ marginTop: "20px" }}>
                      <button onClick={handleUnlockRoom}>Add Room</button>
                      <button onClick={() => setIsModalOpen(false)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ margin: "20px 0", color: "#666" }}>
                      All rooms have already been unlocked in this Home. Consider expanding your Home to include more rooms?
                    </p>
                    <div className="modal-buttons">
                      <button onClick={() => setIsModalOpen(false)}>Close</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* View Home Users Button - add this before the closing div */}
          <div className="view-home-users-container">
            <Link 
              to={`/home-users/${smartHomeId}`} 
              className="view-home-users-button"
            >
              <i className="fa-solid fa-users"></i> View Home Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SmartHomePage;