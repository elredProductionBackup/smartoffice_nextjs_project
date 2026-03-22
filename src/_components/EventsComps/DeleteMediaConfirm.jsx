"use client";
import { useDispatch } from "react-redux";
import { closeTopEventsModal } from "@/store/events/eventsUiSlice";
import { deleteMembersMedia, deleteDocument } from "@/store/events/eventsThunks";
import { useState } from "react";

export default function DeleteMediaConfirm({ payload }) {
  const dispatch = useDispatch();
  const { item } = payload || {};

  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);

      if (item?.type === "document") {
        await dispatch(
          deleteDocument({
            eventId: item.eventId,
            deleteURL: item.fileURL,
          })
        ).unwrap();
      } else {
        await dispatch(
          deleteMembersMedia({
            eventId: item.eventId,
            deleteURL: item.fileURL,
          })
        ).unwrap();
      }

      // ✅ close AFTER success
      dispatch(closeTopEventsModal());
    } catch (err) {
      console.log("Delete failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={() => !loading && dispatch(closeTopEventsModal())}
    >
      <div
        className="w-[480px] rounded-[28px] bg-white pt-[70px] pb-[40px] shadow-xl flex flex-col items-center gap-[45px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[24px] font-[700] px-[100px] text-center">
          Are you sure you want to delete this item?
        </div>

        <div className="flex gap-[80px]">
          {/* Cancel */}
          <button
            onClick={() => dispatch(closeTopEventsModal())}
            disabled={loading}
            className="rounded-full text-[20px] bg-[#999999] px-6 py-2 text-white w-[120px] cursor-pointer "
          >
            Cancel
          </button>

          {/* Delete */}
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-full text-[20px] bg-gradient-to-r from-[#5597ED] to-[#00449C] w-[120px] px-[16px] py-[8px] text-white cursor-pointer flex items-center justify-center "
          >
            {loading ? (
              <div className="w-[20px] h-[20px] border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}