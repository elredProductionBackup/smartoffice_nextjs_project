import api from "@/services/axios";

/**
 * Fetch the SmartNetwork Finance Dashboard Report (Vision Board cards)
 *
 * GET /smartOffice/getFinanceDashboardReport
 *
 * Response result shape:
 *   networkBudgetAmount       - float, total allocated budget
 *   networkIncomeAmount       - float, total yearly income
 *   networkTotalExpenseAmount - float, total expenses
 *
 * @returns {Promise<Object>}
 */
export const getFinanceDashboardReport = async () => {
  try {
    const res = await api.get("/smartOffice/getFinanceDashboardReport");

    // axios is configured with validateStatus: status < 600, so a 404/500
    // resolves here instead of throwing — catch non-JSON/error responses
    // explicitly.
    if (res.status >= 400 || typeof res.data !== "object" || res.data === null) {
      const err = new Error(
        `getFinanceDashboardReport failed with status ${res.status}: ${
          typeof res.data === "string" ? res.data : res.data?.message || "Unknown error"
        }`
      );
      err.response = { status: res.status, data: res.data };
      throw err;
    }

    return res.data;
  } catch (error) {
    console.error("getFinanceDashboardReport API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Fetch the SmartNetwork Budget Report broken down by Category (Portfolio)
 *
 * GET /smartOffice/getBudgetReportCategory?start=&offset=
 *
 * Response result shape (one entry per budgetTypeId):
 *   budgetTypeId       - string, matches a budgetTypes[].budgetTypeId
 *   budgetAmount       - float, total budget assigned to this category
 *   eventExpenseAmount - float, expense incurred via events under this category
 *   overallExpense     - float, total expense (event + general) for this category
 *   totalExpense       - float
 *   createdBy/createdAt/updatedBy/updatedAt - audit fields
 *
 * @param {number} [start=1]
 * @param {number} [offset=100]
 * @returns {Promise<Object>}
 */
export const getBudgetReportCategory = async (start = 1, offset = 100) => {
  try {
    const res = await api.get("/smartOffice/getBudgetReportCategory", {
      params: { start, offset },
    });

    if (res.status >= 400 || typeof res.data !== "object" || res.data === null) {
      const err = new Error(
        `getBudgetReportCategory failed with status ${res.status}: ${
          typeof res.data === "string" ? res.data : res.data?.message || "Unknown error"
        }`
      );
      err.response = { status: res.status, data: res.data };
      throw err;
    }

    return res.data;
  } catch (error) {
    console.error("getBudgetReportCategory API Error:", error?.response || error);
    throw error;
  }
};
