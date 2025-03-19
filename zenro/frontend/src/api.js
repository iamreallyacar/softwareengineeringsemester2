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

// Add handling for 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("accessToken");
      window.location = "/login";
    }
    return Promise.reject(error);
  }
);

export const getSmartHomes = () => api.get('/smarthomes/');
export const getRooms = (smartHomeId) => api.get(`/rooms/?smart_home=${smartHomeId}`);
export const controlDevice = (deviceId, data) => api.post(`/devices/${deviceId}/control/`, data);

export const getAvailableDates = (roomId) => api.get(`/available_dates/?room=${roomId}`);
export const getAvailableMonths = (roomId) => api.get(`/available_months/?room=${roomId}`);
export const getAvailableYears = (roomId) => api.get(`/available_years/?room=${roomId}`);

export default api;