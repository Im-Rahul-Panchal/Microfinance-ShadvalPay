import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: "/api",
});

// Attach JWT token to all requests
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("jwtToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Auto handling session expired (Node returns status 440)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 440) {
      sessionStorage.removeItem("jwtToken");
      window.location.href = "/"; // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
