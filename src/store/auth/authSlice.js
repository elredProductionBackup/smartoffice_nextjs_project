import { createSlice } from "@reduxjs/toolkit";

const getInitialState = () => {
  if (typeof window === "undefined") {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      adminDetail: null,
      selectedRole: null,
    };
  }

  try {
    const user = JSON.parse(localStorage.getItem("networkData"));
    const token = localStorage.getItem("token");
    const adminDetail = JSON.parse(localStorage.getItem("adminDetail"));

    return {
      user: user ?? null,
      token: token ?? null,
      isAuthenticated: !!token,
      adminDetail: adminDetail ?? null,
      selectedRole: localStorage.getItem("selectedRole"),
    };
  } catch {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      adminDetail: null,
      selectedRole: null,
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
      localStorage.setItem("networkClusterCode", user.networkClusterDetails?.networkClusterCode);
    },

    setAdminDetail(state, action) {
      state.adminDetail = action.payload;

      localStorage.setItem("adminDetail", JSON.stringify(action.payload));
    },

    // Role picked on the role selection screen ("admin" | "financeOfficer" | "learningOfficer")
    setSelectedRole(state, action) {
      state.selectedRole = action.payload;

      localStorage.setItem("selectedRole", action.payload);
    },

    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.adminDetail = null;
      state.selectedRole = null;

      localStorage.removeItem("networkData");
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("networkClusterCode");
      localStorage.removeItem("adminDetail");
      localStorage.removeItem("selectedRole");
    },
  },
});

export const { setAuth, setAdminDetail, setSelectedRole, logout } = authSlice.actions;

export const selectIsAdminRole = (state) => state.auth.selectedRole === "admin";
export const selectIsFinanceOfficer = (state) => state.auth.selectedRole === "financeOfficer";
export const selectIsLearningOfficer = (state) => state.auth.selectedRole === "learningOfficer";
export default authSlice.reducer;
