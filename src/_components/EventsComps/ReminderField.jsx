import { useDispatch } from "react-redux";
import { openEventFormModal } from "@/store/events/eventsUiSlice";
import ReadOnlyReminderRow from "./ReadOnlyReminderRow";

const ReminderField = ({ reminders = [] }) => {
  const dispatch = useDispatch();
  const hasReminders = reminders.length > 0;

  return (
    <div className="flex flex-col gap-[6px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <label className="text-[14px] block text-[#333333] font-[700]">
          Reminder
        </label>
        <button
          type="button"
          className="text-[15px] block text-[#0B57D0] font-bold cursor-pointer hover:underline"
          onClick={() =>
            dispatch(openEventFormModal({ type: "REMINDER" }))
          }
        >
          {hasReminders ? "Add/Edit reminder" : "Add reminder"}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-[6px]">
        {hasReminders ? (
          reminders.map((r) => (
            <ReadOnlyReminderRow key={r.id || r._id} reminder={r} />
          ))
        ) : (
          <ReadOnlyReminderRow  reminder={null} />
        )}
      </div>
    </div>
  );
};
export default ReminderField