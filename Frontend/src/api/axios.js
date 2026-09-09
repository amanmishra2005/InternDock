import axios from "axios";

const rawApiUrl = (import.meta.env.VITE_API_URL || "/api").trim().replace(/\/$/, "");
const hostApiUrl =
  typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app")
    ? "https://interndock.in/api"
    : rawApiUrl;
const apiBaseUrl =
  hostApiUrl.startsWith("http") && !hostApiUrl.endsWith("/api")
    ? `${hostApiUrl}/api`
    : hostApiUrl;

const api = axios.create({ baseURL: apiBaseUrl });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
