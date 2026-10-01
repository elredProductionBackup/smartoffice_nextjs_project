import api from "./axios";

export const sendOtp = (payload) =>
  api.post("/smartOfficeLogginSendOtp", payload);

export const verifyOtp = (payload) =>
  api.post("/smartOfficeLogginVerifyOtp", payload);

export const logout = () => api.post("/auth/logout");

/**
 * GET /smartOffice/getNetworkClusterAdminDetail
 * Query params: networkClusterCode, email
 * result: { userCode, firstname, lastname, phone, email, companyName,
 *           title: [{ _id, value }], dpURL, role: ["financeManager", ...] }
 */
export const getNetworkClusterAdminDetail = ({ networkClusterCode, email }) =>
  api.get("/smartOffice/getNetworkClusterAdminDetail", {
    params: { networkClusterCode, email },
  });
