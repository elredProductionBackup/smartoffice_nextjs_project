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
 * Body: { resourceId, name, organization?, email?, phone? }
 * resourceId "" creates a new resource; an id updates that resource.
 * organization is the "Company/University" field.
 *
 * @param {Object} payload
 * @param {string} [payload.resourceId]   - "" to create
 * @param {string} payload.name           - 2–100 chars
 * @param {string} [payload.organization] - ≤ 150 chars
 * @param {string} [payload.email]
 * @param {string} [payload.phone]        - 7–15 digits, optional leading +
 * @returns {Promise<Object>} the saved resource
 */
export const addEditResource = async ({ resourceId = "", name, organization, email, phone }) => {
  try {
    // Optional fields are only sent when filled in
    const body = { resourceId, name };
    if (organization) body.organization = organization;
    if (email) body.email = email;
    if (phone) body.phone = phone;

    const res = await api.patch("/smartOffice/addEditResource", body);
    const data = throwIfFailed(res, "Failed to save resource");

    return Array.isArray(data?.result) ? data.result[0] : data?.result;
  } catch (error) {
    console.error("addEditResource API Error:", error?.response || error);
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
