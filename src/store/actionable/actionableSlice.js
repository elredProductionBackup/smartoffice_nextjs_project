import { createSlice } from "@reduxjs/toolkit";
import { fetchActionables, toggleActionable, fetchComments, removeActionable, createActionable, changeDueDateTime, removeSubTask, createSubTask, updateSubTask, updateActionable, fetchCollaborators, createComment, removeComment,createAttachment,updateAttachment,removeAttachment } from "./actionableThunks";
import moment from "moment";

const initialState = {
  items: [],
  loading: true,
  creating: false,
  deletingId: null,
  error: null,

  page: 1,
  limit: 10,
  total: 0,

  activeTab: null,
  collaboratorsList:[],
  collaboratorsLoading:false,
  search: "",
  comments: {
    byActionableId: {},
  },
};

const getAuthorName = () => {
  try {
    const data = JSON.parse(localStorage.getItem("networkData"));
    return data?.firstname || "Unknown";
  } catch {
    return "Unknown";
  }
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
        state.loading = false;
        console.log(action.payload.list)
        // Fallback filter to ensure event-checklist tasks are hidden even if API filter fails
        const filteredList = action.payload.list.filter(
          (item) => !item.category || item.category === "all"
        );
        state.items = filteredList;
        // If we filtered locally, we should adjust total accordingly for the current view
        state.total = filteredList.length < action.payload.list.length 
          ? filteredList.length 
          : action.payload.total;
      })
      .addCase(fetchActionables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      /* TOGGLE ACTIONABLES */
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

      .addCase(toggleActionable.rejected, (state, action) => {
        state.error = action.payload;
      })
      /* CHANGE DUE DATE TIME */
      .addCase(changeDueDateTime.fulfilled, (state, action) => {
        const {
          actionableId,
          dueDateTimeStamp,
          dueDate,
          dueTime,
        } = action.payload;

        const itemIndex = state.items.findIndex(
          (i) => i.actionableId === actionableId
        );

        if (itemIndex === -1) return;

        const item = state.items[itemIndex];

        item.dueDateTimeStamp = dueDateTimeStamp;
        item.dueDate = dueDate;
        item.dueTime = dueTime;

        if (state.activeTab === "today") {
          const today = moment().utc().format("DD MMM YYYY");

          if (dueDate !== today) {
            state.items.splice(itemIndex, 1);
          }
        }
      })

      .addCase(changeDueDateTime.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(createActionable.pending, (state, action) => {
        const tempItem = {
          ...action.meta.arg,
          actionableId: action.meta.arg.tempId,
          isOptimistic: true,
        };

        if (state.page === 1) {
          state.items.unshift(tempItem);

          if (state.items.length > state.limit) {
            state.items.pop();
          }
        }

        state.total += 1;
      })

      .addCase(createActionable.fulfilled, (state, action) => {
        const { item, tempId } = action.payload;

        if (!item || !tempId) return;

        const index = state.items.findIndex(
          (i) => i && i.actionableId === tempId
        );

        if (index !== -1) {
          state.items[index] = item;
        }
      })

      .addCase(createActionable.rejected, (state, action) => {
        const tempId = action.payload?.tempId;

        if (tempId) {
          state.items = state.items.filter(
            (i) => i && i.actionableId !== tempId
          );
          state.total -= 1;
        }

        state.error = action.payload?.message;
      })
      // UPDATE ACTIONABLE
      .addCase(updateActionable.fulfilled, (state, action) => {
        const {
          actionableId,
          title,
          notes,
          collaborators,
        } = action.payload;

        const item = state.items.find(
          (i) => i.actionableId === actionableId
        );

        if (!item) return;

        if (title !== undefined) item.title = title;
        if (notes !== undefined) item.notes = notes;
        if (collaborators !== undefined)
          item.collaborators = collaborators;
      })
      .addCase(updateActionable.rejected, (state, action) => {
        state.error = action.payload;
      })
      /* REMOVE ACTIONABLE */
      .addCase(removeActionable.pending, (state, action) => {
        state.deletingId = action.meta.arg.actionableId;
      })
      .addCase(removeActionable.fulfilled, (state, action) => {
        const { actionableId } = action.payload;

        state.items = state.items.filter(
          (i) => i.actionableId !== actionableId
        );

        state.total -= 1;
        state.deletingId = null;

        if (state.items.length === 0 && state.page > 1) {
          state.page -= 1;
        }
      })
      .addCase(removeActionable.rejected, (state, action) => {
        state.deletingId = null;
        state.error = action.payload;
      })
      // Subtask
      .addCase(createSubTask.pending, (state, action) => {
        const { tempId, actionableId, title } = action.meta.arg;

        const parent = state.items.find(
          (i) => i.actionableId === actionableId
        );
        if (!parent) return;

        if (!parent.subTask) parent.subTask = [];

        parent.subTask.unshift({
          _id: tempId,
          clientId: tempId,  
          title,
          isCompleted: false,
          isOptimistic: true,
        });

        parent.subTaskCount = (parent.subTaskCount || 0) + 1;
      })
      .addCase(createSubTask.fulfilled, (state, action) => {
        const { actionableId, subTask, tempId } = action.payload;

        const parent = state.items.find(
          (i) => i.actionableId === actionableId
        );
        if (!parent) return;

        const index = parent.subTask.findIndex(
          (s) => s.clientId === tempId
        );

        if (index !== -1) {
          parent.subTask[index] = {
            ...subTask,
            clientId: tempId,
            isOptimistic: false,
          };
        }
      })
      .addCase(createSubTask.rejected, (state, action) => {
        const { actionableId, tempId } = action.payload || {};
        const parent = state.items.find(
          (i) => i.actionableId === actionableId
        );
        if (!parent) return;

        parent.subTask = parent.subTask.filter(
          (s) => s.clientId !== tempId
        );

        parent.subTaskCount = Math.max(
          (parent.subTaskCount || 1) - 1,
          0
        );
      })
      .addCase(updateSubTask.pending, (state, action) => {
        const { actionableId, _id, title, isCompleted } =
          action.meta.arg;

        const parent = state.items.find(
          (i) => i.actionableId === actionableId
        );
        if (!parent) return;

        const sub = parent.subTask.find((s) => s._id === _id);
        if (!sub) return;

        sub._previous = {
          title: sub.title,
          isCompleted: sub.isCompleted,
        };

        if (title !== undefined) sub.title = title;
        if (isCompleted !== undefined) sub.isCompleted = isCompleted;
      })
      .addCase(updateSubTask.fulfilled, (state, action) => {
        const { actionableId, subTask } = action.payload;

        const parent = state.items.find(
          (i) => i.actionableId === actionableId
        );
        if (!parent) return;

        const index = parent.subTask.findIndex(
          (s) => s._id === subTask._id
        );

        if (index !== -1) {
          parent.subTask[index] = {
            ...parent.subTask[index],
            ...subTask,
          };
        }
      })
      .addCase(updateSubTask.rejected, (state, action) => {
        const { actionableId, subTaskId } = action.payload || {};

        const parent = state.items.find(
          (i) => i.actionableId === actionableId
        );
        if (!parent) return;

        const sub = parent.subTask.find((s) => s._id === subTaskId);
        if (!sub || !sub._previous) return;

        sub.title = sub._previous.title;
        sub.isCompleted = sub._previous.isCompleted;
        delete sub._previous;
      })
      .addCase(removeSubTask.fulfilled, (state, action) => {
        const { actionableId, subTaskId } = action.payload;

        const parent = state.items.find(
          (i) => i.actionableId === actionableId
        );
        if (!parent || !parent.subTask) return;

        parent.subTask = parent.subTask.filter(
          (s) => s._id !== subTaskId
        );

        parent.subTaskCount = Math.max(
          (parent.subTaskCount || 1) - 1,
          0
        );
      })

      // ATTACHMENTS
      .addCase(createAttachment.pending, (state, action) => {
        const { tempId, actionableId, url } = action.meta.arg;

        const parent = state.items.find(
          (i) => i.actionableId === actionableId
        );

        if (!parent) return;

        if (!parent.attachments) parent.attachments = [];

        parent.attachments.unshift({
          _id: tempId,
          clientId: tempId,
          url,
          isOptimistic: true,
        });

        parent.attachmentCount = (parent.attachmentCount || 0) + 1;
      })

      .addCase(createAttachment.fulfilled, (state, action) => {
        const { actionableId, attachment, tempId } = action.payload;

        const parent = state.items.find(
          (i) => i.actionableId === actionableId
        );

        if (!parent) return;

        const index = parent.attachments.findIndex(
          (a) => a.clientId === tempId
        );

        if (index !== -1) {
          parent.attachments[index] = {
            ...attachment,
            clientId: tempId,
            isOptimistic: false,
          };
        }
      })

      .addCase(createAttachment.rejected, (state, action) => {
        const { actionableId, tempId } = action.payload || {};

        const parent = state.items.find(
          (i) => i.actionableId === actionableId
        );

        if (!parent) return;

        parent.attachments = parent.attachments.filter(
          (a) => a.clientId !== tempId
        );

        parent.attachmentCount = Math.max(
          (parent.attachmentCount || 1) - 1,
          0
        );
      })

      .addCase(updateAttachment.pending, (state, action) => {
        const { actionableId, _id, url } = action.meta.arg;

        const parent = state.items.find(
          (i) => i.actionableId === actionableId
        );

        if (!parent) return;

        const attachment = parent.attachments.find(
          (a) => a._id === _id
        );

        if (!attachment) return;

        attachment._previous = {
          url: attachment.url,
        };

        if (url !== undefined) {
          attachment.url = url;
        }
      })

      .addCase(updateAttachment.fulfilled, (state, action) => {
        const { actionableId, attachment } = action.payload;

        const parent = state.items.find(
          (i) => i.actionableId === actionableId
        );

        if (!parent) return;

        const index = parent.attachments.findIndex(
          (a) => a._id === attachment._id
        );

        if (index !== -1) {
          parent.attachments[index] = {
            ...parent.attachments[index],
            ...attachment,
          };
        }
      })

      .addCase(updateAttachment.rejected, (state, action) => {
        const { actionableId, attachmentId } = action.payload || {};

        const parent = state.items.find(
          (i) => i.actionableId === actionableId
        );

        if (!parent) return;

        const attachment = parent.attachments.find(
          (a) => a._id === attachmentId
        );

        if (!attachment || !attachment._previous) return;

        attachment.url = attachment._previous.url;

        delete attachment._previous;
      })

      .addCase(removeAttachment.fulfilled, (state, action) => {
        const { actionableId, attachmentId } = action.payload;

        const parent = state.items.find(
          (i) => i.actionableId === actionableId
        );

        if (!parent || !parent.attachments) return;

        parent.attachments = parent.attachments.filter(
          (a) => a._id !== attachmentId
        );

        parent.attachmentCount = Math.max(
          (parent.attachmentCount || 1) - 1,
          0
        );
      })

      // Collaborators 
      .addCase(fetchCollaborators.pending, (state, action) => {
          state.collaboratorsLoading = true;
        })

        .addCase(fetchCollaborators.fulfilled, (state, action) => {
          state.collaboratorsLoading = false;
          state.collaboratorsList = action.payload || [];
        })

        .addCase(fetchCollaborators.rejected, (state, action) => {
          state.collaboratorsLoading = false;
        })
        // --- Optimistic Comment Creation ---
        .addCase(createComment.pending, (state, action) => {
          const { tempId, actionableId, comment } = action.meta.arg;

          if (!state.comments.byActionableId[actionableId]) {
            state.comments.byActionableId[actionableId] = {
              list: [],
              page: 0,
              total: 0,
              hasMore: true,
              loading: false,
            };
          }

          const store = state.comments.byActionableId[actionableId];

          store.list.unshift({
            _id: tempId,
            clientId: tempId,
            comment,
            name: getAuthorName(), 
            createdAt: new Date().toISOString(),
            isCompleted: false,
            isOptimistic: true,
          });

          store.total += 1;
        })
        .addCase(createComment.fulfilled, (state, action) => {
          const { actionableId, comment, tempId } = action.payload;

          const store = state.comments.byActionableId[actionableId];
          if (!store) return;

          const index = store.list.findIndex((c) => c.clientId === tempId);

          if (index !== -1) {
            store.list[index] = {
              ...comment,
              clientId: tempId,
              isOptimistic: false,
            };
          }
        })
        .addCase(createComment.rejected, (state, action) => {
          const { actionableId, tempId } = action.payload || {};
          const store = state.comments.byActionableId[actionableId];
          if (!store) return;

          store.list = store.list.filter((c) => c.clientId !== tempId);

          store.total = Math.max(store.total - 1, 0);
        })
        .addCase(removeComment.pending, (state, action) => {
          const { actionableId, commentId } = action.meta.arg;

          const store = state.comments.byActionableId[actionableId];
          if (!store || !store.list) return;

          const index = store.list.findIndex((c) => c._id === commentId || c.clientId === commentId);

          if (index !== -1) {
            store._removedComment = store.list[index];
            store.list.splice(index, 1);

            store.total = Math.max(store.total - 1, 0);
          }
        })
        .addCase(removeComment.fulfilled, (state) => {
        })
        .addCase(removeComment.rejected, (state, action) => {
          const { actionableId } = action.payload || {};
          const store = state.comments.byActionableId[actionableId];
          if (!store || !store._removedComment) return;

          store.list.unshift(store._removedComment);
          store.total += 1;

          delete store._removedComment;
        })
        // --- Fetch Comments ---
        .addCase(fetchComments.pending, (state, action) => {
          const { actionableId } = action.meta.arg;

          if (!state.comments.byActionableId[actionableId]) {
            state.comments.byActionableId[actionableId] = {
              list: [],
              page: 0,
              total: 0,
              hasMore: true,
              loading: true,
            };
          } else {
            if (state.comments.byActionableId[actionableId].loading) return;
            state.comments.byActionableId[actionableId].loading = true;
          }
        })
        .addCase(fetchComments.fulfilled, (state, action) => {
          const { actionableId, comments, page, total } = action.payload;
          const store = state.comments.byActionableId[actionableId];

          if (!store) return;

          if (page === 1) {
            store.list = comments; 
          } else {
            const existingIds = new Set(store.list.map(c => c._id));
            const newComments = comments.filter(c => !existingIds.has(c._id));
            store.list.push(...newComments);
          }

          store.page = page;
          store.total = total;

          store.hasMore = store.list.length < total;

          store.loading = false;
        })
        .addCase(fetchComments.rejected, (state, action) => {
          const { actionableId } = action.meta.arg;
          if (state.comments.byActionableId[actionableId]) {
            state.comments.byActionableId[actionableId].loading = false;
          }
        });


  },
});

export const { setPage, setSearch, setActiveTab, addSubTaskOptimistic, updateSubTaskOptimistic, removeSubTaskOptimistic } = actionableSlice.actions;
export default actionableSlice.reducer;
