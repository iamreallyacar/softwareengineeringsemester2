import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import api from "../api";

function SmartHomePage() {
  const { id: smartHomeId } = useParams(); // The current smart home’s ID
  const [rooms, setRooms] = useState([]);
  const [supportedDevices, setSupportedDevices] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedSupportedDevice, setSelectedSupportedDevice] = useState("");
  const [deviceName, setDeviceName] = useState("");

  useEffect(() => {
    // Fetch rooms for this smart home
    api.get(`/rooms/?smart_home=${smartHomeId}`).then((res) => {
      setRooms(res.data);
    });
    // Fetch supported devices
    api.get("/supporteddevices/").then((res) => {
      setSupportedDevices(res.data);
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
      <div class="sidebar">
        <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">About</a></li>
            <li><a href="#">Services</a></li>
            <li><a href="#">Contact</a></li>
            <li><a href="/smart-homes">Back</a></li>
        </ul>
      </div>
     
      <div class="information">
        <div class="CCTV">
        </div>

        <div class="rooms">
          <h1>Rooms</h1>
          <hr className="rooms-divider"/>
          <ul>
            {rooms.map((room) => (
              <li key={room.id}>
                <Link to={`/room/${room.name}/${smartHomeId}`}>{room.name}</Link>
              </li>
            ))}
            {/* The following fixed links should also use the dynamic smartHomeId */}
            <li>
              <Link to={`/room/living-room/${smartHomeId}`}>Living Room</Link>
            </li>
            <li>
              <Link to={`/room/kitchen/${smartHomeId}`}>Kitchen</Link>
            </li>
            <li>
              <Link to={`/room/bedroom/${smartHomeId}`}>Bedroom</Link>
            </li>
            <li>
              <Link to={`/room/bathroom/${smartHomeId}`}>Bathroom</Link>
            </li>
            <li>
              <Link to={`/room/garage/${smartHomeId}`}>Garage</Link>
            </li>
            <li>
              <Link to={`/room/backyard/${smartHomeId}`}>Backyard</Link>
            </li>
          </ul>
        </div>

        <div class="living-room-block">
        </div>

        <div class="temp">
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