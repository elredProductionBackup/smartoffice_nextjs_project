import api from "@/services/axios";

/**
 * Fetch budget types with pagination
 *
 * GET /smartOffice/getBudgetType?start=1&offset=10
 *
 * @param {number} [start=1]   - Starting index (1-based)
 * @param {number} [offset=10] - Number of records to fetch
 * @returns {Promise<Object>}  - API response containing budget type list
 */
export const getBudgetType = async (start = 1, offset = 10) => {
  try {
    const res = await api.get("/smartOffice/getBudgetType", {
      params: { start, offset },
    });
    return res.data;
  } catch (error) {
    console.error("getBudgetType API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Add or Edit a SmartNetwork Expense
 *
 * Backend schema:
 *   desc        - string, min 2 chars required
 *   type        - "general" | "event"
 *   eventId     - string, only for event type
 *   portfolioId - string, must be a valid portfolio
 *   budgetTypeId- string, budget type ID from getBudgetType
 *   total       - float, min 0.00
 *   remark      - string, allow empty or min 2 chars
 *   vendorName  - string, allow empty or min 2 chars
 *   expenseId   - string, empty = new entry, non-empty = update
 *   attachment  - File   -> upload new file
 *               - ""     -> remove existing attachment
 *               - (key omitted) -> no change to attachment
 *
 * @param {Object}  payload
 * @param {string}  payload.description       - Expense description (mapped to "desc")
 * @param {string}  [payload.narrative]       - Fallback for description
 * @param {string}  payload.expenseType       - "General" | "Event Related" (mapped to type)
 * @param {string}  [payload.eventId]         - Event ID (only sent when type = "event")
 * @param {string}  [payload.event]           - Fallback for eventId
 * @param {string}  payload.portfolioId       - Portfolio ID
 * @param {string}  [payload.portfolio]       - Fallback for portfolioId
 * @param {string}  [payload.budgetTypeId]    - Budget Type ID from getBudgetType API
 * @param {number}  payload.totalAmount       - Total amount (mapped to "total")
 * @param {string}  [payload.remark]          - Remark / notes
 * @param {string}  [payload.vendorName]      - Vendor name
 * @param {string}  [payload.vendor]          - Fallback for vendorName
 * @param {string}  [payload.expenseId]       - Expense ID for updates; empty for new
 * @param {string}  [payload.id]              - Fallback for expenseId
 * @param {File}    [payload.file]            - New file to upload
 * @param {boolean} [payload.removeAttachment]- True to send empty attachment key (removes file)
 * @returns {Promise<Object>}
 */
export const addEditExpense = async (payload) => {
  try {
    const formData = new FormData();

    // -- Required fields --------------------------------------------------
    formData.append("desc", payload.description || payload.narrative || "");

    const isEventType =
      payload.expenseType === "Event Related" || payload.type === "Event Related";
    formData.append("type", isEventType ? "event" : "general");

    // eventId: only send when type is "event"
    formData.append("eventId", isEventType ? payload.eventId || payload.event || "" : "");

    // Budget Type ID
    if (payload.budgetTypeId) {
      formData.append("budgetTypeId", payload.budgetTypeId);
    }

    formData.append("total", Number(payload.totalAmount) || 0);

    // -- Optional fields --------------------------------------------------
    formData.append("remark", payload.remark || "");
    formData.append("vendorName", payload.vendorName || payload.vendor || "");

    // expenseId: empty string = create new, non-empty = update existing
    formData.append("expenseId", payload.expenseId || payload.id || "");

    // -- Attachment handling -----------------------------------------------
    // File object       -> upload new attachment
    // removeAttachment  -> send empty string to signal removal to backend
    // Neither           -> do NOT append the key at all (backend leaves unchanged)
    if (payload.file instanceof File) {
      formData.append("attachment", payload.file);
    } else if (payload.removeAttachment === true) {
      formData.append("attachment", "");
    }

    const res = await api.patch("/smartOffice/addEditExpense", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  } catch (error) {
    console.error("addEditExpense API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Delete a budget expense
 *
 * DELETE /smartOffice/deleteExpense
 * Body: { budgetExpenseId: string }
 *
 * @param {string} budgetExpenseId - The ID of the expense to delete
 * @returns {Promise<Object>}
 */
export const deleteExpense = async (budgetExpenseId) => {
  try {
    const res = await api.delete("/smartOffice/deleteExpense", {
      data: { budgetExpenseId },
    });

    const data = res.data;

    // Axios validateStatus allows all status codes — check success flag manually
    if (data?.success === false) {
      const err = new Error(data?.message || "Delete failed");
      err.response = {
        status: res.status,
        data,
      };
      throw err;
    }

    return data;
  } catch (error) {
    console.error("deleteExpense API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Add a new budget category
 *
 * POST /smartOffice/addBudgetCategory
 * Body: { budgetTypeId: string, budgetCategory: string, percentage: number }
 *
 * @param {Object} payload
 * @param {string} payload.budgetTypeId
 * @param {string} payload.budgetCategory
 * @param {number} payload.percentage
 * @returns {Promise<Object>}
 */
export const addBudgetCategory = async (payload) => {
  try {
    const res = await api.post("/smartOffice/addBudgetCategory", payload);
    return res.data;
  } catch (error) {
    console.error("addBudgetCategory API Error:", error?.response || error);
    throw error;
  }
};

