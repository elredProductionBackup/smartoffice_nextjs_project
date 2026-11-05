// Profile photo (DP) rules shared by My Profile and User Management.
// The API accepts only PNG / JPG / JPEG.
export const PHOTO_ACCEPT = ".png,.jpg,.jpeg,image/png,image/jpeg";
export const MAX_PHOTO_MB = 5;

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const ALLOWED_EXT = /\.(png|jpe?g)$/i;

// Returns an error message, or "" when the file is fine.
// Checks both MIME type and extension: some browsers leave file.type empty,
// and a renamed file can carry a misleading one.
export const validateProfilePhoto = (file) => {
  if (!file) return "Choose a photo.";
  const typeOk = !file.type || ALLOWED_TYPES.includes(file.type.toLowerCase());
  if (!typeOk || !ALLOWED_EXT.test(file.name || "")) return "Only PNG, JPG or JPEG images are allowed.";
  if (file.size > MAX_PHOTO_MB * 1024 * 1024) return `Photo must be under ${MAX_PHOTO_MB} MB.`;
  return "";
};
