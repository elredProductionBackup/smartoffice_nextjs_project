export const isValidEmail = (email) => {
    if (!email) return false;
  
    // Standard RFC-compliant (practical) regex
    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
    return emailRegex.test(email.trim());
  };
  