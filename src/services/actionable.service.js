import api from "@/services/axios";

export const addActionable = async (payload) => {
  return api.patch("/smartOffice/addActionable", payload);
};

export const getActionables = async ({
  networkClusterCode,
  start = 1,
  offset = 20,
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
