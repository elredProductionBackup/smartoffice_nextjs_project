import api from "@/services/axios";
/** GET actionables list */
export const getActionables = ({
  networkClusterCode,
  start = 1,
  offset = 20,
  search = "",
  dueSearchKey = "today", // past | today | all
}) => {
  return api.get("/smartOffice/actionables", {
    params: {
      networkClusterCode,
      start,
      offset,
      search,
      dueSearchKey,
    },
  });
};

/** ADD / UPDATE actionable */
export const addActionable = (payload) => {
  return api.patch("/smartOffice/addActionable", payload);
};

/** DELETE actionable */
export const deleteActionable = (payload) => {
  return api.delete("/smartOffice/deleteActionable", {
    data: payload,
  });
};

/* ===================== COMMENTS ===================== */

/** ADD comment */
export const addComment = (payload) => {
  return api.patch("/smartOffice/addComment", payload);
};

/** GET comments */
export const getComments = ({
  networkClusterCode,
  actionableId,
  start = 1,
  offset = 5,
  search = "",
}) => {
  return api.get("/smartOffice/comments", {
    params: {
      networkClusterCode,
      actionableId,
      start,
      offset,
      search,
    },
  });
};

/** DELETE comment */
export const deleteComment = (payload) => {
  return api.patch("/smartOffice/deleteComment", payload);
};

/* ===================== SUB TASK ===================== */

/** ADD subtask */
export const addSubTask = (payload) => {
  return api.patch("/smartOffice/addSubTask", payload);
};

/** DELETE subtask */
export const deleteSubTask = (payload) => {
  return api.patch("/smartOffice/deleteSubTask", payload);
};

/* ===================== COLLABORATORS ===================== */

/** GET collaborators */
export const getCollaborators = ({ networkClusterCode }) => {
  return api.get("/smartOffice/collaborators", {
    params: { networkClusterCode },
  });
};
