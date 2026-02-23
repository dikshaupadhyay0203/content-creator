import axiosInstance from "./axiosInstance";

/* =========================
   CREATE ASSET
========================= */

export const createAsset = async (formData) => {
  const res = await axiosInstance.post("/assets", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return res.data;
};

/* =========================
   GET ASSETS
========================= */

export const getPublicAssets = async (params) => {
  const res = await axiosInstance.get("/assets", { params });
  return res.data;
};

export const getMyAssets = async (params) => {
  const res = await axiosInstance.get("/assets/my", { params });
  return res.data;
};
