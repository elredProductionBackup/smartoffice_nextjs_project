import moment from "moment";

const isEmpty = (v) => !v || !v.trim();
const isLengthValid = (v, min, max) => {
  const len = v.trim().length;
  return len >= min && len <= max;
};

export const isValidURL = (url) => {
  const trimmed = url.trim();

  const clean = trimmed.replace(/^https?:\/\//, "");
  const regex = /^(localhost|\d{1,3}(\.\d{1,3}){3}|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(\/.*)?$/;

  return regex.test(clean);
};

export const isValidImageFile = (file) => {
  if (!(file instanceof File)) {
    console.log("Not a File instance:", file);
    return { valid: false, reason: "type" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  const maxSize = 2 * 1024 * 1024; 

  console.log("File type:", file.type);
  console.log("File size (bytes):", file.size);
  console.log("Max allowed size (bytes):", maxSize);

  if (!allowedTypes.includes(file.type)) {
    console.log("Invalid file type");
    return { valid: false, reason: "type" };
  }

  if (file.size > maxSize) {
    console.log("File is too large");
    return { valid: false, reason: "size" };
  }

  return { valid: true, reason: null };
};

export const validateEvent = (form) => {
  const errors = {};
  const now = moment();

  // ---------------- EVENT NAME ----------------
  if (isEmpty(form.eventName)) {
    errors.eventName = "Event name is required";
  } else if (!isLengthValid(form.eventName, 3, 200)) {
    errors.eventName = "Event name must be 3–200 characters";
  }

  // ---------------- EVENT TYPE ----------------
  if (!form.eventType?.type)
    errors.eventType = "Select event type";

  // ---------------- DESCRIPTION ----------------
  if (isEmpty(form.description)) {
    errors.description = "Description is required";
  } else if (!isLengthValid(form.description, 5, 400)) {
    errors.description = "Description must be 5–400 characters";
  }

  // ---------------- LOCATION ----------------
  if (isEmpty(form.location)) {
    errors.location = "Location is required";
  } else if (!isLengthValid(form.location, 3, 200)) {
    errors.location = "Location must be 3–200 characters";
  }

  // ---------------- DATES ----------------
  if (moment(form.startDate).isBefore(now))
    errors.startDate = "Start time cannot be in the past";

  if (moment(form.endDate).isSameOrBefore(form.startDate))
    errors.endDate = "End time must be after start time";

  // ---------------- SPEAKER / RESOURCE ----------------
  if (form.speaker) {
    const speakerErrors = {};

    let nameError = "";
    let descError = "";

    // ---- NAME ----
    if (form.speaker.name) {
      if (!isLengthValid(form.speaker.name, 3, 200)) {
        nameError = "Resource name must be 3–200 characters";
      }
    }

    // ---- DESCRIPTION ----
    if (form.speaker.description) {
      if (!isLengthValid(form.speaker.description, 5, 400)) {
        descError = "Resource description must be 5–400 characters";
      }
    }

    // ---- COMBINED MESSAGE ----
    if (nameError && descError) {
      speakerErrors.main = `${nameError} & ${descError}`;
    } else if (nameError || descError) {
      speakerErrors.main = nameError || descError;
    }

    // ---- WEBLINKS ----
    if (form.speaker.weblinks?.length) {
      const weblinkErrors = form.speaker.weblinks.map((link) => {
        if (isEmpty(link)) return "Link is not valid";
        if (!isLengthValid(link, 3, 200))
          return "Link must be 3–200 characters";
        if (!isValidURL(link))
          return "Enter a valid URL (https://example.com)";
        return null;
      });

      if (weblinkErrors.some(Boolean)) {
        speakerErrors.weblinks = weblinkErrors;
      }
    }

    if (Object.keys(speakerErrors).length > 0) {
      errors.speaker = speakerErrors;
    }
  }
  // ---------------- ADDITIONAL NOTES ----------------
  if (form.additionalNote) {
    if (!isLengthValid(form.additionalNote, 5, 400))
      errors.additionalNote = "Additional notes must be 5–400 characters";
  }

  return errors;
};

export const clearFieldError = (setErrors,field) => {
  setErrors((prev) => {
    const updated = { ...prev };
    delete updated[field];
    return updated;
  });
};