import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import axios from "axios";
import { useAuth } from "./AuthContext"; // Assuming you have an AuthContext to get the logged-in user
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // Adjust this if needed
const UserAssetsContext = createContext();

export const UserAssetsProvider = ({ children }) => {
  const [userAssets, setUserAssets] = useState(0);
  const prevAssetsRef = useRef(userAssets);
  const { user } = useAuth(); // Get the logged-in user

  // Function to manually refresh user assets when needed
  const refreshAssets = useCallback(async () => {
    if (!user || !user.email) return;

    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/users/email/${user.email}`
      );
      const fetchedAssets = response.data.assets;
      if (fetchedAssets !== prevAssetsRef.current) {
        prevAssetsRef.current = fetchedAssets;
        setUserAssets(fetchedAssets);
      }
    } catch (err) {
      console.error("Error refreshing user assets:", err);
    }
  }, [user, prevAssetsRef, setUserAssets]);

  useEffect(() => {
    // Initial fetch when component mounts or user changes - refreshAssets already checks for user
    refreshAssets();
  }, [refreshAssets]); // refreshAssets depends on user, so this will run when user changes

  return (
    <UserAssetsContext.Provider
      value={{ userAssets, setUserAssets, refreshAssets }}
    >
      {children}
    </UserAssetsContext.Provider>
  );
};

export const useUserAssets = () => useContext(UserAssetsContext);
