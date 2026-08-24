import api from "@/services/axios";

/**
 * Fetch SmartNetwork Incomes with pagination
 *
 * GET /smartOffice/getIncome?start=1&offset=50
 *
 * @param {number} [start=1]   - Starting index (1-based)
 * @param {number} [offset=50] - Number of records to fetch
 * @returns {Promise<Object>}  - API response containing income list
 */
export const getIncome = async (start = 1, offset = 50) => {
  try {
    const res = await api.get("/smartOffice/getIncome", {
      params: { start, offset },
    });

    // axios is configured with validateStatus: status < 600, so a 404/500
    // resolves here instead of throwing — catch non-JSON/error responses
    // (e.g. Express's default "Cannot GET ..." HTML page) explicitly.
    if (res.status >= 400 || typeof res.data !== "object" || res.data === null) {
      const err = new Error(
        `getIncome failed with status ${res.status}: ${
          typeof res.data === "string" ? res.data : res.data?.message || "Unknown error"
        }`
      );
      err.response = { status: res.status, data: res.data };
      throw err;
    }

    return res.data;
  } catch (error) {
    console.error("getIncome API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Add a new SmartNetwork Income
 *
 * POST /smartOffice/addIncome
 * Body: { incomeType: string, incomeAmount: number, incomeDate: number, incomeRemarks: string }
 *
 * @param {Object} payload
 * @param {string} payload.incomeType    - Income type/category (required)
 * @param {number} payload.incomeAmount  - Income amount (required)
 * @param {number} payload.incomeDate    - Income date as a timestamp
 * @param {string} [payload.incomeRemarks] - Remarks
 * @returns {Promise<Object>}
 */
export const addIncome = async (payload) => {
  try {
    const res = await api.post("/smartOffice/addIncome", payload);
    return res.data;
  } catch (error) {
    console.error("addIncome API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Delete a SmartNetwork Income
 *
 * DELETE /smartOffice/deleteIncome
 * Body: { incomeId: string }
 *
 * @param {string} incomeId - The ID of the income to delete
 * @returns {Promise<Object>}
 */
export const deleteIncome = async (incomeId) => {
  try {
    const res = await api.delete("/smartOffice/deleteIncome", {
      data: { incomeId },
    });
    return res.data;
  } catch (error) {
    console.error("deleteIncome API Error:", error?.response || error);
    throw error;
  }
};
