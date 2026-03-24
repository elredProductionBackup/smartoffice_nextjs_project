export const maskEmail = (email) => {
    if (!email || !email.includes("@")) return "";
  
    const [localPart, domain] = email.split("@");
  
    if (localPart.length <= 2) {
      return `${localPart[0] || ""}***@${domain}`;
    }
  
    const visible = localPart.slice(0, 2);
    return `${visible}***@${domain}`;
  };
  

 export const isValidImage = (src) => {
  return (
    typeof src === "string" &&
    src.trim() !== "" &&
    src !== "null" &&
    (src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("/"))
  );
};