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
 *           title: [{ _id, value }], dpURL, role: ["admin", "financeOfficer", "portfolioOfficer"] }
 */
export const getNetworkClusterAdminDetail = ({ networkClusterCode, email }) =>
  api.get("/smartOffice/getNetworkClusterAdminDetail", {
    params: { networkClusterCode, email },
  });

/**
 * GET /smartOffice/getAllNetworkClusterAdminDetails
 * Query params: networkClusterCode, role (optional: "admin" | "financeOfficer" | "portfolioOfficer")
 * Lists every admin-side user in the network, filtered to one role when `role` is passed. Needs the login token.
 */
/**
 * PATCH /smartOffice/addNetworkClusterAdmin
 * Body: { adminDetails: [{ fullName, email, phone, role: ["admin" | "financeOfficer" | "portfolioOfficer"], portfolioIds }] }
 * portfolioIds are budgetTypeIds from getBudgetType.
 */
export const addNetworkClusterAdmin = (adminDetails) =>
  api.patch("/smartOffice/addNetworkClusterAdmin", { adminDetails });

/**
 * PATCH /smartOffice/updateNetworkClusterAdminActivation
 * Body: { userCode, isActivate } — false deactivates the user, true turns them back on
 */
export const updateNetworkClusterAdminActivation = ({ userCode, isActivate }) =>
  api.patch("/smartOffice/updateNetworkClusterAdminActivation", { userCode, isActivate });

export const getAllNetworkClusterAdminDetails =({ networkClusterCode, role }) =>
  api.get("/smartOffice/getAllNetworkClusterAdminDetails", {
    params: { networkClusterCode, ...(role && { role }) },
  });
