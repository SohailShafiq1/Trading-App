import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const register = async (form) => {
    const { email, password, country, currency } = form;
    const res = await axios.post(`${BACKEND_URL}/api/auth/register`, {
      email,
      password,
      country,
      currency,
    });
    setUser(res.data.user);
  };

  const login = async ({ email, password }) => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email,
      password,
    });
    setUser(res.data.user);
    localStorage.setItem("token", res.data.token);
  };

  const googleLogin = async () => {
    window.location.href = `${import.meta.env.VITE_SERVER_URL}/api/auth/google`;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{ user, register, login, googleLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
