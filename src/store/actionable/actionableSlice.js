import { createSlice } from "@reduxjs/toolkit";
import {
  fetchActionables,
  toggleActionable,
  fetchComments,
  removeActionable,
} from "./actionableThunks";

const initialState = {
  items: [],
  loading: false,
  deletingId: null, 
  error: null,

  page: 1,
  limit: 10,
  total: 0,

  activeTab: null,
  search: "",
};

const actionableSlice = createSlice({
  name: "actionable",
  initialState,
  reducers: {
    setPage(state, action) {
      state.page = action.payload;
    },
    setSearch(state, action) {
      state.search = action.payload;
      state.page = 1;
    },
    setActiveTab(state, action) {
      state.activeTab = action.payload;
      state.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      /* FETCH ACTIONABLES */
      .addCase(fetchActionables.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActionables.fulfilled, (state, action) => {
        console.log(action)
        state.loading = false;
        state.items = action.payload.list;
        state.total = action.payload.total;
      })
      .addCase(fetchActionables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    .addCase(toggleActionable.fulfilled, (state, action) => {
    const { actionableId, isCompleted } = action.payload;

    if (state.activeTab === "all" && isCompleted) {
        state.items = state.items.filter(
        (i) => i.actionableId !== actionableId
        );
        return;
    }
    if (state.activeTab === "today" && isCompleted) {
        state.items = state.items.filter(
        (i) => i.actionableId !== actionableId
        );
        return;
    }

    if (state.activeTab === "past" && !isCompleted) {
        state.items = state.items.filter(
        (i) => i.actionableId !== actionableId
        );
        return;
    }

    const item = state.items.find(
        (i) => i.actionableId === actionableId
    );
    if (item) {
        item.isCompleted = isCompleted;
    }
    })

      /* COMMENTS */
      .addCase(fetchComments.fulfilled, (state, action) => {
        const item = state.items.find(
          (i) => i.actionableId === action.payload.actionableId
        );
        if (item) {
          item.comments = action.payload.comments;
        }
      })
      .addCase(removeActionable.pending, (state, action) => {
        state.deletingId = action.meta.arg.actionableId;
      })

      .addCase(removeActionable.fulfilled, (state, action) => {
        const { actionableId } = action.payload;
        console.log(actionableId)
        state.items = state.items.filter(
          (i) => i.actionableId !== actionableId
        );
        state.deletingId = null;
      })

      .addCase(removeActionable.rejected, (state, action) => {
        state.deletingId = null;
        state.error = action.payload;
      })
  },
});

export const { setPage, setSearch, setActiveTab } = actionableSlice.actions;
export default actionableSlice.reducer;
