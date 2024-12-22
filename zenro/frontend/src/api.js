// filepath: /home/zenro/frontend/src/api.js
import axios from "axios";

// The axios instance includes a base URL for backend API calls
const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/", // Backend URL
});

// Request interceptor adds the bearer token for authentication
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor logs errors for debugging
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error:", error.response);
        return Promise.reject(error);
    }
);

export default api;