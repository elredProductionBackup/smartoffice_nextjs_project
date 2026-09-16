// import { createAsyncThunk } from "@reduxjs/toolkit";
// import { apiClient, unwrap, asRejected } from "./budgetHttp";

// // #1  GET /smartOffice/getBudgetType
// export const fetchBudgetTypes = createAsyncThunk(
//   "eventCosting/fetchBudgetTypes",
//   async ({ start = 1, offset = 10, search = "" } = {}, { rejectWithValue }) => {
//     try {
//       const data = unwrap(
//         await apiClient.get("/smartOffice/getBudgetType", {
//           params: { start, offset, search },
//         })
//       );
//       return { items: data.result || [], total: data.totalBudgetType || 0 };
//     } catch (err) {
//       return rejectWithValue(asRejected(err));
//     }
//   }
// );

// // #8  GET /smartOffice/getBudgetCategory
// export const fetchBudgetCategories = createAsyncThunk(
//   "eventCosting/fetchCategories",
//   async ({ budgetTypeId, start = 1, offset = 50 }, { rejectWithValue }) => {
//     try {
//       const data = unwrap(
//         await apiClient.get("/smartOffice/getBudgetCategory", {
//           params: { budgetTypeId, start, offset },
//         })
//       );
//       return { items: data.result || [], total: data.totalCount || 0 };
//     } catch (err) {
//       return rejectWithValue(asRejected(err));
//     }
//   }
// );

// // #2  POST /smartOffice/addBudgetCategory
// export const addBudgetCategory = createAsyncThunk(
//   "eventCosting/addCategory",
//   async ({ budgetTypeId, budgetCategory, percentage }, { rejectWithValue }) => {
//     try {
//       const data = unwrap(
//         await apiClient.post("/smartOffice/addBudgetCategory", {
//           budgetTypeId,
//           budgetCategory,
//           percentage,
//         })
//       );
//       return (
//         data.result?.[0] ||
//         data.result || { budgetTypeId, budgetCategory, percentage }
//       );
//     } catch (err) {
//       return rejectWithValue(asRejected(err));
//     }
//   }
// );

// // #3  DELETE /smartOffice/removeBudgetCategory
// export const removeBudgetCategory = createAsyncThunk(
//   "eventCosting/removeCategory",
//   async ({ budgetCategoryId }, { rejectWithValue }) => {
//     try {
//       unwrap(
//         await apiClient.delete("/smartOffice/removeBudgetCategory", {
//           data: { budgetCategoryId },
//         })
//       );
//       return budgetCategoryId;
//     } catch (err) {
//       return rejectWithValue(asRejected(err));
//     }
//   }
// );

// // #7  GET /smartOffice/budgetExpense — server-computed amounts per category
// export const fetchEventBudgetExpense = createAsyncThunk(
//   "eventCosting/fetchEventBudget",
//   async ({ eventId, start = 1, offset = 50 }, { rejectWithValue }) => {
//     try {
//       const data = unwrap(
//         await apiClient.get("/smartOffice/budgetExpense", {
//           params: { start, offset, eventId },
//         })
//       );
//       return data.result || [];
//     } catch (err) {
//       return rejectWithValue(asRejected(err));
//     }
//   }
// );

// // #9  GET /smartOffice/getBudgetCategoryversions
// export const fetchBudgetCategoryVersions = createAsyncThunk(
//   "eventCosting/fetchVersions",
//   async ({ eventId }, { rejectWithValue }) => {
//     try {
//       const data = unwrap(
//         await apiClient.get("/smartOffice/getBudgetCategoryversions", {
//           params: { eventId },
//         })
//       );
//       return data.result || [];
//     } catch (err) {
//       return rejectWithValue(asRejected(err));
//     }
//   }
// );

// // #10 PATCH /smartOffice/patchBudgetCategoryVersions — update one split
// export const patchBudgetCategoryVersion = createAsyncThunk(
//   "eventCosting/patchVersion",
//   async (
//     { budgetCategoryVersionId, qty, rate, totalSplit, splitName },
//     { rejectWithValue }
//   ) => {
//     try {
//       const data = unwrap(
//         await apiClient.patch("/smartOffice/patchBudgetCategoryVersions", {
//           budgetCategoryVersionId,
//           qty,
//           rate,
//           totalSplit,
//           splitName,
//         })
//       );
//       return {
//         budgetCategoryVersionId,
//         splitName,
//         qty,
//         rate,
//         totalSplit,
//         result: data.result,
//       };
//     } catch (err) {
//       return rejectWithValue(asRejected(err));
//     }
//   }
// );

// // #5  GET /smartOffice/expense
// export const fetchExpenses = createAsyncThunk(
//   "eventCosting/fetchExpenses",
//   async (
//     { start = 1, offset = 50, type = "event", eventId = "", approvedStatus = "", search = "" } = {},
//     { rejectWithValue }
//   ) => {
//     try {
//       const data = unwrap(
//         await apiClient.get("/smartOffice/expense", {
//           params: { start, offset, type, eventId, approvedStatus, search },
//         })
//       );
//       return { items: data.result || [], total: data.totalExpense || 0 };
//     } catch (err) {
//       return rejectWithValue(asRejected(err));
//     }
//   }
// );

// // #11 PATCH /smartOffice/addEditEventExpense (multipart)
// export const addEditEventExpense = createAsyncThunk(
//   "eventCosting/addEventExpense",
//   async (payload, { rejectWithValue }) => {
//     try {
//       const {
//         budgetCategoryVersionId,
//         vendorName,
//         qty,
//         rate,
//         totalExpense,
//         splitName,
//         attachment,
//       } = payload;
//       const fd = new FormData();
//       fd.append("budgetCategoryVersionId", budgetCategoryVersionId);
//       fd.append("vendorName", vendorName);
//       fd.append("qty", qty);
//       fd.append("rate", rate);
//       fd.append("totalExpense", totalExpense);
//       fd.append("splitName", splitName);
//       if (attachment !== undefined) fd.append("attachment", attachment);

//       const data = unwrap(
//         await apiClient.patch("/smartOffice/addEditEventExpense", fd, {
//           headers: { "Content-Type": "multipart/form-data" },
//         })
//       );
//       return data.result;
//     } catch (err) {
//       return rejectWithValue(asRejected(err));
//     }
//   }
// );

// // #6  DELETE /smartOffice/deleteExpense
// export const deleteExpense = createAsyncThunk(
//   "eventCosting/deleteExpense",
//   async ({ budgetExpenseId }, { rejectWithValue }) => {
//     try {
//       unwrap(
//         await apiClient.delete("/smartOffice/deleteExpense", {
//           data: { budgetExpenseId },
//         })
//       );
//       return budgetExpenseId;
//     } catch (err) {
//       return rejectWithValue(asRejected(err));
//     }
//   }
// );

// // ── NEW: update the event's TOTAL budget via the Create/Update Events API ─────
// // PATCH /smartOffice/addEvents  — empty eventId creates, otherwise updates.
// // We send only { eventId, eventBudget } to update the total; per-category
// // amounts (#7) are recomputed server-side, so we refetch the breakup after.
// export const updateEventBudget = createAsyncThunk(
//   "eventCosting/updateEventBudget",
//   async ({ eventId, eventBudget }, { dispatch, rejectWithValue }) => {
//     try {
//       const data = unwrap(
//         await apiClient.patch("/smartOffice/addEvents", { eventId, eventBudget })
//       );
//       // amounts are server-computed → pull the fresh breakup
//       if (eventId) dispatch(fetchEventBudgetExpense({ eventId }));
//       return {
//         eventBudget: Number(eventBudget) || 0,
//         result: data.result?.[0] || data.result,
//       };
//     } catch (err) {
//       return rejectWithValue(asRejected(err));
//     }
//   }
// );