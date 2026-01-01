import api from "./axios";

export const sendOtp = (payload) =>
  api.post("/smartOfficeLogginSendOtp", payload);

export const verifyOtp = (payload) =>
  api.post("/smartOfficeLogginVerifyOtp", payload);

export const logout = () => api.post("/auth/logout");
