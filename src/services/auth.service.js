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

/**
 * POST /smartOffice/resendNetworkClusterAdminInvite
 * Body: { userCode } — emails the invite again to someone who hasn't joined yet
 */
export const resendNetworkClusterAdminInvite = ({ userCode }) =>
  api.post("/smartOffice/resendNetworkClusterAdminInvite", { userCode });

/**
 * DELETE /smartOffice/removeNetworkClusterAdmin
 * Body: { userCode } — removes the user from the network (used to cancel a pending invite)
 */
export const removeNetworkClusterAdmin = ({ userCode }) =>
  api.delete("/smartOffice/removeNetworkClusterAdmin", { data: { userCode } });

/**
 * PATCH /smartOffice/updateNetworkClusterAdminDpURL  (multipart)
 * Form: image (file), userCode (optional)
 * With userCode it changes that admin's profile picture; without it, the logged-in admin's own.
 */
export const updateNetworkClusterAdminDpURL = ({ userCode, image }) => {
  const fd = new FormData();
  if (userCode) fd.append("userCode", userCode);
  fd.append("image", image);
  return api.patch("/smartOffice/updateNetworkClusterAdminDpURL", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    skipAuthRedirect: true, // a rejected image shows an error, not a logout (see axios.js)
  });
};

/**
 * PATCH /smartOffice/updateNetworkClusterAdminDpURL  (multipart)
 * Form: removeImage=true — removes the logged-in admin's profile picture
 */
export const removeNetworkClusterAdminDp = () => {
  const fd = new FormData();
  fd.append("removeImage", "true");
  return api.patch("/smartOffice/updateNetworkClusterAdminDpURL", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    skipAuthRedirect: true,
  });
};

export const getAllNetworkClusterAdminDetails =({ networkClusterCode, role }) =>
  api.get("/smartOffice/getAllNetworkClusterAdminDetails", {
    params: { networkClusterCode, ...(role && { role }) },
  });
