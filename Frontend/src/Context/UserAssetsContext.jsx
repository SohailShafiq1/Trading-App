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
            `http://localhost:5000/api/users/email/${user.email}`
          );
          setUserAssets(response.data.assets); // Set the fetched assets
        }
      } catch (err) {
        console.error("Error fetching user assets:", err);
      }
    };

    fetchAssets();
  }, [user]); // Fetch assets whenever the user changes

  return (
    <UserAssetsContext.Provider value={{ userAssets, setUserAssets }}>
      {children}
    </UserAssetsContext.Provider>
  );
};

export const useUserAssets = () => useContext(UserAssetsContext);