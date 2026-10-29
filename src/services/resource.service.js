import api from "./axios";

// Axios validateStatus allows all status codes — check success flag manually
const throwIfFailed = (res, fallbackMessage) => {
  const data = res.data;
  if (data?.success === false) {
    const err = new Error(data?.message || fallbackMessage);
    err.response = {
      status: res.status,
      data,
    };
    throw err;
  }
  return data;
};

/**
 * List resources for the network cluster (newest first)
 *
 * GET /smartOffice/resources?searchBy=name&searchKey=&start=0&offset=10
 * networkClusterCode is read from the JWT on the backend.
 *
 * @param {Object} [params]
 * @param {"name"|"organization"} [params.searchBy] - Field to search on
 * @param {string} [params.searchKey]               - Search text (empty = all)
 * @param {number} [params.start]                   - Number of resources to skip
 * @param {number} [params.offset]                  - Page size
 * @returns {Promise<{ result: Array, totalCount: number }>}
 */
export const getResources = async ({ searchBy = "name", searchKey = "", start = 0, offset = 10 } = {}) => {
  try {
    const res = await api.get("/smartOffice/resources", {
      params: { searchBy, searchKey, start, offset },
    });
    const data = throwIfFailed(res, "Failed to fetch resources");

    return {
      result: Array.isArray(data?.result) ? data.result : [],
      totalCount: data?.totalCount ?? 0,
    };
  } catch (error) {
    console.error("getResources API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Create or update a resource
 *
 * PATCH /smartOffice/addEditResource
 * Body: { resourceId, name, organization?, email?, phone?, linkedInUrl? }
 * resourceId "" creates a new resource; an id updates that resource.
 * organization is the "Company/University" field.
 *
 * @param {Object} payload
 * @param {string} [payload.resourceId]   - "" to create
 * @param {string} payload.name           - 2–100 chars
 * @param {string} [payload.organization] - ≤ 150 chars
 * @param {string} [payload.email]
 * @param {string} [payload.phone]        - 7–15 digits, optional leading +
 * @param {string} [payload.linkedInUrl]  - https://…linkedin.com/… URL
 * @returns {Promise<Object>} the saved resource
 */
export const addEditResource = async ({ resourceId = "", name, organization, email, phone, linkedInUrl }) => {
  try {
    // On create, optional fields are only sent when filled in.
    // On update they're always sent so a cleared field ("") is removed.
    const body = { resourceId, name };
    const optional = { organization, email, phone, linkedInUrl };
    Object.entries(optional).forEach(([key, value]) => {
      if (resourceId) body[key] = value ?? "";
      else if (value) body[key] = value;
    });

    const res = await api.patch("/smartOffice/addEditResource", body);
    const data = throwIfFailed(res, "Failed to save resource");

    return Array.isArray(data?.result) ? data.result[0] : data?.result;
  } catch (error) {
    console.error("addEditResource API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Set the outreach stages ticked for a resource
 *
 * PATCH /smartOffice/updateResourceType
 * Body: { resourceId, type }
 * type replaces the whole list; [] clears it.
 *
 * @param {Object} payload
 * @param {string} payload.resourceId
 * @param {string[]} payload.type
 * @returns {Promise<Object>} the updated resource
 */
export const updateResourceType = async ({ resourceId, type }) => {
  try {
    const res = await api.patch("/smartOffice/updateResourceType", { resourceId, type });
    const data = throwIfFailed(res, "Failed to update resource type");

    return (Array.isArray(data?.result) ? data.result[0] : data?.result) || {};
  } catch (error) {
    console.error("updateResourceType API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Delete a resource (soft delete)
 *
 * DELETE /smartOffice/deleteResource
 * Body: { resourceId }
 *
 * @param {string} resourceId
 * @returns {Promise<Object>}
 */
export const deleteResource = async (resourceId) => {
  try {
    const res = await api.delete("/smartOffice/deleteResource", {
      data: { resourceId },
      headers: { "Content-Type": "application/json" },
    });
    const data = throwIfFailed(res, "Failed to delete resource");

    return (Array.isArray(data?.result) ? data.result[0] : data?.result) || {};
  } catch (error) {
    console.error("deleteResource API Error:", error?.response || error);
    throw error;
  }
};

/**
 * List notes kept against a resource
 *
 * GET /smartOffice/resourceNotes?resourceId=&start=0&offset=10
 *
 * @param {Object} params
 * @param {string} params.resourceId - Resource whose notes to fetch
 * @param {number} [params.start]    - Number of notes to skip
 * @param {number} [params.offset]   - Page size
 * @returns {Promise<{ result: Array, totalCount: number }>}
 */
export const getResourceNotes = async ({ resourceId, start = 0, offset = 10 }) => {
  try {
    const res = await api.get("/smartOffice/resourceNotes", {
      params: { resourceId, start, offset },
    });
    const data = throwIfFailed(res, "Failed to fetch resource notes");

    return {
      result: Array.isArray(data?.result) ? data.result : [],
      totalCount: data?.totalCount ?? 0,
    };
  } catch (error) {
    console.error("getResourceNotes API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Add a note to a resource
 *
 * POST /smartOffice/resourceNotes
 * Body: { resourceId, text }
 *
 * @param {Object} payload
 * @param {string} payload.resourceId
 * @param {string} payload.text
 * @returns {Promise<Object>} the saved note
 */
export const addResourceNote = async ({ resourceId, text }) => {
  try {
    const res = await api.post("/smartOffice/resourceNotes", { resourceId, text });
    const data = throwIfFailed(res, "Failed to add note");

    return Array.isArray(data?.result) ? data.result[0] : data?.result;
  } catch (error) {
    console.error("addResourceNote API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Edit a resource note
 *
 * PATCH /smartOffice/resourceNotes
 * Body: { resourceId, noteId, text }
 *
 * @param {Object} payload
 * @param {string} payload.resourceId
 * @param {string} payload.noteId
 * @param {string} payload.text
 * @returns {Promise<Object>} the updated note
 */
export const updateResourceNote = async ({ resourceId, noteId, text }) => {
  try {
    const res = await api.patch("/smartOffice/resourceNotes", { resourceId, noteId, text });
    const data = throwIfFailed(res, "Failed to update note");

    return (Array.isArray(data?.result) ? data.result[0] : data?.result) || {};
  } catch (error) {
    console.error("updateResourceNote API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Delete a resource note
 *
 * DELETE /smartOffice/resourceNotes
 * Body: { noteId }
 *
 * @param {string} noteId
 * @returns {Promise<Object>}
 */
export const deleteResourceNote = async (noteId) => {
  try {
    const res = await api.delete("/smartOffice/resourceNotes", {
      data: { noteId },
      headers: { "Content-Type": "application/json" },
    });
    const data = throwIfFailed(res, "Failed to delete note");

    return (Array.isArray(data?.result) ? data.result[0] : data?.result) || {};
  } catch (error) {
    console.error("deleteResourceNote API Error:", error?.response || error);
    throw error;
  }
};
