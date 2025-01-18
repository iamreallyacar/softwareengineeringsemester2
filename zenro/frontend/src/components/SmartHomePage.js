import React, { useState } from "react";
import api from "../api";

/**
 * 1. We need a backend database to store the user's smart home devices.
 * 
 * 
 */

function SmartHomePage() {
	const [roomId, setRoomId] = useState(null); // e.g. from URL or selection
	const [deviceName, setDeviceName] = useState("");
	const [supportedDeviceId, setSupportedDeviceId] = useState("");
	const [dailyUsage, setDailyUsage] = useState(null);

	const handleAddDevice = async () => {
		await api.post(`/rooms/${roomId}/add_device/`, {
			name: deviceName,
			supported_device_id: supportedDeviceId
		});
	};

	const fetchDailyUsage = async () => {
		const response = await api.get(`/rooms/${roomId}/daily_usage/`);
		setDailyUsage(response.data.usage);
	};

	return (
		<div className="smart-home-page">
			{/* Back Button */}
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
			{/* Overall Energy Generation */}
			{/* Overall Energy Usage */}

			<div className="room-container">
				<h5 style={{ color: 'black' }}>Stacked Bar Chart</h5>
			</div>

			<h2 style={{ textAlign: 'left' }}>Manage Rooms</h2>
			{/* Display a list of devices */}
			{/* Display statuses of each devices */}
			{/* Each device should have an edit and delete button */}

			<div className="room-container">
				<div className="room">
					<div className="room-buttons">
						<div className="room-button">
							<div className="icon-text">
								<i className="fas fa-bed"></i> {/* Example icon */}
								<span>Room 1 Description</span>
							</div>
							<span>More Info</span>
						</div>
						<div className="room-button">
							<div className="icon-text">
								<i className="fas fa-couch"></i> {/* Example icon */}
								<span>Room 2 Description</span>
							</div>
							<span>More Info</span>
						</div>
						<div className="room-button">
							<div className="icon-text">
								<i className="fas fa-tv"></i> {/* Example icon */}
								<span>Room 3 Description</span>
							</div>
							<span>More Info</span>
						</div>
					</div>
				</div>
			</div>

			<div>
				<h3>Add Device to Room</h3>
				<input
					placeholder="Device Name"
					value={deviceName}
					onChange={(e) => setDeviceName(e.target.value)}
				/>
				<input
					placeholder="SupportedDevice ID"
					value={supportedDeviceId}
					onChange={(e) => setSupportedDeviceId(e.target.value)}
				/>
				<button onClick={handleAddDevice}>Add Device</button>
			</div>

			<div>
				<h3>Room Daily Usage</h3>
				<button onClick={fetchDailyUsage}>Refresh Usage</button>
				{dailyUsage !== null && <p>Today's Usage: {dailyUsage} kWh</p>}
			</div>

		</div>
	)
}

export default SmartHomePage;