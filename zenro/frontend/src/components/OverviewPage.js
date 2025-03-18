/* This is the home page for our smart home system. */

import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import NavigationBar from "./NavigationBar.js";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";

import airCond from "../assets/images/aircond.png";

function SmartHomePage() {
  const { id: smartHomeId } = useParams();
  const [lockedRooms, setLockedRooms] = useState([]);
  const [unlockedRooms, setUnlockedRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  // Dropdown states
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenLR, setIsOpenLR] = useState(false);

  // Room selection
  const allRooms = ["Living Room", "Kitchen", "Bedroom", "Bathroom", "Garage", "Backyard"];
  const [selectedRoomCCTV, setSelectedRoomCCTV] = useState("Living Room");
  const [selectedRoom, setSelectedRoom] = useState("Living Room");
    const [supportedDevices, setSupportedDevices] = useState([]);
    const [selectedSupportedDevice, setSelectedSupportedDevice] = useState("");

  // Appliances state
  const [isOn, setIsOn] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [homeIORooms, setHomeIORooms] = useState([]);
  const [selectedHomeIORoom, setSelectedHomeIORoom] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  // Handle room selection in dropdowns
  const handleRoomSelectCCTV = (room) => {
    setSelectedRoomCCTV(room);
    setIsOpen(false);
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setIsOpenLR(false);
  };

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        // Fetch unlocked rooms for the given smart home
        const unlockedResponse = await api.get(`/rooms/?smart_home=${smartHomeId}`);
        const unlocked = unlockedResponse.data;
        setUnlockedRooms(unlocked);
        console.log("API - Unlocked Rooms:", unlocked);
  
        // Fetch all available rooms
        const allRoomsResponse = await api.get("/homeio-rooms/");
        const allRoomsData = allRoomsResponse.data;
        console.log("API - All Rooms:", allRoomsData);
  
        // Separate unlocked and locked rooms
        const unlockedRoomIds = new Set(unlocked.map((room) => room.home_io_room_id));
        const lockedRoomsData = allRoomsData.filter((room) => !unlockedRoomIds.has(room.id));
        setLockedRooms(lockedRoomsData);
  
        console.log("Filtered Locked Rooms:", lockedRoomsData);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };
  
    const fetchSupportedDevices = async () => {
      try {
        const response = await api.get("/supporteddevices/");
        setSupportedDevices(response.data);
        console.log("API - Supported Devices:", response.data);
      } catch (error) {
        console.error("Error fetching supported devices:", error);
      }
    };
  
    fetchRooms();
    fetchSupportedDevices();
  }, [smartHomeId]);
  
  
  

  const handleAddRoom = async () => {
    if (!selectedHomeIORoom) {
      alert("Please select a room.");
      return;
    }

    try {
      const payload = {
        smart_home_id: smartHomeId,
        home_io_room_id: selectedHomeIORoom,
      };

      await api.post(`/unlock-room/`, payload);
      setUnlockedRooms((prev) => [...prev, homeIORooms.find((room) => room.id === selectedHomeIORoom)]);
      setLockedRooms((prev) => prev.filter((room) => room.id !== selectedHomeIORoom));

      setSelectedHomeIORoom(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to add room:", error.response?.data || error.message);
      alert("Failed to add room. Please try again.");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      await api.delete(`/rooms/${roomId}/`);
      setUnlockedRooms((prevRooms) => prevRooms.filter((room) => room.id !== roomId));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete room:", error.response?.data || error.message);
      alert("Failed to delete room. Please try again.");
    }

  };

  return (
    <div className="smart-home-page">
      <NavigationBar />

      <div className="shp-information">
        {/* CCTV Container */}
        <div className="shp-CCTV">
          <button onClick={() => setIsOpen(!isOpen)}>
            {selectedRoomCCTV} {isOpen ? "▲" : "▼"}
          </button>
          <AnimatePresence>
            {isOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <ul className="shp-cctv-room-list">
                  {allRooms.map((room, index) => (
                    <motion.li key={room} onClick={() => handleRoomSelectCCTV(room)}>{room}</motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
          <h1>CCTV</h1>
        </div>

        {/* Unlocked Rooms */}
        <div className="shp-rooms">
          <h1>Rooms</h1>
          <ul>
            {unlockedRooms.map((room) => (
              <li key={room.id}>
                <Link to={`/room/${room.id}/${smartHomeId}`} className="shp-rooms-list-links">{room.name}</Link>
              </li>
            ))}
          </ul>

          {/* Add Room Button */}
          <button className="shp-add-room-button" onClick={() => setIsModalOpen(true)}>+ Add Room</button>
        </div>

        {/* Add Room Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Add New Room</h2>
              <select value={selectedHomeIORoom} onChange={(e) => setSelectedHomeIORoom(e.target.value)}>
                <option value="">Select a Room</option>
                {homeIORooms.map((room) => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
              <button onClick={handleAddRoom}>Add Room</button>
              <button onClick={() => setIsModalOpen(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Appliances */}
        <div className="shp-appliances">
          <h3>{selectedRoom}</h3>
          <button onClick={() => setIsOn(!isOn)}>{isOn ? "ON" : "OFF"}</button>
          <img src={airCond} alt="Air Conditioner" />
        </div>
      </div>
    </div>
  );
}

export default SmartHomePage;
