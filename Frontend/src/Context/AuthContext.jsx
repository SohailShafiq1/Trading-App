import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // Correct import for jwtDecode

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  };

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (token && !isTokenExpired(token)) {
      try {
        const decoded = jwtDecode(token);
        return { id: decoded.id, email: decoded.email }; // Adjust based on your token structure
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  const fetchUser = async (token) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(res.data.user);
      console.log("User fetched successfully:", res.data.user);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !isTokenExpired(token)) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const register = async (form) => {
    await axios.post(`${BACKEND_URL}/api/auth/register`, form);
  };

  const login = async ({ email, password }) => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email,
      password,
    });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  };

  const googleLogin = async (token) => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/google-login`, {
      token,
    });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, register, login, googleLogin, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
