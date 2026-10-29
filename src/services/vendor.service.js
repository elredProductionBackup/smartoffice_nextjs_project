import api from "./axios";

/**
 * List vendors for the network cluster (newest first)
 *
 * GET /smartOffice/vendors?searchBy=name&searchKey=&start=0&offset=10
 * networkClusterCode is read from the JWT on the backend.
 *
 * @param {Object} [params]
 * @param {"name"|"location"} [params.searchBy] - Field to search on
 * @param {string} [params.searchKey]           - Search text (empty = all)
 * @param {number} [params.start]               - Number of vendors to skip
 * @param {number} [params.offset]              - Page size
 * @returns {Promise<{ result: Array, totalCount: number }>}
 */
export const getVendors = async ({ searchBy = "name", searchKey = "", start = 0, offset = 10 } = {}) => {
  try {
    const res = await api.get("/smartOffice/vendors", {
      params: { searchBy, searchKey, start, offset },
    });

    const data = res.data;

    // Axios validateStatus allows all status codes — check success flag manually
    if (data?.success === false) {
      const err = new Error(data?.message || "Failed to fetch vendors");
      err.response = {
        status: res.status,
        data,
      };
      throw err;
    }

    return {
      result: Array.isArray(data?.result) ? data.result : [],
      totalCount: data?.totalCount ?? 0,
    };
  } catch (error) {
    console.error("getVendors API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Create or update a vendor
 *
 * PATCH /smartOffice/addEditVendor
 * Body: { vendorId, name, location?, email?, phone? }
 * vendorId "" creates a new vendor; an id updates that vendor.
 * Names are unique per cluster ("Vendor with this name already exists").
 *
 * @param {Object} payload
 * @param {string} [payload.vendorId] - "" to create
 * @param {string} payload.name       - 2–100 chars
 * @param {string} [payload.location] - ≤ 100 chars
 * @param {string} [payload.email]
 * @param {string} [payload.phone]    - 7–15 digits, optional leading +
 * @returns {Promise<Object>} the saved vendor
 */
export const addEditVendor = async ({ vendorId = "", name, location, email, phone }) => {
  try {
    // On create, optional fields are only sent when filled in.
    // On update they're always sent so a cleared field ("") is removed.
    const body = { vendorId, name };
    const optional = { location, email, phone };
    Object.entries(optional).forEach(([key, value]) => {
      if (vendorId) body[key] = value ?? "";
      else if (value) body[key] = value;
    });

    const res = await api.patch("/smartOffice/addEditVendor", body);

    const data = res.data;

    // Axios validateStatus allows all status codes — check success flag manually
    if (data?.success === false) {
      const err = new Error(data?.message || "Failed to save vendor");
      err.response = {
        status: res.status,
        data,
      };
      throw err;
    }

    return Array.isArray(data?.result) ? data.result[0] : data?.result;
  } catch (error) {
    console.error("addEditVendor API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Delete a vendor (soft delete)
 *
 * DELETE /smartOffice/deleteVendor
 * Body: { vendorId }
 * Linked expenses, event-costing splits and approvals get vendorId: null.
 *
 * @param {string} vendorId
 * @returns {Promise<{ expensesCleared?: number, eventExpensesCleared?: number, approvalsCleared?: number }>}
 */
export const deleteVendor = async (vendorId) => {
  try {
    const res = await api.delete("/smartOffice/deleteVendor", {
      data: { vendorId },
      headers: { "Content-Type": "application/json" },
    });

    const data = res.data;

    // Axios validateStatus allows all status codes — check success flag manually
    if (data?.success === false) {
      const err = new Error(data?.message || "Failed to delete vendor");
      err.response = {
        status: res.status,
        data,
      };
      throw err;
    }

    return (Array.isArray(data?.result) ? data.result[0] : data?.result) || {};
  } catch (error) {
    console.error("deleteVendor API Error:", error?.response || error);
    throw error;
  }
};

/**
 * List notes kept against a vendor
 *
 * GET /smartOffice/vendorNotes?vendorId=&start=0&offset=10
 *
 * @param {Object} params
 * @param {string} params.vendorId - Vendor whose notes to fetch
 * @param {number} [params.start]  - Number of notes to skip
 * @param {number} [params.offset] - Page size
 * @returns {Promise<{ result: Array, totalCount: number }>}
 */
export const getVendorNotes = async ({ vendorId, start = 0, offset = 10 }) => {
  try {
    const res = await api.get("/smartOffice/vendorNotes", {
      params: { vendorId, start, offset },
    });

    const data = res.data;

    // Axios validateStatus allows all status codes — check success flag manually
    if (data?.success === false) {
      const err = new Error(data?.message || "Failed to fetch vendor notes");
      err.response = {
        status: res.status,
        data,
      };
      throw err;
    }

    return {
      result: Array.isArray(data?.result) ? data.result : [],
      totalCount: data?.totalCount ?? 0,
    };
  } catch (error) {
    console.error("getVendorNotes API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Add a note to a vendor
 *
 * POST /smartOffice/vendorNotes
 * Body: { vendorId, text }
 *
 * @param {Object} payload
 * @param {string} payload.vendorId
 * @param {string} payload.text
 * @returns {Promise<Object>} the saved note
 */
export const addVendorNote = async ({ vendorId, text }) => {
  try {
    const res = await api.post("/smartOffice/vendorNotes", { vendorId, text });

    const data = res.data;

    // Axios validateStatus allows all status codes — check success flag manually
    if (data?.success === false) {
      const err = new Error(data?.message || "Failed to add note");
      err.response = {
        status: res.status,
        data,
      };
      throw err;
    }

    return Array.isArray(data?.result) ? data.result[0] : data?.result;
  } catch (error) {
    console.error("addVendorNote API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Delete a vendor note
 *
 * DELETE /smartOffice/vendorNotes
 * Body: { noteId }
 *
 * @param {string} noteId
 * @returns {Promise<Object>}
 */
export const deleteVendorNote = async (noteId) => {
  try {
    const res = await api.delete("/smartOffice/vendorNotes", {
      data: { noteId },
      headers: { "Content-Type": "application/json" },
    });

    const data = res.data;

    // Axios validateStatus allows all status codes — check success flag manually
    if (data?.success === false) {
      const err = new Error(data?.message || "Failed to delete note");
      err.response = {
        status: res.status,
        data,
      };
      throw err;
    }

    return (Array.isArray(data?.result) ? data.result[0] : data?.result) || {};
  } catch (error) {
    console.error("deleteVendorNote API Error:", error?.response || error);
    throw error;
  }
};
