import api from "./axios";

/**
 * Approve or reject an approval request
 *
 * PATCH /smartOffice/updateApprovalStatus
 * Body: { approvalId: string, status: "approved" | "rejected", rejectReason?: string }
 *
 * @param {Object} payload
 * @param {string} payload.approvalId - Approval request ID
 * @param {"approved"|"rejected"} payload.status
 * @param {string} [payload.rejectReason] - Required when rejecting
 * @returns {Promise<Object>}
 */
export const updateApprovalStatus = async (payload) => {
  try {
    const res = await api.patch("/smartOffice/updateApprovalStatus", payload);

    const data = res.data;

    // Axios validateStatus allows all status codes — check success flag manually
    if (data?.success === false) {
      const err = new Error(data?.message || "Failed to update approval status");
      err.response = {
        status: res.status,
        data,
      };
      throw err;
    }

    return data;
  } catch (error) {
    console.error("updateApprovalStatus API Error:", error?.response || error);
    throw error;
  }
};

/**
 * List approval requests for the network
 *
 * GET /smartOffice/getApprovals?status=pending&start=0&offset=10
 * status: "pending" | "approved" | "rejected" (omit for all)
 * start is 0-based (records to skip), offset is the page size
 *
 * @param {Object} params
 * @param {string} [params.status]
 * @param {number} [params.start=0]
 * @param {number} [params.offset=10]
 * @returns {Promise<Object>} raw response body ({ success, result: [...], ...totals })
 */
export const getApprovals = async ({ status, start = 0, offset = 10 } = {}) => {
  try {
    const res = await api.get("/smartOffice/getApprovals", {
      params: { ...(status && { status }), start, offset },
    });

    const data = res.data;

    if (data?.success === false) {
      const err = new Error(data?.message || "Failed to fetch approvals");
      err.response = {
        status: res.status,
        data,
      };
      throw err;
    }

    return data;
  } catch (error) {
    console.error("getApprovals API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Full details of one approval request (bill, vendor, remark, reject reason…)
 *
 * GET /smartOffice/getApprovalDetails?approvalId=...
 *
 * @param {string} approvalId
 * @returns {Promise<Object>} raw response body ({ success, result })
 */
export const getApprovalDetails = async (approvalId) => {
  try {
    const res = await api.get("/smartOffice/getApprovalDetails", {
      params: { approvalId },
    });

    const data = res.data;

    if (data?.success === false) {
      const err = new Error(data?.message || "Failed to fetch approval details");
      err.response = {
        status: res.status,
        data,
      };
      throw err;
    }

    return data;
  } catch (error) {
    console.error("getApprovalDetails API Error:", error?.response || error);
    throw error;
  }
};
