import api from "@/services/axios";

export const submitEvent = async (payload) => {
  try {
    const formData = new FormData();

    Object.entries(payload).forEach(([k, v]) => {
      if (v instanceof File) formData.append(k, v);
      else if (Array.isArray(v) || typeof v === "object")
        formData.append(k, JSON.stringify(v));
      else formData.append(k, v ?? "");
    });

    const res = await api.patch("/smartOffice/addEvents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;

  } catch (error) {
    console.error("submitEvent API Error:", error?.response || error);
    throw error;
  }
};


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

export const getEventMembers = ({
  eventId,
  start = 1,
  offset = 10,
}) => {
  return api.get("/smartOffice/getEventsMembersList", {
    params: {
      eventId,
      start,
      offset,
    },
  });
};