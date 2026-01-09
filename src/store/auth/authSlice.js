import { createSlice } from "@reduxjs/toolkit";

const getInitialState = () => {
  if (typeof window === "undefined") {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
    };
  }

  try {
    const user = JSON.parse(localStorage.getItem("networkData"));
    const token = localStorage.getItem("token");

    return {
      user: user ?? null,
      token: token ?? null,
      isAuthenticated: !!token,
    };
  } catch {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
    };
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
  reducers: {
    setAuth(state, action) {
      const user = action.payload;

      state.user = user;
      state.token = user.token;
      state.isAuthenticated = true;

      localStorage.setItem("networkData", JSON.stringify(user));
      localStorage.setItem("token", user.token);
      localStorage.setItem("networkClusterCode", user.networkClusterCode);
    },

    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      localStorage.removeItem("networkData");
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
    },
  },
});

export const { setAuth, logout } = authSlice.actions;
export default authSlice.reducer;
