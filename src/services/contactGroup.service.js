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
    const res = await api.patch(
      "/createContactGroup",
      { groupId, name, contacts },
      // The API answers validation errors (e.g. "contacts[0].phone is required")
      // with `isAuth: false`, which would log the user out — show the error instead.
      { skipAuthRedirect: true }
    );
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

const GROUP_CONTACTS_PAGE_SIZE = 500;
const GROUP_CONTACTS_MAX_PAGES = 50;

const listOf = (data) => (Array.isArray(data?.result) ? data.result : Array.isArray(data) ? data : []);

const fetchGroupContactsPage = async (groupId, start, offset) => {
  const res = await api.get("/getContactGroupContacts", { params: { groupId, start, offset } });
  return res.data;
};

// Whether the server applies our `offset` (page size). Checked once per session:
// if it ignores it, it silently caps the list (20 by default) and we can't get every contact.
let pageSizeHonored = null;
let largestCappedList = 0;
let pageSizeCheck = null;

/**
 * Fetch ALL contacts belonging to a single contact group.
 *
 * GET /getContactGroupContacts?groupId=...&start=...&offset=...
 *
 * The endpoint is paged like the rest of this API (`start` = rows to skip,
 * `offset` = page size). Called without paging it returns only the first 20.
 * This walks every page.
 *
 * @param {string} groupId - The group's id
 * @returns {Promise<Object>} - { ...first page response, result: every contact, complete }
 *   `complete` is false when the server ignored paging, so `result` may be cut short.
 */
export const getContactGroupContacts = async (groupId) => {
  try {
    const all = [];
    const seen = new Set();
    let firstPage = null;

    for (let page = 0; page < GROUP_CONTACTS_MAX_PAGES; page++) {
      const data = await fetchGroupContactsPage(groupId, page * GROUP_CONTACTS_PAGE_SIZE, GROUP_CONTACTS_PAGE_SIZE);
      if (!firstPage) firstPage = data;
      if (data?.success === false) return data;

      const list = listOf(data);
      let added = 0;
      list.forEach((c) => {
        const key = c.phone || c.email || c.name;
        if (seen.has(key)) return;
        seen.add(key);
        all.push(c);
        added++;
      });

      const total = Number(data?.totalCount ?? data?.total ?? data?.count);
      // Stop on a short page, a page with nothing new (server ignores `start`), or once the total is reached
      if (list.length < GROUP_CONTACTS_PAGE_SIZE || added === 0 || (total > 0 && all.length >= total)) break;
    }

    // A short first page is either the whole group or a server-side cap. Ask
    // for a page of 1: more than 1 back means the server ignores our page size.
    // Shared promise so groups loading at the same time don't each send the check.
    if (pageSizeHonored === null && all.length > 1) {
      pageSizeCheck ||= fetchGroupContactsPage(groupId, 0, 1)
        .then((probe) => {
          if (probe?.success !== false) pageSizeHonored = listOf(probe).length <= 1;
        })
        .catch(() => {})
        .finally(() => {
          pageSizeCheck = null;
        });
      await pageSizeCheck;
    }
    // If the server ignores our page size it caps every list at the same size, so
    // a group smaller than the biggest list seen so far can't have been cut off.
    if (pageSizeHonored === false) largestCappedList = Math.max(largestCappedList, all.length);
    const complete = pageSizeHonored !== false || all.length < largestCappedList;
    if (!complete) {
      console.warn(
        `getContactGroupContacts ignores start/offset — group ${groupId} may have more than the ${all.length} contacts returned.`
      );
    }

    return { ...(Array.isArray(firstPage) ? {} : firstPage), result: all, complete };
  } catch (error) {
    console.error("getContactGroupContacts API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Delete a contact group along with all of its contacts.
 *
 * DELETE /deleteContactGroup
 * Body: { groupId: string }
 *
 * @param {string} groupId - The group's id
 * @returns {Promise<Object>}
 */
export const deleteContactGroup = async (groupId) => {
  try {
    const res = await api.delete("/deleteContactGroup", {
      data: { groupId },
    });

    // Axios's validateStatus accepts every status below 600 — check failures
    // explicitly so callers can rely on a thrown error to mean "not deleted."
    if (res.status >= 400 || res.data?.success === false) {
      const err = new Error(res.data?.message || "Failed to delete group");
      err.response = { status: res.status, data: res.data };
      throw err;
    }

    return res.data;
  } catch (error) {
    console.error("deleteContactGroup API Error:", error?.response || error);
    throw error;
  }
};

/**
 * Delete one or more contacts from a contact group.
 *
 * DELETE /deleteContactGroupContacts
 * Body: { groupId: string, contacts: [{ phone: string }] }
 *
 * @param {Object} payload
 * @param {string} payload.groupId - The group's id
 * @param {Array<{phone: string}>} payload.contacts - Contacts to remove, identified by phone
 * @returns {Promise<Object>}
 */
export const deleteContactGroupContacts = async ({ groupId, contacts }) => {
  try {
    const res = await api.delete("/deleteContactGroupContacts", {
      data: { groupId, contacts },
    });

    // Axios's validateStatus accepts every status below 600, so a failed
    // delete (4xx/5xx, or a 200 carrying { success: false }) resolves here
    // instead of throwing — check both explicitly so callers can rely on a
    // thrown error to mean "nothing was deleted."
    if (res.status >= 400 || res.data?.success === false) {
      const err = new Error(res.data?.message || "Failed to delete contact");
      err.response = { status: res.status, data: res.data };
      throw err;
    }

    return res.data;
  } catch (error) {
    console.error("deleteContactGroupContacts API Error:", error?.response || error);
    throw error;
  }
};
