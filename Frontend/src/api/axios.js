import axios from "axios";

const rawApiUrl = (import.meta.env.VITE_API_URL || "/api").trim().replace(/\/$/, "");
const apiBaseUrl =
  rawApiUrl.startsWith("http") && !rawApiUrl.endsWith("/api")
    ? `${rawApiUrl}/api`
    : rawApiUrl;

const api = axios.create({ baseURL: apiBaseUrl });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
