import axios from "axios";
import { errorToast } from "../utils/toast";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true
});

/*
   RESPONSE INTERCEPTOR
 */

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global 401 here
    if (error.response?.status === 401) {
      errorToast("Unauthorized request - Please login again");
      console.log("Unauthorized request");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
