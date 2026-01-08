import {
  getActionables,
  addActionable,
  addComment,
  getComments,
  deleteComment,
  addSubTask,
  deleteSubTask,
  deleteActionable,
  getCollaborators,
} from "@/services/actionable.service";
import { createAsyncThunk } from "@reduxjs/toolkit";
import moment from "moment";

/* ================= ACTIONABLE ================= */

export const fetchActionables = createAsyncThunk(
  "actionable/fetchActionables",
  async ({ page, limit, search, dueSearchKey }, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");

      const start = (page - 1) * limit + 1;
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
  async (payload, { rejectWithValue }) => {
    try {
      const { tempId, ...rest } = payload;

      const apiPayload = {
        ...rest,
        actionableId: "",
      };

      const res = await addActionable(apiPayload);

      if (!res.data.success) {
        return rejectWithValue({
          message: res.data.message,
          tempId,
        });
      }

      return {
        item: res.data.result[0],
        tempId,
      };
    } catch (err) {
      return rejectWithValue({
        message: err.message,
        tempId: payload.tempId,
      });
    }
  }
);

// actionableThunks.js
export const updateActionable = createAsyncThunk(
  "actionable/updateActionable",
  async (
    { actionableId, title, notes, collaborators },
    { rejectWithValue }
  ) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");

      const res = await addActionable({
        actionableId,
        networkClusterCode,
        title,
        notes,
        collaborators:collaborators.map(
        (c) => c.userCode
        ),
      });

      if (!res.data?.success) {
        return rejectWithValue(res.data?.message);
      }

      return {
        actionableId,
        title,
        notes,
        collaborators,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);



export const removeActionable = createAsyncThunk(
  "actionable/deleteActionable",
  async (payload, { getState, rejectWithValue }) => {
    const state = getState().actionable;

    const item = state.items.find(
      (i) => i.actionableId === payload.actionableId
    );

    if (item?.isOptimistic) {
      return {
        actionableId: payload.actionableId,
        skipApi: true,
      };
    }

    try {
      await deleteActionable(payload);

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

      const res = await addActionable({
        actionableId,
        networkClusterCode,
        isCompleted,
      });

      if (!res.data?.success) {
        return rejectWithValue(res.data?.message);
      }

      return { actionableId, isCompleted };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message
      );
    }
  }
);

export const changeDueDateTime = createAsyncThunk(
  "actionable/changeDueDateTime",
  async ({ actionableId, dueDate, dueTime }, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");

      const istMoment = moment(
        `${dueDate} ${dueTime}`,
        "YYYY-MM-DD HH:mm"
      );

      if (!istMoment.isValid()) {
        return rejectWithValue("Invalid due date or time");
      }

      const utcMoment = istMoment
        .clone()
        .subtract(5, "hours")
        .subtract(30, "minutes");

      const dueDateTimeStamp = utcMoment.format(
        "YYYY-MM-DDTHH:mm:ss.SSS[Z]"
      );

      const res = await addActionable({
        actionableId,
        networkClusterCode,
        dueDateTimeStamp,
      });

      if (!res.data?.success) {
        return rejectWithValue(res.data?.message);
      }

      return {
        actionableId,
        dueDateTimeStamp,

        dueDate: istMoment.format("DD MMM YYYY"),
        dueTime: istMoment.format("h:mm A"),

        message: "Due date updated successfully",
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message
      );
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


/* ================= SUBTASK ================= */

/* ================= CREATE SUBTASK ================= */
export const createSubTask = createAsyncThunk(
  "actionable/createSubTask",
  async (payload, { rejectWithValue }) => {
    try {
      const { tempId, ...rest } = payload;
      const networkClusterCode = localStorage.getItem("networkClusterCode");

      const res = await addSubTask({
        ...rest,
        _id: "",
        networkClusterCode,
      });

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data.message,
          tempId,
          actionableId: payload.actionableId,
        });
      }

      return {
        actionableId: payload.actionableId,
        subTask: res.data.result[0],
        tempId,
      };
    } catch (err) {
      return rejectWithValue({
        message: err.message,
        tempId: payload.tempId,
        actionableId: payload.actionableId,
      });
    }
  }
);

/* ================= UPDATE SUBTASK ================= */
export const updateSubTask = createAsyncThunk(
  "actionable/updateSubTask",
  async (payload, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");

      const res = await addSubTask({
        ...payload,        
        networkClusterCode,
      });

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data.message,
          actionableId: payload.actionableId,
          subTaskId: payload._id,
          previous: payload.previous,
        });
      }

      return {
        actionableId: payload.actionableId,
        subTask: res.data.result,
      };
    } catch (err) {
      return rejectWithValue({
        message: err.message,
        actionableId: payload.actionableId,
        subTaskId: payload._id,
        previous: payload.previous,
      });
    }
  }
);



export const removeSubTask = createAsyncThunk(
  "actionable/removeSubTask",
  async ({ actionableId, subTaskId }, { rejectWithValue }) => {
    try {
      const networkClusterCode = localStorage.getItem("networkClusterCode");
      await deleteSubTask({ _id:subTaskId,networkClusterCode,actionableId });
      return { actionableId, subTaskId };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Fetch Collaborators
export const fetchCollaborators = createAsyncThunk(
  "actionable/fetchCollaborators",
  async ({ search = "", offset = 0 }, { rejectWithValue }) => {
    try {
      const networkClusterCode =
        localStorage.getItem("networkClusterCode");

      const res = await getCollaborators({
        networkClusterCode,
        search,
        offset,
      });

      return res?.data?.result; 
    } catch (err) {
      return rejectWithValue(err?.response?.data);
    }
  }
);

// Comments
/* ================= CREATE COMMENT ================= */
export const createComment = createAsyncThunk(
  "actionable/createComment",
  async (payload, { rejectWithValue }) => {
    try {
      const { tempId, actionableId, comment } = payload;
      const networkClusterCode = localStorage.getItem("networkClusterCode");

      const res = await addComment({
        _id: "",
        comment,
        actionableId,
        networkClusterCode,
      });

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data.message,
          tempId,
          actionableId,
        });
      }

      return {
        actionableId,
        comment: res.data.result[0],
        tempId,
      };
    } catch (err) {
      return rejectWithValue({
        message: err.message,
        tempId: payload.tempId,
        actionableId: payload.actionableId,
      });
    }
  }
);

/* ================= REMOVE COMMENT ================= */
export const removeComment = createAsyncThunk(
  "actionable/removeComment",
  async (payload, { rejectWithValue }) => {
    try {
      const { actionableId, commentId } = payload;
      const networkClusterCode = localStorage.getItem("networkClusterCode");

      const res = await deleteComment({
        commentId: commentId,
        actionableId,
        networkClusterCode,
      });

      if (!res.data?.success) {
        return rejectWithValue({
          message: res.data.message,
          actionableId,
          commentId,
        });
      }

      return {
        actionableId,
        commentId,
      };
    } catch (err) {
      return rejectWithValue({
        message: err.message,
        actionableId: payload.actionableId,
        commentId: payload.commentId,
      });
    }
  }
);
