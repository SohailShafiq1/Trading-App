import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const UserAssetsContext = createContext();

export const UserAssetsProvider = ({ children }) => {
  const [userAssets, setUserAssets] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/email/${user.email}`
        );
        setUserAssets(response.data.assets);
      } catch (err) {
        console.error("Error fetching user assets:", err);
      }
    };

    if (user) fetchAssets();
  }, [user]);

  return (
    <UserAssetsContext.Provider value={{ userAssets, setUserAssets }}>
      {children}
    </UserAssetsContext.Provider>
  );
};

export const useUserAssets = () => useContext(UserAssetsContext);