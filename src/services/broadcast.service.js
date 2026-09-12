import api from "@/services/axios";

/**
 * Send a bulk WhatsApp/Email broadcast using a template.
 *
 * POST /sendBulkBroadcastMessage
 *
 * @param {Object} payload
 * @param {"whatsapp"|"email"} payload.messageType
 * @param {string} payload.templateName - e.g. "prive_workshop_registration_confirmation" | "prive_media"
 * @param {Array<{name: string, phone: string}>} payload.contacts - Recipients
 * @param {Object} [payload.templateVariables] - e.g. { workshopName, workshopDate, sessionTime, arrivalTime, venue }
 * @param {File|string} [payload.mediaFile] - Optional media attachment
 * @param {string} [payload.htmlTemplate] - Optional custom HTML body (email)
 * @param {string} [payload.subject] - Optional email subject
 * @returns {Promise<Object>}
 */
export const sendBulkBroadcastMessage = async ({
  messageType,
  templateName,
  contacts = [],
  templateVariables = {},
  mediaFile = "",
  htmlTemplate = "",
  subject = "",
}) => {
  try {
    const formData = new FormData();
    formData.append("messageType", messageType);
    formData.append("templateName", templateName);
    formData.append("contacts", JSON.stringify(contacts));
    formData.append("templateVariables", JSON.stringify(templateVariables));
    if (mediaFile instanceof File) {
      formData.append("mediaFile", mediaFile);
    } else if (mediaFile) {
      formData.append("mediaFile", mediaFile);
    }
    formData.append("htmlTemplate", htmlTemplate);
    formData.append("subject", subject);

    const res = await api.post("/sendBulkBroadcastMessage", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    console.error("sendBulkBroadcastMessage API Error:", error?.response || error);
    throw error;
  }
};
