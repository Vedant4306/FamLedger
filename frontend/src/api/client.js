import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// ⚠️ REPLACE WITH YOUR COMPUTER'S LOCAL WI-FI IP ADDRESS
// (e.g. 'http://192.168.1.100:8080/api')
// Note: Do NOT use localhost on physical devices via Expo Go!
const BASE_URL = "http://192.168.29.116:8080/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: Automatically attach Bearer JWT Token to all requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error fetching token from storage:", error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default apiClient;
