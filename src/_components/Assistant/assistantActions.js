import { createActionable } from "@/store/actionable/actionableThunks";

/** Browser `create` for createFromCall: goes through the Redux thunk so the Actionable page updates live. */
export const clientCreate = (dispatch) => (fields) => {
  const tempId = `temp-${Date.now()}`;
  return dispatch(
    createActionable({
      tempId,
      actionableId: tempId,
      networkClusterCode: localStorage.getItem("networkClusterCode"),
      isCompleted: false,
      category: "all",
      linkedEvent: [],
      ...fields,
    })
  ).unwrap();
};
