import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext"; // Assuming you have an AuthContext to get the logged-in user

const UserAssetsContext = createContext();

export const UserAssetsProvider = ({ children }) => {
  const [userAssets, setUserAssets] = useState(0);
  const { user } = useAuth(); // Get the logged-in user

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        if (user && user.email) {
          const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/users/email/${user.email}`
          );
          const fetchedAssets = response.data.assets;
          if (fetchedAssets !== userAssets) {
            setUserAssets(fetchedAssets); // Update only if assets have changed
          }
        }
      } catch (err) {
        console.error("Error fetching user assets:", err);
      }
    };

    fetchAssets();

    const interval = setInterval(fetchAssets, 1000); // Poll every 5 seconds
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [user, userAssets]); // Include userAssets in dependency array

  return (
    <UserAssetsContext.Provider value={{ userAssets, setUserAssets }}>
      {children}
    </UserAssetsContext.Provider>
  );
};

export const useUserAssets = () => useContext(UserAssetsContext);
