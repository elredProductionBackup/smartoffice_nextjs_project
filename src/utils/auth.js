export const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  };
  
  export const isLoggedIn = () => {
    return !!getToken();
  };
  
  export const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };
  