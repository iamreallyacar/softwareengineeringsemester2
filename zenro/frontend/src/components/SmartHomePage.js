import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { Chart } from 'chart.js/auto';

import airCond from "../assets/images/aircond.png";

/**
 * SmartHomePage component displays the main dashboard for a smart home
 * Features include room management, energy monitoring, and device control
 */
function SmartHomePage() {
  const { id: smartHomeId } = useParams();
  
  // Room management state
  const [addedRooms, setAddedRooms] = useState([]);
  const [homeIORooms, setHomeIORooms] = useState([]);
  const [selectedHomeIORoom, setSelectedHomeIORoom] = useState(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  
  // Device management state
  const [supportedDevices, setSupportedDevices] = useState([]);
  
  // CCTV display state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoomCCTV, setSelectedRoomCCTV] = useState("Living Room");
  
  // Appliances control state
  const [isOpenLR, setIsOpenLR] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("Living Room");
  const [isOn, setIsOn] = useState(false);
  
  // Room selector options
  const allRooms = ["Living Room", "Kitchen", "Bedroom", "Bathroom", "Garage", "Backyard"];
  
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

  /**
   * Add a new room to the smart home
   */
  const handleAddRoom = async () => {
    if (!selectedHomeIORoom || !newRoomName) {
      alert("Please select a room and enter a name.");
      return;
    }

    const payload = {
      home_io_room: selectedHomeIORoom,
      smart_home: smartHomeId,
      name: newRoomName,
    };

    try {
      const response = await api.post(`/rooms/`, payload);
      setAddedRooms((prevRooms) => [...prevRooms, response.data]);
      setSelectedHomeIORoom(null);
      setNewRoomName("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to add room:", error.response?.data || error.message);
      alert("Failed to add room. Please try again.");
    }
  };

  /**
   * Delete a room from the smart home
   */
  const handleDeleteRoom = async (roomId) => {
    try {
      await api.delete(`/rooms/${roomId}/`);
      setAddedRooms((prevRooms) => prevRooms.filter((room) => room.id !== roomId));
    } catch (error) {
      console.error("Failed to delete room:", error.response?.data || error.message);
      alert("Failed to delete room. Please try again.");
    }
  };

  /**
   * Update CCTV room selection
   */
  const handleRoomSelectCCTV = (room) => {
    setSelectedRoomCCTV(room);
    setIsOpen(false);
  };

  /**
   * Update appliance room selection
   */
  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setIsOpenLR(false);
  };

  /**
   * Fetch smart home data on initial load
   */
  useEffect(() => {
    // Fetch rooms for this smart home
    api.get(`/rooms/?smart_home=${smartHomeId}`)
      .then((res) => {
        setAddedRooms(res.data);
        
        // Filter only unlocked rooms
        const unlocked = res.data.filter(room => room.is_unlocked);
        setUnlockedRooms(unlocked);
        
        // Set default room if available
        if (unlocked.length > 0 && !selectedEnergyRoom) {
          setSelectedEnergyRoom(unlocked[0].id);
        }
      })
      .catch((error) => {
        console.error("Error fetching rooms:", error);
      });

    // Fetch supported devices
    api.get("/supporteddevices/")
      .then((res) => {
        setSupportedDevices(res.data);
      })
      .catch((error) => {
        console.error("Error fetching supported devices:", error);
      });

    // Fetch homeio-rooms
    api.get("/homeio-rooms/")
      .then((res) => {
        setHomeIORooms(res.data);
      })
      .catch((error) => {
        console.error("Error fetching homeio-rooms:", error);
      });
  }, [smartHomeId]);

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
              dataPoints[day-1] = log.total_energy_usage;
            });
            
            // Format month for display
            const displayMonth = new Date(selectedMonth + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' });
            chartTitle = `Energy Usage for ${displayMonth} (${roomName})`;
            break;
            
          case 'year':
            // Fetch and filter monthly logs
            const yearlyResponse = await api.get(`/roomlogsmonthly/?room=${selectedEnergyRoom}`);
            
            const yearlyLogs = yearlyResponse.data.filter(log => 
              log.year === parseInt(selectedYear)
            );
            
            // Set up month labels
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            // Map logs to months
            dataPoints = Array(12).fill(0);
            yearlyLogs.forEach(log => {
              dataPoints[log.month-1] = log.total_energy_usage;
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
    <div className="smart-home-page">
      <Sidebar />
      <div className="shp-information">
        {/* CCTV Container */}
        <div className="shp-CCTV">
          <button onClick={() => setIsOpen(!isOpen)}>
            {selectedRoomCCTV} {isOpen ? "▲" : "▼"}
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <ul className="shp-cctv-room-list">
                  {allRooms.map((room, index) => (
                    <motion.li
                      key={room}
                      onClick={() => handleRoomSelectCCTV(room)}
                      initial={{ opacity: 0, y: -30 }}
                      animate={{ opacity: 1, y: -20 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ delay: index * 0.2, duration: 0.3 }}
                    >
                      {room}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="shp-cctv-view">
            <h1>CCTV</h1>
          </div>

          <div className="shp-cctv-statistics">
            <div className="shp-statistics">
              <i className="fas fa-temperature-low"></i>
              <span>Temperature</span>
            </div>
            <div className="shp-statistics">
              <i className="fa-solid fa-bolt"></i>
              <span>Power Usage</span>
            </div>
            <div className="shp-statistics">
              <i className="fa-solid fa-droplet"></i>
              <span>Humidity</span>
            </div>
            <div className="shp-statistics">
              <i className="fa-solid fa-lightbulb"></i>
              <span>Light</span>
            </div>
          </div>
        </div>

        {/* Rooms Container */}
        <div className="shp-rooms">
          <h1>Rooms</h1>
          <hr className="shp-rooms-divider" />

          <div className="shp-rooms-list-container">
            <ul className="shp-rooms-list">
              {addedRooms.length === 0 ? (
                <h4>No rooms added yet. Use the "Add Room" button to add a room.</h4>
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
                    <li style={{ listStyle: "none", flex: 1, display: "flex", alignItems: "center" }}>
                      <div className="shp-room-icon" style={{ marginRight: "10px" }}>
                        <i className="fa-solid fa-couch"></i>
                      </div>
                      <Link
                        to={`/room/${room.id}/${smartHomeId}`}
                        className="shp-rooms-list-links"
                        style={{ textDecoration: "none", color: "#333", fontWeight: "bold" }}
                      >
                        {room.name}
                      </Link>
                    </li>
                    <button
                      className="delete-room-button"
                      onClick={() => {
                        setRoomToDelete(room.id);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <i className="fa-solid fa-trash delete-icon"></i>
                    </button>
                  </div>
                ))
              )}
            </ul>
          </div>

          {/* Delete Room Confirmation Modal */}
          {isDeleteModalOpen && (
            <div className="modal-overlay">
              <div className="modal">
                <h2>Delete Room</h2>
                <p style={{ fontSize: "17px", color: "#666", marginTop: "10px" }}>
                  Are you sure you want to delete this room?
                  Deleting this room will also remove all associated devices.
                </p>
                <div className="modal-buttons">
                  <button
                    onClick={() => {
                      handleDeleteRoom(roomToDelete);
                      setIsDeleteModalOpen(false);
                    }}
                  >
                    Yes
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

          <button
            className="shp-add-room-button"
            onClick={() => setIsModalOpen(true)}
          >
            + Add Room
          </button>
        </div>

        {/* Add Room Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Add New Room</h2>
              <select
                value={selectedHomeIORoom}
                onChange={(e) => setSelectedHomeIORoom(e.target.value)}
                className="room-dropdown"
              >
                <option value="">Select a Room</option>
                {homeIORooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Enter Custom Room Name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="room-name-input"
              />
              <div className="modal-buttons">
                <button onClick={handleAddRoom}>Add Room</button>
                <button onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Appliances Container */}
        <div className="shp-appliances">
          <div className="shp-appliances-room-select">
            <h3 onClick={() => setIsOpenLR(!isOpenLR)}>
              {selectedRoom} {isOpenLR ? "▲" : "▼"}
            </h3>

            <AnimatePresence>
              {isOpenLR && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <ul className="shp-appliances-room-list">
                    {allRooms.map((room, index) => (
                      <motion.li
                        onClick={() => handleRoomSelect(room)}
                        key={room}
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: -20 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ delay: index * 0.2, duration: 0.3 }}
                      >
                        {room}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            <p>Smart Air Conditioner</p>
          </div>

          <div className="shp-appliances-on-off-button">
            <button
              onClick={() => setIsOn(!isOn)}
              className={isOn ? "shp-appliances-button-on" : "shp-appliances-button-off"}
            >
              <span className="status-dot"></span>
              {isOn ? "ON" : "OFF"}
            </button>
          </div>

          <div className="shp-appliances-img-container">
            <img className="shp-appliances-img" src={airCond} alt="Air Conditioner" />
          </div>

          <div className="shp-appliances-statistics">
            <p className="shp-statistics">Total Uptime</p>
            <p className="shp-statistics">Fan Speed</p>
            <p className="shp-statistics">Temperature</p>
          </div>
        </div>

        {/* Energy Information Section with Card Flip Effect */}
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
      </div>
    </div>
  );
}

export default SmartHomePage;