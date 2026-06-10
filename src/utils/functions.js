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

export const formatText = (text = "") => {
  if (!text) return null;

  const lines = text
    .replace(/\\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line, i) => {
    const isBullet =
      line.startsWith("●") ||
      line.startsWith("-") ||
      line.startsWith("*");

    const isNumbered = /^\d+\./.test(line);

    if (isBullet) {
      return (
        <li
          key={i}
          className="list-disc ml-[30px]  text-left"
        >
          {line.replace(/^[●*\-]\s?/, "")}
        </li>
      );
    }

    if (isNumbered) {
      return (
        <li
          key={i}
          className="list-decimal ml-[30px]  text-left"
        >
          {line.replace(/^\d+\.\s?/, "")}
        </li>
      );
    }

    return (
      <p
        key={i}
        className="mb-1 text-left"
      >
        {line}
      </p>
    );
  });
};