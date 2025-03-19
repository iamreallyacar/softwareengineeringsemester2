import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { Chart } from 'chart.js/auto'

import airCond from "../assets/images/aircond.png";

function SmartHomePage() {
  const { id: smartHomeId } = useParams(); // The current smart home’s ID
  const [rooms, setRooms] = useState([]);
  const [supportedDevices, setSupportedDevices] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedSupportedDevice, setSelectedSupportedDevice] = useState("");
  const [deviceName, setDeviceName] = useState("");
  // boolean for drop-down list for CCTV
  const [isOpen, setIsOpen] = useState(false);
  // boolean for drop-down list for appliances 
  const [isOpenLR, setIsOpenLR] = useState(false);
  // constant for all rooms
  const allRooms = ["Living Room", "Kitchen", "Bedroom", "Bathroom", "Garage", "Backyard"];
  // variable to change the names of the room for drop-down list in cctv container
  const [selectedRoomCCTV, setSelectedRoomCCTV] = useState("Living Room");
  // variable to change the names of the room for drop-down list in appliances container
  const [selectedRoom, setSelectedRoom] = useState("Living Room");
  // boolean to check if the appliances is turning on or off, in appliances container
  const [isOn, setIsOn] = useState(false);

  // State to store the list of added rooms
  const [addedRooms, setAddedRooms] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [newRoomName, setNewRoomName] = useState(""); // State for the new room name
  const [homeIORooms, setHomeIORooms] = useState([]);
  const [selectedHomeIORoom, setSelectedHomeIORoom] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State for delete modal visibility
  const [roomToDelete, setRoomToDelete] = useState(null); // State to store the room to be deleted

  // State to store the energy data
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [selectedEnergyRoom, setSelectedEnergyRoom] = useState(null);
  const [unlockedRooms, setUnlockedRooms] = useState([]);
  const energyChartRef = useRef(null);

  // New state variables for date selection
  const [availableDates, setAvailableDates] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Today
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Current month
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const handleRoomSelectCCTV = (room) => {
    setSelectedRoomCCTV(room);
    setIsOpen(false);
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setIsOpenLR(false);
  };

  // Function to handle adding a room
  const handleAddRoom = async () => {
    if (!selectedHomeIORoom || !newRoomName) {
      alert("Please select a room and enter a name.");
      return;
    }

    const payload = {
      home_io_room: selectedHomeIORoom, // The ID of the HomeIORoom
      smart_home: smartHomeId, // The ID of the current smart home
      name: newRoomName, // The custom name of the room
    };

    console.log("Sending payload:", payload); // Log the payload

    try {
      // Send the POST request to add the room
      const response = await api.post(`/rooms/`, payload);

      // Update the local state with the newly added room
      setAddedRooms((prevRooms) => [...prevRooms, response.data]);

      // Clear the input and close the modal
      setSelectedHomeIORoom(null);
      setNewRoomName("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to add room:", error.response?.data || error.message);
      alert("Failed to add room. Please try again.");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      // await api.delete(`/rooms/${roomId}/`); // Send DELETE request to the API
      // setAddedRooms((prevRooms) => prevRooms.filter((room) => room.id !== roomId)); // Remove the room from the state
      // alert("Room deleted successfully.");
    } catch (error) {
      console.error("Failed to delete room:", error.response?.data || error.message);
      alert("Failed to delete room. Please try again.");
    }
  };

  useEffect(() => {
    // Fetch rooms for this smart home
    api.get(`/rooms/?smart_home=${smartHomeId}`)
      .then((res) => {
        setAddedRooms(res.data); // Populate the addedRooms state with the fetched data
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
        setHomeIORooms(res.data); // Store the fetched homeio-rooms data
      })
      .catch((error) => {
        console.error("Error fetching homeio-rooms:", error);
      });
  }, [smartHomeId]);

  // Add new useEffect to fetch available dates when room changes
  useEffect(() => {
    if (!selectedEnergyRoom) return;
    
    // Fetch available dates for the selected room (1Min logs)
    api.get(`/roomlogs1min/available-dates/?room=${selectedEnergyRoom}`)
      .then(res => {
        setAvailableDates(res.data.dates || []);
        if (res.data.dates && res.data.dates.length > 0) {
          setSelectedDate(res.data.dates[res.data.dates.length - 1]); // Select most recent date
        }
      })
      .catch(error => {
        console.error("Error fetching available dates:", error);
      });
    
    // Fetch available months for the selected room (Daily logs)
    api.get(`/roomlogsdaily/available-months/?room=${selectedEnergyRoom}`)
      .then(res => {
        setAvailableMonths(res.data.months || []);
        if (res.data.months && res.data.months.length > 0) {
          setSelectedMonth(res.data.months[res.data.months.length - 1]); // Select most recent month
        }
      })
      .catch(error => {
        console.error("Error fetching available months:", error);
      });
    
    // Fetch available years for the selected room (Monthly logs)
    api.get(`/roomlogsmonthly/available-years/?room=${selectedEnergyRoom}`)
      .then(res => {
        setAvailableYears(res.data.years || []);
        if (res.data.years && res.data.years.length > 0) {
          setSelectedYear(res.data.years[res.data.years.length - 1]); // Select most recent year
        }
      })
      .catch(error => {
        console.error("Error fetching available years:", error);
      });
  }, [selectedEnergyRoom]);

  // Replace the energy chart useEffect
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
            // Just get all logs and filter on frontend
            const response = await api.get(`/roomlogs1min/?room=${selectedEnergyRoom}`);
            console.log("API response length:", response.data.length);
            
            // Filter logs for selected date
            const dailyLogs = response.data.filter(log => {
              // Use dates with UTC offset removed for consistent comparison 
              // Parse the date string from created_at
              const createdAtDate = new Date(log.created_at);
              
              // Get date as string in format "YYYY-MM-DD"
              const createdAtDateString = log.created_at.split('T')[0];
              
              // Direct string comparison with selected date
              return createdAtDateString === selectedDate;
            });
            
            console.log("Selected date:", selectedDate);
            console.log("Filtered logs count:", dailyLogs.length);
            
            // Group logs by hour
            const hourlyData = Array(24).fill(0);
            dailyLogs.forEach(log => {
              const hour = new Date(log.created_at).getHours();
              hourlyData[hour] += log.energy_usage;
            });
            
            labels = Array.from({length: 24}, (_, i) => `${i}:00`);
            dataPoints = hourlyData;
            
            // Format date for display - direct string manipulation without timezone issues
            const parts = selectedDate.split('-');
            // Create date display in MM/DD/YYYY format directly from parts
            const displayDate = `${parts[1]}/${parts[2]}/${parts[0]}`;
            chartTitle = `Energy Usage on ${displayDate} (${roomName})`;
            break;
            
          case 'month':
            // Get all daily logs for this room
            const monthlyResponse = await api.get(`/roomlogsdaily/?room=${selectedEnergyRoom}`);
            console.log("Monthly response:", monthlyResponse.data.length);
            
            // Filter for selected month
            const [year, month] = selectedMonth.split('-');
            const monthlyLogs = monthlyResponse.data.filter(log => {
              const logDate = new Date(log.date);
              return logDate.getFullYear() === parseInt(year) && 
                     logDate.getMonth() === parseInt(month) - 1;
            });
            
            console.log("Filtered monthly logs:", monthlyLogs.length);
            
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
            // Get all monthly logs for this room
            const yearlyResponse = await api.get(`/roomlogsmonthly/?room=${selectedEnergyRoom}`);
            console.log("Yearly response:", yearlyResponse.data.length);
            
            // Filter for selected year
            const yearlyLogs = yearlyResponse.data.filter(log => 
              log.year === parseInt(selectedYear)
            );
            
            console.log("Filtered yearly logs:", yearlyLogs.length);
            
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
        
        console.log("Chart data points:", dataPoints);
        
        // Check if we have any data to display
        const isEmpty = dataPoints.every(val => val === 0 || val === null);
        if (isEmpty) {
          // Create empty chart with message
          const ctx = energyChartRef.current.getContext('2d');
          // Clear any previous chart
          const existingChart = Chart.getChart(energyChartRef.current);
          if (existingChart) {
            existingChart.destroy();
          }
          
          // Clear canvas
          ctx.clearRect(0, 0, energyChartRef.current.width, energyChartRef.current.height);
          
          // Show friendly message
          ctx.font = '16px Arial';
          ctx.fillStyle = '#666';
          ctx.textAlign = 'center';
          ctx.fillText(`No energy data available for this ${selectedPeriod}`, 
                      energyChartRef.current.width / 2, 
                      energyChartRef.current.height / 2);
          return; // Skip chart creation
        }
        
        // Create chart configuration
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
                position: 'bottom'
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
        
        // Create or update chart
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

  // Add these functions BEFORE the return statement, after all your useEffect hooks:

// Generate date ranges for selectors
const generateDateOptions = () => {
  // Generate last 7 days
  const options = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Create date strings in local timezone (not UTC)
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
  // Generate last 12 months
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

const generateYearOptions = () => {
  // Generate last 5 years
  const options = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    const year = currentYear - i;
    options.push({ value: year.toString(), label: year.toString() });
  }
  return options;
};

// Date options - define these here so they're available to the JSX
const dateOptions = generateDateOptions();
const monthOptions = generateMonthOptions();
const yearOptions = generateYearOptions();

  return (
    <div className="smart-home-page">
      <Sidebar />
      <div className="shp-information">
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
              <i class="fa-solid fa-bolt"></i>
              <span>Power Usage</span>
            </div>
            <div className="shp-statistics">
              <i class="fa-solid fa-droplet"></i>
              <span>Humidity</span>
            </div>
            <div className="shp-statistics">
              <i class="fa-solid fa-lightbulb"></i>
              <span>Light</span>
            </div>
          </div>

        </div>

        <div className="shp-rooms">
          <h1>Rooms</h1>
          <hr className="shp-rooms-divider" />

          {/* <div className="shp-rooms-list-container">
          <ul className="shp-rooms-list">
            {rooms.map((room) => (
              <li key={room.id}>
                <Link to={`/room/${room.name}/${smartHomeId}`}>{room.name}</Link>
              </li>
            ))}
            <li>
            <i class="fa-solid fa-couch"></i>
              <Link to={`/room/living-room/${smartHomeId}`} className="shp-rooms-list-links">Living Room</Link>
            </li>
            <li>
            <i class='fas fa-hamburger'></i>
              <Link to={`/room/kitchen/${smartHomeId}`} className="shp-rooms-list-links">Kitchen</Link>
            </li>
            <li>
            <i class="fa-solid fa-bed"></i>
              <Link to={`/room/bedroom/${smartHomeId}`} className="shp-rooms-list-links">Bedroom</Link>
            </li>
            <li>
            <i class="fa-solid fa-shower"></i>
              <Link to={`/room/bathroom/${smartHomeId}`} className="shp-rooms-list-links">Bathroom</Link>
            </li>
            <li>
            <i class="fa-solid fa-warehouse"></i>
              <Link to={`/room/garage/${smartHomeId}`} className="shp-rooms-list-links">Garage</Link>
            </li>
            <li>
            <i class="fa-solid fa-tree"></i>
              <Link to={`/room/backyard/${smartHomeId}`} className="shp-rooms-list-links">Backyard</Link>
            </li>
          </ul>
          </div> */}

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
                        setRoomToDelete(room.id); // Set the room ID to be deleted
                        setIsDeleteModalOpen(true); // Open the delete confirmation modal
                      }}
                    >
                      <i className="fa-solid fa-trash delete-icon"></i>
                    </button>
                  </div>
                ))
              )}
            </ul>
          </div>

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
                      handleDeleteRoom(roomToDelete); // Handle room deletion
                      setIsDeleteModalOpen(false); // Close the modal
                    }}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => {
                      setIsDeleteModalOpen(false); // Close the modal without deleting
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

        {/* Modal */}
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

        {/* Energy Information */}
        <div className="energy-info">
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
          </div>

          <div className="chart-container">
            <canvas ref={energyChartRef}></canvas>
            {unlockedRooms.length === 0 && (
              <div className="no-data-message">
                <p>No unlocked rooms available. Please unlock rooms to view energy data.</p>
              </div>
            )}
          </div>
        </div>

      </div>
      {/*
        // Back/Notifications
        <div className="card-container">
          <div className="back-button">
            <button onClick={() => window.history.back()}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
          </div>
          <div className="welcome-message">
            <span>Welcome Home, User</span>
          </div>
          <div className="notification-button">
            <button>  
              <i className="fas fa-bell"></i>
            </button>
          </div>
        </div>

        <h2>Energy Usage/Generation</h2>
        <div className="room-container">
          <h5 style={{ color: 'black' }}>Stacked Bar Chart</h5>
        </div>

        <h2 style={{ textAlign: 'left' }}>Manage Rooms</h2>
        <div className="room-container">
          <div className="room">
            <div className="room-buttons">
              {rooms.map((room) => (
                <div key={room.id} className="room-button">
                  <div className="icon-text">
                    <i className="fas fa-bed"></i> 
                    <span>{room.name}</span>
                  </div>
                  <span>{room.daily_usage} kWh so far today</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3>Add Device to Room</h3>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
          >
            <option value="">Select Room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>

          <input
            placeholder="Device Name"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
          />

          <select
            value={selectedSupportedDevice}
            onChange={(e) => setSelectedSupportedDevice(e.target.value)}
          >
            <option value="">Select Supported Device</option>
            {supportedDevices.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.model_name}
              </option>
            ))}
          </select>

          <button onClick={handleAddDevice}>Add Device</button>
        </div>
      */}
    </div>
  );
}

export default SmartHomePage;