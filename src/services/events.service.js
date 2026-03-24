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

// Get Members Media List
export const getMembersMedia = ({
  eventId,
  start = 1,
  offset = 10,
}) => {
  return api.get("/smartOffice/getMembersMedia", {
    params: {
      eventId,
      start,
      offset,
    },
  });
};

// Get My Documents List
export const getMyDocuments = ({
  eventId,
  start = 1,
  offset = 10,
}) => {
  return api.get("/smartOffice/getMyDocuments", {
    params: {
      eventId,
      start,
      offset,
    },
  });
};

// Close Event
export const closeEvent = ({ eventId }) => {
  return api.post("/smartOffice/closeEvent", {
    eventId,
  });
};

// Add Members Media
export const addMemberMedia = ({ mediaFiles, eventId }) => {
  const formData = new FormData();

  mediaFiles.forEach((file) => {
    formData.append("mediaFile", file);
  });

  formData.append("eventId", eventId);

  return api.post("/smartOffice/addMemberMedia", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Add Document
export const addDocument = ({ documentFiles, eventId }) => {
  const formData = new FormData();

  documentFiles.forEach((file) => {
    formData.append("documentFile", file);
  });

  formData.append("eventId", eventId);

  return api.post("/smartOffice/addDocument", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Delete Members Media
export const deleteMemberMedia = ({ eventId, deleteURL }) => {
  return api.delete("/smartOffice/deleteMemberMedia", {
    data: {
      eventId,
      deleteURL,
    },
  });
};

// Delete My Document
export const deleteMyDocument = ({ eventId, deleteURL }) => {
  return api.delete("/smartOffice/deleteMyDocument", {
    data: {
      eventId,
      deleteURL,
    },
  });
};

// Get Event Details
export const getEventDetails = ({ eventId }) => {
  return api.get("/smartOffice/getEventsDetails", {
    params: {
      eventId,
    },
  });
};