import api from "@/services/axios";

/**
 * Create or update a contact group.
 *
 * PATCH /createContactGroup
 * Body: { groupId: string, name: string, contacts: [{ name, phone, email }] }
 * groupId empty = create a new group; non-empty = update the existing group.
 *
 * @param {Object} payload
 * @param {string} [payload.groupId=""]   - Empty to create a new group, existing id to update
 * @param {string} payload.name           - Group name
 * @param {Array<{name: string, phone: string, email: string}>} [payload.contacts=[]]
 * @returns {Promise<Object>}
 */
export const createContactGroup = async ({ groupId = "", name, contacts = [] }) => {
  try {
    const res = await api.patch("/createContactGroup", {
      groupId,
      name,
      contacts,
    });
    return res.data;
  } catch (error) {
    console.error("createContactGroup API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Fetch all contact groups already created for this network cluster.
 *
 * GET /getContactGroups
 *
 * @returns {Promise<Object>} - API response containing the list of groups,
 *   each shaped like { _id, name, networkClusterCode, contacts, createdAt, updatedAt }
 */
export const getContactGroups = async () => {
  try {
    const res = await api.get("/getContactGroups");
    return res.data;
  } catch (error) {
    console.error("getContactGroups API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Fetch the contacts belonging to a single contact group.
 *
 * GET /getContactGroupContacts?groupId=...
 *
 * @param {string} groupId - The group's id
 * @returns {Promise<Object>} - API response containing that group's contacts
 */
export const getContactGroupContacts = async (groupId) => {
  try {
    const res = await api.get("/getContactGroupContacts", {
      params: { groupId },
    });
    return res.data;
  } catch (error) {
    console.error("getContactGroupContacts API Error:", error?.response || error);
    throw error;
  }
};
