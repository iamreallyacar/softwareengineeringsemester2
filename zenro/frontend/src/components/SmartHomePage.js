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
			<h1>Overall Smart Home Details Here</h1>
			{/* Overall Energy Generation */}
			{/* Overall Energy Usage */}
			<h1>Smart Home Devices Here</h1>
			{/* Display a list of devices */}
			{/* Display statuses of each devices */}
			{/* Each device should have an edit and delete button */}
		</div>
	)
}