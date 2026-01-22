import { useDispatch } from "react-redux";
import { openEventFormModal } from "@/store/events/eventsUiSlice";
import ReadOnlyReminderRow from "./ReadOnlyReminderRow";

const ReminderField = ({ reminders = [] }) => {
  const dispatch = useDispatch();
  const hasReminders = reminders.length > 0;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-[16px] block text-[#333333] font-[700]">
          Reminder
        </label>
        <button
          type="button"
          className="text-[18px] block text-[#0B57D0] font-[700] cursor-pointer"
          onClick={() =>
            dispatch(openEventFormModal({ type: "REMINDER" }))
          }
        >
          {hasReminders ? "Add/Edit reminder" : "Add reminder"}
        </button>
      </div>

      {/* Body */}
      <div className="space-y-2">
        {hasReminders ? (
          reminders.map((r) => (
            <ReadOnlyReminderRow key={r.id} reminder={r} />
          ))
        ) : (
          <ReadOnlyReminderRow reminder={null} />
        )}
      </div>
    </div>
  );
};
export default ReminderField