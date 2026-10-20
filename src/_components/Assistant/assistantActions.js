import { getActionables } from "@/services/actionable.service";
import {
  createActionable,
  toggleActionable,
  changeDueDateTime,
  updateActionable,
  removeActionable,
  createSubTask,
  updateSubTask,
  removeSubTask,
  createComment,
} from "@/store/actionable/actionableThunks";

const clusterCode = () => localStorage.getItem("networkClusterCode");

/** Browser `ops` for runCall: go through the Redux thunks so the Actionable page updates live. */
export const clientOps = (dispatch, user) => {
  const run = (thunk) => dispatch(thunk).unwrap();
  return {
    list: async (dueSearchKey, search) => {
      const res = await getActionables({ networkClusterCode: clusterCode(), dueSearchKey, search, offset: 10 });
      if (res.data?.success === false) throw new Error(res.data.message || "Failed to load actionables");
      return res.data?.result || [];
    },
    create: (fields) => {
      const tempId = `temp-${Date.now()}`;
      return run(
        createActionable({
          tempId,
          actionableId: tempId,
          networkClusterCode: clusterCode(),
          isCompleted: false,
          category: "all",
          linkedEvent: [],
          ...fields,
        })
      );
    },
    setCompleted: (item, isCompleted) => run(toggleActionable({ actionableId: item.actionableId, isCompleted })),
    setDue: (item, dueDate) => run(changeDueDateTime({ actionableId: item.actionableId, dueDate })),
    update: (item, { title, notes }) =>
      run(updateActionable({ actionableId: item.actionableId, title, notes, collaborators: item.collaborators || [] })),
    remove: (item) => run(removeActionable({ actionableId: item.actionableId, networkClusterCode: clusterCode() })),
    addSubtask: (item, title) =>
      run(createSubTask({ tempId: `temp-sub-${Date.now()}`, actionableId: item.actionableId, title })),
    setSubtaskCompleted: (item, sub, isCompleted) =>
      run(updateSubTask({ _id: sub._id, actionableId: item.actionableId, title: sub.title, isCompleted })),
    removeSubtask: (item, sub) => run(removeSubTask({ actionableId: item.actionableId, subTaskId: sub._id })),
    comment: (item, comment) =>
      run(createComment({ tempId: `temp-comment-${Date.now()}`, actionableId: item.actionableId, comment, user })),
  };
};
