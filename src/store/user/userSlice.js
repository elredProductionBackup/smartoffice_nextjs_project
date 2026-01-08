import { createSlice } from "@reduxjs/toolkit";

/**
 * Safely read user from localStorage
 */
const getUserFromLocalStorage = () => {
  try {
    const data = localStorage.getItem("networkData");
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Failed to parse networkData", err);
    return null;
  }
};

const getTokenFromLocalStorage = () => {
  return localStorage.getItem("token");
};


const initialState = {
  user: getUserFromLocalStorage(), 
  isAuthenticated: !!getTokenFromLocalStorage(),
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;

      localStorage.setItem("networkData", JSON.stringify(action.payload));
    },

    updateUser(state, action) {
      state.user = {
        ...state.user,
        ...action.payload,
      };

      localStorage.setItem("networkData", JSON.stringify(state.user));
    },

    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("networkData");
    },
  },
});

export const { setUser, updateUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
