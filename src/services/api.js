import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

// Add the saved sign-in token to each protected API request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("eventrix-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Read the API's friendly message before showing a network error.
export function getErrorMessage(error) {
  return error.response?.data?.message || "Could not reach Eventrix. Check your connection and try again.";
}

export default api;
