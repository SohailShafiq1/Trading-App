import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const AffiliateAuthContext = createContext();

export const AffiliateAuthProvider = ({ children }) => {
  const [affiliate, setAffiliate] = useState(null);
  const [loading, setLoading] = useState(true);

  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  };

  const fetchAffiliate = async (token) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/affiliate/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAffiliate(res.data.affiliate);
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
      logout();
      setLoading(false);
    }
  }, []);

  const login = async ({ email, password }) => {
    const res = await axios.post(`${BACKEND_URL}/api/affiliate/login`, {
      email,
      password,
    });
    localStorage.setItem("affiliate_token", res.data.token);
    setAffiliate(res.data.affiliate);
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
