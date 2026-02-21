import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("smarthealth_auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { token?: string };
        if (parsed.token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      } catch {
      }
    }
  }
  return config;
});

export default api;

