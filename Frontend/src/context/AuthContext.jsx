import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

function readCachedUser() {
  const token = localStorage.getItem("token");
  if (!token) {
    localStorage.removeItem("user");
    return null;
  }

  try {
    const cached = localStorage.getItem("user");
    return cached ? JSON.parse(cached) : null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readCachedUser);
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    const cached = readCachedUser();
    return !cached;
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then((res) => {
        const nextUser = res.data.user;
        setUser(nextUser);
        localStorage.setItem("user", JSON.stringify(nextUser));
      })
      .catch((err) => {
        const status = err.response?.status;
        // Only clear session if backend explicitly rejected the token (401 or 403).
        // Network glitches, 429 rate limit spikes, or temporary 503s must not log the user out.
        if (status === 401 || status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const persistUser = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("user");
    }
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    persistUser(res.data.user);
    return res.data.user;
  };

  const register = async (payload) => {
    const res = await api.post("/auth/register", payload);
    if (res.data.token && res.data.user) {
      localStorage.setItem("token", res.data.token);
      persistUser(res.data.user);
    }
    return res.data;
  };

  const verifyEmail = async (email, code) => {
    const res = await api.post("/auth/verify-email", { email, code });
    if (res.data.token && res.data.user) {
      localStorage.setItem("token", res.data.token);
      persistUser(res.data.user);
    }
    return res.data;
  };

  const resendVerification = async (email) => {
    const res = await api.post("/auth/resend-verification", { email });
    return res.data;
  };

  const forgotPassword = async (email) => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  };

  const resetPassword = async (payload) => {
    const res = await api.post("/auth/reset-password", payload);
    if (res.data.token && res.data.user) {
      localStorage.setItem("token", res.data.token);
      persistUser(res.data.user);
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: persistUser,
        loading,
        login,
        register,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
