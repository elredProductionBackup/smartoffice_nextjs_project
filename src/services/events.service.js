  import api from "@/services/axios";
  import { buildEventPayload, mapDraftToForm } from "@/utils/eventPayload";

  export const submitEvent = async (payload) => {
    try {
      const formData = new FormData();
      const networkClusterCode =
        typeof window !== "undefined" ? localStorage.getItem("networkClusterCode") : "";

      const fullPayload = {
        ...payload,
        ...(networkClusterCode && { networkClusterCode }),
      };

      console.log("Submitting event payload:", fullPayload);

      Object.entries(fullPayload).forEach(([k, v]) => {
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


  export const updateEventBudget = async ({ event, eventBudget }) => {
    try {
      const form = mapDraftToForm(event);
      const payload = buildEventPayload(form, false, true);

      // API expects eventType as an object with lowercase budgetType
      payload.eventType = event.eventType?.budgetTypeId;

      payload.eventBudget = Number(eventBudget);

      return await submitEvent(payload);
    } catch (error) {
      console.error("updateEventBudget API Error:", error?.response || error);
      throw error;
    }
  };


  /* ═══════════════════════════════════════════════════════════════════════════
   EVENT COSTING — INTEGRATION ADDITIONS
   Paste each block into the file named in its banner. Nothing here replaces
   existing code; it only adds. Order of files: service → thunks → slice.
   ═══════════════════════════════════════════════════════════════════════════ */
 
 
/* ┌─────────────────────────────────────────────────────────────────────────┐
   │ FILE 1 — @/services/events.service.js                                     │
   │ Append these three functions (api + FormData style match your file).      │
   └─────────────────────────────────────────────────────────────────────────┘ */
 
// GET — API 9: fetch all budget-category versions for an event
export const getBudgetCategoryVersions = ({ eventId }) => {
  return api.get("/smartOffice/getBudgetCategoryversions", {
    params: { eventId },
  });
};
 
// PATCH — API 10: add/edit one split (line item) of a category version.
// qty / rate / totalSplit are FULL arrays (one entry per version).
export const patchBudgetCategoryVersion = ({
  budgetCategoryVersionId,
  qty,
  rate,
  totalSplit,
  splitName,
}) => {
  return api.patch("/smartOffice/patchBudgetCategoryVersions", {
    budgetCategoryVersionId,
    qty,
    rate,
    totalSplit,
    splitName,
  });
};
 
// PATCH — API 11: add/edit the ACTUAL expense for one split.
// attachment rules (per spec):
//   attachment === ""        → send empty key  → removes existing attachment
//   attachment instanceof File → send file      → sets/replaces attachment
//   attachment === undefined → omit key         → leaves attachment untouched
export const addEditEventExpense = ({
  budgetCategoryVersionId,
  vendorName,
  qty,
  rate,
  totalExpense,
  splitName,
  attachment,
}) => {
  const form = new FormData();
  form.append("budgetCategoryVersionId", budgetCategoryVersionId);
  form.append("vendorName", vendorName ?? "");
  form.append("qty", qty ?? 0);
  form.append("rate", rate ?? 0);
  form.append("totalExpense", totalExpense ?? 0);
  form.append("splitName", splitName);
 
  if (attachment === "") form.append("attachment", "");
  else if (attachment instanceof File) form.append("attachment", attachment);
 
  return api.patch("/smartOffice/addEditEventExpense", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};