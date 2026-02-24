import axiosInstance from "./axiosInstance";

export const getPlans = async () => {
    const res = await axiosInstance.get("/plans");
    return res.data;
};

export const createOrder = async (planId) => {
    const res = await axiosInstance.post("/plans/create-order", { planId });
    return res.data;
};

export const verifyPayment = async (payload) => {
    const res = await axiosInstance.post("/plans/verify-payment", payload);
    return res.data;
};
