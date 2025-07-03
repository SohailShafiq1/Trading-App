import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
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

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const fetchUser = useCallback(
    async (token) => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(res.data.user);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    },
    [] // Empty dependency array since setUser and setLoading are stable
  );

  useEffect(() => {
    const checkAndFetchUser = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp > Date.now() / 1000) {
            fetchUser(token);
            return;
          }
        } catch {
          // Invalid token
        }
      }
      // No token, expired token, or invalid token
      setLoading(false);
    };

    checkAndFetchUser();
  }, [fetchUser]);

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

  const googleLogin = async (
    token,
    isRegistration = false,
    additionalData = {}
  ) => {
    const payload = {
      token,
      isRegistration,
      ...additionalData,
    };

    const res = await axios.post(
      `${BACKEND_URL}/api/auth/google-login`,
      payload
    );
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const resetPassword = async (email) => {
    await axios.post(`${BACKEND_URL}/api/auth/reset-password`, { email });
  };

  const updateUserTipStatus = async (tipText) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${BACKEND_URL}/api/users/tip-status`,
        { tipText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUser(res.data.user);
    } catch (error) {
      console.error("Failed to update tip status:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        register,
        login,
        googleLogin,
        logout,
        loading,
        resetPassword,
        updateUserTipStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
