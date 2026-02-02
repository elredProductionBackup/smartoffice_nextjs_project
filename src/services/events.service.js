import api from "@/services/axios";

export const getEventsList = ({
  networkClusterCode,
  start = 1,
  offset = 10,
  filterBy = "all",
  searchKey = "",
}) => {
  return api.get("/smartOffice/getEventsList", {
    params: {
      networkClusterCode,
      start,
      offset,
      filterBy,
      searchKey,
    },
  });
};

export const getMasterList = (networkClusterCode) => {
  return api.get("/smartOffice/masterList", {
    params: { networkClusterCode },
  });
};

export const updateMasterList = (payload) => {
  return api.patch("/smartOffice/masterList", payload);
};