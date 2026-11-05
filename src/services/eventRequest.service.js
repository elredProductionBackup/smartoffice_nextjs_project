// Event requests: a portfolio officer proposes an event, an admin approves, rejects or asks for changes.
// Approval turns the request into a live event on the server (same fields as addEvents).
import api from "@/services/axios";

// Create and edit are multipart; the server rejects JSON.
// The shared axios instance defaults to application/json, and with that header axios turns FormData
// into JSON — so multipart is set explicitly. In the browser axios then drops it and lets the
// browser write the header with the boundary.
// Up to 7 files of 10 MB each, so uploads get longer than the default 15 s timeout.
const MULTIPART = { headers: { "Content-Type": "multipart/form-data" }, timeout: 120000 };

// Objects and arrays go in as JSON strings; files as-is
const toFormData = (fields) => {
  const fd = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value instanceof File) fd.append(key, value);
    else if (typeof value === "object") fd.append(key, JSON.stringify(value));
    else fd.append(key, String(value));
  });
  return fd;
};

/**
 * POST /smartOffice/eventRequest  (multipart, officer)
 * Required: eventName, eventType (budgetTypeId), eventDescription, startDateTime, endDateTime, eventImage (jpg/png)
 * Optional: timeZone, eventLocation, additionalNotes, eventBudget, point, attachmentsLink[], whoCanAttend{},
 *   isRegistration, reminder[], resourceName, resourceDescription, webLink[], uploadResourceImageUrl (file),
 *   collaborators[{userCode, points}], travelInfo{}, uploadDocument1..5 (files). 10 MB per file.
 */
export const createEventRequest = (fields) =>
  api.post("/smartOffice/eventRequest", toFormData(fields), MULTIPART);

/**
 * PATCH /smartOffice/eventRequest  (multipart, requester only)
 * eventRequestId + only the fields that changed. Also: removeDocuments=["uploadDocument2"], removeResourceImage=true.
 * Allowed while pending, changesRequested (moves to doneWithRequestedChanges) or doneWithRequestedChanges.
 */
export const updateEventRequest = ({ eventRequestId, ...fields }) =>
  api.patch("/smartOffice/eventRequest", toFormData({ eventRequestId, ...fields }), MULTIPART);

/** DELETE /smartOffice/eventRequest — soft delete by the requester (not allowed once approved) */
export const deleteEventRequest = ({ eventRequestId }) =>
  api.delete("/smartOffice/eventRequest", { data: { eventRequestId } });

/**
 * GET /smartOffice/eventRequest — admins get every request, officers only their own.
 * status: all | pending | changesRequested | doneWithRequestedChanges | approved | rejected
 * Response carries totalCount and statusCounts (for every status, whatever the filter).
 * Pass eventRequestId for one request.
 */
export const getEventRequests = ({ status = "all", searchKey = "", start = 0, offset = 10, eventRequestId } = {}) =>
  api.get("/smartOffice/eventRequest", {
    params: eventRequestId ? { eventRequestId } : { status, searchKey, start, offset },
  });

/**
 * PATCH /smartOffice/eventRequest/review  (admin only)
 * action: "approve" | "reject" (rejectionReason optional) | "requestChanges" (requestedChanges required, ≤ 2000)
 * Approve creates the live event; the response has eventId.
 */
export const reviewEventRequest = ({ eventRequestId, action, rejectionReason, requestedChanges }) =>
  api.patch("/smartOffice/eventRequest/review", {
    eventRequestId,
    action,
    ...(rejectionReason !== undefined && { rejectionReason }),
    ...(requestedChanges !== undefined && { requestedChanges }),
  });

/** GET /smartOffice/smartNetworkNotifications — the signed-in user's own notifications */
export const getNotifications = ({ isRead, start = 0, offset = 20 } = {}) =>
  api.get("/smartOffice/smartNetworkNotifications", {
    params: { start, offset, ...(isRead !== undefined && { isRead }) },
  });

/** PATCH /smartOffice/smartNetworkNotifications/read — one ({ notificationId }) or all ({ markAll: true }) */
export const markNotificationsRead = ({ notificationId, markAll } = {}) =>
  api.patch(
    "/smartOffice/smartNetworkNotifications/read",
    markAll ? { markAll: true } : { notificationId }
  );
