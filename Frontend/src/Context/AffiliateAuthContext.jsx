import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const AffiliateAuthContext = createContext();

export const AffiliateAuthProvider = ({ children }) => {
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  };

  const [affiliate, setAffiliate] = useState(() => {
    const token = localStorage.getItem("affiliate_token");
    if (token && !isTokenExpired(token)) {
      try {
        const decoded = jwtDecode(token);
        return { id: decoded.id, email: decoded.email }; // Adjust if your token contains other info
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  const fetchAffiliate = async (token) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/affiliate/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAffiliate(res.data.affiliate || res.data);
      console.log("Affiliate fetched successfully:", res.data.affiliate);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("affiliate_token");
    if (token && !isTokenExpired(token)) {
      fetchAffiliate(token);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async ({ email, password }) => {
    const res = await axios.post(`${BACKEND_URL}/api/affiliate/login`, {
      email,
      password,
    });
    localStorage.setItem("affiliate_token", res.data.token);
    setAffiliate(res.data.affiliate || res.data); // Adjust based on structure
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("affiliate_token");
    setAffiliate(null);
  };

  return (
    <AffiliateAuthContext.Provider
      value={{ affiliate, login, logout, loading }}
    >
      {children}
    </AffiliateAuthContext.Provider>
  );
};

export const useAffiliateAuth = () => useContext(AffiliateAuthContext);
