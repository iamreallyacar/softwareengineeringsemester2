import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api"; // Assuming you have an API utility similar to the one in SmartHomePage

function AddDevicesPage() {
  const { id: smartHomeId } = useParams(); // The current smart home’s ID
  const [rooms, setRooms] = useState([]);
  const [supportedDevices, setSupportedDevices] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedSupportedDevice, setSelectedSupportedDevice] = useState("");
  const [deviceName, setDeviceName] = useState("");

  useEffect(() => {
    // Fetch rooms for this smart home
    api.get(`/rooms/?smart_home=${smartHomeId}`)
      .then((res) => setRooms(res.data))
      .catch((error) => console.error("Error fetching rooms:", error));

    // Fetch supported devices
    api.get("/supporteddevices/")
      .then((res) => setSupportedDevices(res.data))
      .catch((error) => console.error("Error fetching supported devices:", error));
  }, [smartHomeId]);

  const handleAddDevice = async () => {
    if (!selectedRoomId || !selectedSupportedDevice || !deviceName) {
      alert("Please select a room, a device, and enter a name.");
      return;
    }

    const payload = {
      room: selectedRoomId, // ID of the selected room
      supported_device: selectedSupportedDevice, // ID of the selected supported device
      name: deviceName, // Custom name of the device
    };

    try {
      const response = await api.post("/devices/", payload);
      console.log("Device added successfully:", response.data);
      alert("Device added successfully!");
      setDeviceName("");
      setSelectedSupportedDevice("");
    } catch (error) {
      console.error("Failed to add device:", error.response?.data || error.message);
      alert("Failed to add device. Please try again.");
    }
  };

  return (
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
  );
}

export default AddDevicesPage;
