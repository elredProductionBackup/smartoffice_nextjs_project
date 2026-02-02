import moment from "moment";

const isEmpty = (v) => !v || !v.trim();
const isLengthValid = (v, min, max) => {
  const len = v.trim().length;
  return len >= min && len <= max;
};

const isValidURL = (url) => {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const isValidImageFile = (file) => {
  if (!(file instanceof File)) return false;
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  return allowed.includes(file.type) && file.size <= 10 * 1024 * 1024;
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

  // ---------------- IMAGE ----------------
  if (form.image?.file && !isValidImageFile(form.image.file))
    errors.image = "Image must be JPG/PNG and under 10MB";

  // ---------------- DATES ----------------
  if (moment(form.startDate).isBefore(now))
    errors.startDate = "Start time cannot be in the past";

  if (moment(form.endDate).isSameOrBefore(form.startDate))
    errors.endDate = "End time must be after start time";

  // ---------------- SPEAKER / RESOURCE ----------------
  // if (form.speaker) {
  //   const speakerErrors = {};

  //   let nameError = "";
  //   let descError = "";

  //   if (isEmpty(form.speaker.name)) {
  //     nameError = "Resource name is required";
  //   } else if (!isLengthValid(form.speaker.name, 3, 200)) {
  //     nameError = "Resource name must be 3–200 characters";
  //   }

  //   if (isEmpty(form.speaker.description)) {
  //     descError = "Resource description is required";
  //   } else if (!isLengthValid(form.speaker.description, 5, 400)) {
  //     descError = "Resource description must be 5–400 characters";
  //   }

  //   if (nameError && descError) {
  //     speakerErrors.main = `${nameError} & ${descError}`;
  //   } else {
  //     speakerErrors.main = nameError || descError;
  //   }

  //   if (form.speaker.weblinks?.length) {
  //     speakerErrors.weblinks = form.speaker.weblinks.map((link) => {
  //       if (isEmpty(link)) return "Link is required";
  //       if (!isLengthValid(link, 3, 200))
  //         return "Link must be 3–200 characters";
  //       if (!isValidURL(link))
  //         return "Enter a valid URL (https://example.com)";
  //       return null;
  //     });
  //   }

  //   errors.speaker = speakerErrors;
  // }
  // ---------------- ADDITIONAL NOTES (optional field) ----------------
  if (form.additionalNote) {
    if (!isLengthValid(form.additionalNote, 5, 400))
      errors.additionalNote = "Additional notes must be 5–400 characters";
  }

  console.log(errors)

  return errors;
};