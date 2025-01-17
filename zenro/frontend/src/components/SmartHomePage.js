import React, { useState } from "react";
import api from "../api";

/**
 * 1. We need a backend database to store the user's smart home devices.
 * 
 * 
 */

function SmartHomePage() {
	/*
	 * The SmartHomePage component will display the user's smart home devices.
	 * The user can add, delete, and update devices.
	 * The component will fetch the user's devices from the backend.
	 * The component will also have a form to add a new device.
	 */

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

		</div>
	)
}

export default SmartHomePage;