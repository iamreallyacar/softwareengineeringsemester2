import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";

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

  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [newRoomName, setNewRoomName] = useState(""); // State for the new room name
  const [homeIORooms, setHomeIORooms] = useState([]);

  const handleRoomSelectCCTV = (room) => {
    setSelectedRoomCCTV(room);
    setIsOpen(false);
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setIsOpenLR(false);
  };
  
  const handleAddRoom = async () => {
    if (!newRoomName) return;
    await api.post(`/rooms/`, {
      name: newRoomName,
      smart_home: smartHomeId,
    });
    setNewRoomName(""); // Clear the input field
    setIsModalOpen(false); // Close the modal after adding the room
    // Refresh the room list
    api.get(`/rooms/?smart_home=${smartHomeId}`).then((res) => {
      setRooms(res.data);
    });
  };

  useEffect(() => {
    // Fetch rooms for this smart home
    api.get(`/rooms/?smart_home=${smartHomeId}`).then((res) => {
      setRooms(res.data);
    });
    // Fetch supported devices
    api.get("/supporteddevices/").then((res) => {
      setSupportedDevices(res.data);
    });
    // Fetch homeio-rooms
    api.get("/homeio-rooms/").then((res) => {
      setHomeIORooms(res.data); // Store the fetched homeio-rooms data
    }).catch((error) => {
      console.error("Error fetching homeio-rooms:", error);
    });
  }, [smartHomeId]);

  const handleAddDevice = async () => {
    if (!selectedRoomId || !selectedSupportedDevice || !deviceName) return;
    await api.post(`/rooms/${selectedRoomId}/add_device/`, {
      name: deviceName,
      supported_device_id: selectedSupportedDevice,
    });
    setDeviceName("");
  };

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
            <p className="shp-statistics">Temperature</p>
            <p className="shp-statistics">Power Usage</p>
            <p className="shp-statistics">Humidity</p>
            <p className="shp-statistics">Light</p>
          </div>

        </div>

        <div className="shp-rooms">
          <h1>Rooms</h1>
          <hr className="shp-rooms-divider"/>

          <div className="shp-rooms-list-container">
          <ul className="shp-rooms-list">
            {rooms.map((room) => (
              <li key={room.id}>
                <Link to={`/room/${room.name}/${smartHomeId}`}>{room.name}</Link>
              </li>
            ))}
            {/* The following fixed links should also use the dynamic smartHomeId */}
            <li>
              <Link to={`/room/living-room/${smartHomeId}`} className="shp-rooms-list-links">Living Room</Link>
            </li>
            <li>
              <Link to={`/room/kitchen/${smartHomeId}`} className="shp-rooms-list-links">Kitchen</Link>
            </li>
            <li>
              <Link to={`/room/bedroom/${smartHomeId}`} className="shp-rooms-list-links">Bedroom</Link>
            </li>
            <li>
              <Link to={`/room/bathroom/${smartHomeId}`} className="shp-rooms-list-links">Bathroom</Link>
            </li>
            <li>
              <Link to={`/room/garage/${smartHomeId}`} className="shp-rooms-list-links">Garage</Link>
            </li>
            <li>
              <Link to={`/room/backyard/${smartHomeId}`} className="shp-rooms-list-links">Backyard</Link>
            </li>
          </ul>
          </div>

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
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="room-dropdown"
              >
                <option value="">Select a Room</option>
                {homeIORooms.map((room) => (
                  <option key={room.id} value={room.name}>
                    {room.name}
                  </option>
                ))}
              </select>
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
                {selectedRoom} {isOpenLR ? "▲" : "▼" }
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
                className={isOn ? "shp-appliances-button-on":"shp-appliances-button-off"}
              >
              <span className="status-dot"></span>
              {isOn ? "ON" : "OFF"}
              </button>
            </div>
            
            <div className="shp-appliances-img-container">
              <img className="shp-appliances-img" src={airCond} alt="Air Conditioner"/>
            </div>

            <div className="shp-appliances-statistics">
              <p className="shp-statistics">Total Uptime</p>
              <p className="shp-statistics">Fan Speed</p>
              <p className="shp-statistics">Temperature</p>
            </div>  
        </div>

        {/* Most Used Container */}
        <div className="shp-most-used">
          <div className="shp-most-used-title">
            <h3> {selectedRoom} </h3>
          </div>

          <h4>Most Used Appliances</h4>

          <div style={{ width: "100%", height: "200%" }}>
            <ul className="shp-most-used-list">
              <li className="shp-most-used-appliances">Smart Air Conditioner</li>
              <li className="shp-most-used-appliances">Smart Lights</li>
              <li className="shp-most-used-appliances">Smart TV</li>
              <li className="shp-most-used-appliances">Smart Fridge</li>
              <li className="shp-most-used-appliances">Smart Oven</li>
              <li className="shp-most-used-appliances">Smart Washing Machine</li>
            </ul>
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