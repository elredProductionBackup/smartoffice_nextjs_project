import api from "@/services/axios";
/** GET actionables list */
export const getActionables = ({
  networkClusterCode,
  start = 1,
  offset = 10,
  search = "",
  dueSearchKey = "today",
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
  return api.delete("/smartOffice/deleteComment", {
    data: payload,
  });
};

/* ===================== SUB TASK ===================== */

/** ADD subtask */
export const addSubTask = (payload) => {
  return api.patch("/smartOffice/addSubTask", payload);
};

export const deleteSubTask = (payload) => {
  return api.delete("/smartOffice/deleteSubTask", {
    data: payload,
  });
};

/* ===================== COLLABORATORS ===================== */

/** GET collaborators */
export const getCollaborators = ({
  networkClusterCode,
  offset = 0,
  search = "",
}) => {
  return api.get("/smartOffice/collaborators", {
    params: {
      networkClusterCode,
      offset,
      search,
    },
  });
};
