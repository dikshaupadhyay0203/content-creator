import axiosInstance from "./axiosInstance";

export const signupUser = async (data) => {
  const res = await axiosInstance.post("/auth/signup", data);
  return res.data;
};

export const loginUser = async (data) => {
  const res = await axiosInstance.post("/auth/login", data);
  return res.data;
};

export const getCurrentUser = async () => {
  const res = await axiosInstance.get("/auth/me");
  return res.data;
};

export const logoutUser = async () => {
  await axiosInstance.post("/auth/logout");
}

export const sendOtp = async (data) => {
  const res = await axiosInstance.post("/auth/send-otp", data);
  return res.data;
};

export const verifyOtp = async (data) => {
  const res = await axiosInstance.post("/auth/verify-otp", data);
  return res.data;
};

