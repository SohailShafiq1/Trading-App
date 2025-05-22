import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
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
        return { id: decoded.id, email: decoded.email };
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("affiliate_token");
    setAffiliate(null);
  }, []);

  const fetchAffiliate = useCallback(
    async (token) => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/affiliate/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAffiliate(res.data.affiliate || res.data);
        console.log("Affiliate fetched successfully:", res.data.affiliate);
      } catch (err) {
        console.error("Error fetching affiliate:", err);
        logout();
      } finally {
        setLoading(false);
      }
    },
    [logout]
  );

  useEffect(() => {
    const token = localStorage.getItem("affiliate_token");
    if (token && !isTokenExpired(token)) {
      fetchAffiliate(token);
    } else {
      setLoading(false);
    }
  }, [fetchAffiliate]);

  const login = async ({ email, password }) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/affiliate/login`, {
        email,
        password,
      });

      const token = res.data.token;

      if (token) {
        localStorage.setItem("affiliate_token", token);
        await fetchAffiliate(token); // Refetch full affiliate details
      } else {
        console.error("No token in response:", res.data);
      }

      console.log("Login successful:", res.data);
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
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
