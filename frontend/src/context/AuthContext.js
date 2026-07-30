import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useEffect, useState } from "react";
import apiClient from "../api/client";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if token exists in local storage on app initial load
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("userToken");
        const storedUserData = await AsyncStorage.getItem("userData");

        if (storedToken) {
          setUserToken(storedToken);
        }
        if (storedUserData) {
          setUserData(JSON.parse(storedUserData));
        }
      } catch (e) {
        console.error("Failed to load storage authentication:", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      const { token, userId, email: userEmail, fullName } = response.data;

      const userObj = { userId, email: userEmail, fullName };

      // Save to state
      setUserToken(token);
      setUserData(userObj);

      // Save to local storage
      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("userData", JSON.stringify(userObj));

      return { success: true };
    } catch (error) {
      console.error("Login error:", error?.response?.data || error.message);
      return {
        success: false,
        message: error?.response?.data?.message || "Invalid email or password.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    setIsLoading(true);
    try {
      setUserToken(null);
      setUserData(null);
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        userToken,
        userData,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
