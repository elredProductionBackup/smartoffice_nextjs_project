import {
  getActionables,
  addActionable,
  addComment,
  getComments,
  deleteComment,
  addSubTask,
  deleteSubTask,
  deleteActionable,
} from "@/services/actionable.service";
import { createAsyncThunk } from "@reduxjs/toolkit";

/* ================= ACTIONABLE ================= */

export const fetchActionables = createAsyncThunk(
  "actionable/fetchActionables",
  async ({ page, limit, search, dueSearchKey }, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");

      const start = (page - 1) * limit + 1;
      console.log(start)
      const offset = page * limit;

      const res = await getActionables({
        networkClusterCode,
        start,
        offset,
        search,
        dueSearchKey,
      });

      return {
        list: res.data?.result || [],
        total: res.data?.totalCount || 0,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createActionable = createAsyncThunk(
  "actionable/createActionable",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      await addActionable(payload);
      dispatch(fetchActionables({ page: 1, limit: 10, search: "", dueSearchKey: "today" }));
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** DELETE ACTIONABLE */
/** DELETE ACTIONABLE */
export const removeActionable = createAsyncThunk(
  "actionable/deleteActionable",
  async (payload, { dispatch, getState, rejectWithValue }) => {
    try {
      await deleteActionable(payload);

      const {
        page,
        limit,
        activeTab,
        search,
      } = getState().actionable;

      dispatch(
        fetchActionables({
          page,
          limit,
          search,
          dueSearchKey: activeTab, 
        })
      );

      return { actionableId: payload.actionableId };
    } catch (err) {
      return rejectWithValue(err.response?.data || "Delete failed");
    }
  }
);


export const toggleActionable = createAsyncThunk(
  "actionable/toggleActionable",
  async ({ actionableId, isCompleted }, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");

      await addActionable({
        actionableId,
        networkClusterCode,
        isCompleted,
      });

      return { actionableId, isCompleted };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);


/* ================= COMMENTS ================= */

export const fetchComments = createAsyncThunk(
  "actionable/fetchComments",
  async ({ actionableId }, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");

      const res = await getComments({
        networkClusterCode,
        actionableId,
        start: 1,
        offset: 5,
      });

      return { actionableId, comments: res.data?.result || [] };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createComment = createAsyncThunk(
  "actionable/createComment",
  async (payload, { dispatch }) => {
    await addComment(payload);
    dispatch(fetchComments({ actionableId: payload.actionableId }));
  }
);

export const removeComment = createAsyncThunk(
  "actionable/removeComment",
  async ({ actionableId, commentId, networkClusterCode }, { dispatch }) => {
    await deleteComment({ actionableId, commentId, networkClusterCode });
    dispatch(fetchComments({ actionableId }));
  }
);

/* ================= SUBTASK ================= */

export const createSubTask = createAsyncThunk(
  "actionable/createSubTask",
  async (payload, { dispatch }) => {
    await addSubTask(payload);
    dispatch(fetchActionables({ page: 1, limit: 10, search: "", dueSearchKey: "today" }));
  }
);

export const removeSubTask = createAsyncThunk(
  "actionable/removeSubTask",
  async (payload, { dispatch }) => {
    await deleteSubTask(payload);
    dispatch(fetchActionables({ page: 1, limit: 10, search: "", dueSearchKey: "today" }));
  }
);
