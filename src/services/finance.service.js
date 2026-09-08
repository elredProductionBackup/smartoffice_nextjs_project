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

/**
 * Fetch the Budget Report broken down by Event, within one Category (Portfolio)
 *
 * GET /smartOffice/getBudgetEventReportCategory?budgetTypeId=
 *
 * budgetTypeId (camelCase) is the ONLY accepted query param — the endpoint
 * 500s with "Extra/Invalid keys passed in the query params" on anything
 * else (confirmed: adding networkClusterCode, or start/offset, both 500).
 * Don't add params here without a confirmed-working example from backend.
 *
 * Response result shape (one entry per event under that budgetTypeId):
 *   eventId             - string
 *   eventName           - string
 *   eventBudget         - float, assigned budget for this event
 *   eventExpenseAmount  - float, expense incurred by this event
 *   eventType           - { budgettype, networkClusterCode, budgetTypeId }
 *   eventImage          - string
 *   eventDescription    - string
 *   startDateTime/endDateTime/timeZone
 *   eventLocation       - { type: "address" | "meeting link", location }
 *   NumberOfattendees   - number
 *
 * @param {string} budgetTypeId
 * @returns {Promise<Object>} { success, isAuth, message, totalCount, result: [] }
 */
export const getBudgetEventReportCategory = async (budgetTypeId) => {
  try {
    const res = await api.get("/smartOffice/getBudgetEventReportCategory", {
      params: { budgetTypeId },
    });

    if (res.status >= 400 || typeof res.data !== "object" || res.data === null) {
      const err = new Error(
        `getBudgetEventReportCategory failed with status ${res.status}: ${
          typeof res.data === "string" ? res.data : res.data?.message || "Unknown error"
        }`
      );
      err.response = { status: res.status, data: res.data };
      throw err;
    }

    return res.data;
  } catch (error) {
    console.error("getBudgetEventReportCategory API Error:", error?.response || error);
    throw error;
  }
};
