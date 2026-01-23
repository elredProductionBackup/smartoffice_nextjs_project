import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { closeEventFormModal } from "@/store/events/eventsUiSlice";
import { DateInput } from "@/_components/UI/DateInput";
import { TimeInput } from "@/_components/UI/TimeInput";
import { IoChevronDown } from "react-icons/io5";
import { useOutsideClick } from "@/hooks/useOutsideClick";

/* ---------------- Constants ---------------- */

const AUDIENCE_OPTIONS = [
  { label: "To members", value: "members" },
  { label: "To those who signed up", value: "signed" },
  { label: "To those who not signed up", value: "not_signed" },
];

/* ---------------- Helpers ---------------- */

const mergeDateAndTime = (date, time) => {
  const d = new Date(date);
  d.setHours(
    parseInt(time.hour, 10),
    parseInt(time.minute, 10),
    0,
    0
  );
  return d;
};

const createDefaultReminder = () => ({
  id: crypto.randomUUID(),
  audience: null,
  date: new Date(),
  time: { hour: "15", minute: "00" },
  note: "",
});

/* ---------------- Component ---------------- */

const ReminderModal = ({ form, setForm }) => {
  const dispatch = useDispatch();
  const { type } = useSelector((s) => s.eventsUi.eventFormModal);

  const [draftReminders, setDraftReminders] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const dropdownRef = useRef(null);

  useOutsideClick(dropdownRef, () => {
    if (openDropdownId) setOpenDropdownId(null);
  });

  /* Init reminders */
  useEffect(() => {
    if (type !== "REMINDER") return;

    if (form.reminder?.length) {
      setDraftReminders(
        form.reminder.map((r) => {
          const d = new Date(r.datetime);
          return {
            id: r.id,
            audience: r.audience,
            date: d,
            time: {
              hour: String(d.getHours()).padStart(2, "0"),
              minute: String(d.getMinutes()).padStart(2, "0"),
            },
            note: r.note,
          };
        })
      );
    } else {
      setDraftReminders([createDefaultReminder()]);
    }
  }, [type]);

  if (type !== "REMINDER") return null;

  /* Actions */

  const updateReminder = (id, key, value) => {
    setDraftReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );
  };

  const addReminder = () => {
    setDraftReminders((prev) => [...prev, createDefaultReminder()]);
  };

  const removeReminder = (id) => {
    setDraftReminders((prev) => {
      const next = prev.filter((r) => r.id !== id);
      if (next.length === 0) {
        // dispatch(closeEventFormModal());
        // return [];
      }
      return next;
    });
  };

  const handleSave = () => {
    const normalizedReminders = draftReminders.map((r) => ({
      id: r.id,
      audience: r.audience,
      datetime: mergeDateAndTime(r.date, r.time),
      note: r.note,
    }));

    setForm((prev) => ({
      ...prev,
      reminder: normalizedReminders,
    }));

    dispatch(closeEventFormModal());
  };

  const isReminderValid = (r) => {
    return (
      r.audience &&
      r.date instanceof Date &&
      r.time?.hour &&
      r.time?.minute
    );
  };

const isFormValid =
  draftReminders.length === 0 ||
  draftReminders.every(isReminderValid);


  /* UI */

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
      onClick={() => setOpenDropdownId(null)}
    >
      <div
        className="w-[560px] bg-white rounded-[20px] overflow-y-auto flex flex-col  max-h-[85vh] px-[30px]  relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-[0px] pt-[30px] pb-[20px] z-[2] bg-[white]">
          <h2 className="text-[24px] font-[700]">Reminders</h2>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col ">
          {draftReminders.map((r, index) => (
            <div
              key={r.id}
              className={`relative mt-[15px] ${
                index !== draftReminders.length - 1
                  ? "border-b border-[#EAEAEA] pb-[15px]"
                  : ""
              }`}
            >
              <div className="w-full flex gap-[10px] items-start">
                <div className="flex-1 flex flex-col gap-[10px]">
                  {/* Top Row */}
                  <div className="flex gap-[5px]">
                    {/* Audience */}
                    <div className="relative flex-[2.5]" ref={openDropdownId === r.id ? dropdownRef : null}>
                      <button  
                        type="button"
                        onClick={() =>
                          setOpenDropdownId(openDropdownId === r.id ? null : r.id)
                        }
                        className="w-full h-[50px] pl-[16px] pr-[10px] bg-[#F6F6F6] border-[1.4px] border-[#EAEAEA]
                                  rounded-[8px] text-left whitespace-nowrap gap-[10px]
                                  flex items-center justify-between font-[500] cursor-pointer"
                      >
                        <span className={r.audience ? "text-black" : "text-gray-400"}>
                          {AUDIENCE_OPTIONS.find(
                            (o) => o.value === r.audience
                          )?.label || "Select"}
                        </span>

                        <IoChevronDown
                          className={`text-gray-500 transition-transform duration-200 ${
                            openDropdownId === r.id ? "rotate-180" : ""
                          }`}
                          size={18}
                        />
                      </button>


                      {openDropdownId === r.id && (
                        <div className="absolute top-full left-0 z-[9999] mt-2 p-[6px]
                                        w-full bg-white rounded-[16px]
                                        border-[1.4px] border-[#EAEAEA] shadow-md">
                          {AUDIENCE_OPTIONS.map((opt) => {
                            const isActive = opt.value === r.audience;

                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  updateReminder(r.id, "audience", opt.value);
                                  setOpenDropdownId(null);
                                }}
                                className={`cursor-pointer w-full text-left px-3 py-2 font-[500] rounded-[10px] flex items-center justify-between
                                  ${
                                    isActive
                                      ? "bg-[#F2F6FC] "
                                      : ""
                                  }`}
                              >
                                <span>{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                    </div>

                    <DateInput
                      value={r.date}
                      onChange={(date) =>
                        updateReminder(r.id, "date", date)
                      }
                      right={true}
                    />

                    <TimeInput
                      value={r.time}
                      onChange={(time) =>
                        updateReminder(r.id, "time", time)
                      }
                    />
                  </div>

                  {/* Notes */}
                  <textarea
                  rows={3}
                    className="w-full bg-[#F6F6F6] border-[1.4px] border-[#EAEAEA] rounded-[8px] outline-none resize-none py-3 px-4"
                    placeholder="Add notes"
                    value={r.note}
                    onChange={(e) =>
                      updateReminder(r.id, "note", e.target.value)
                    }
                  />
                </div>
                {/* Remove Icon */}
                <button
                  type="button"
                  onClick={() => removeReminder(r.id)}
                  className=" right-0 top-0 text-[#999] text-lg cursor-pointer pt-[15px]"
                >
                  <span className="akar-icons--cross"></span>
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addReminder}
            className="w-full text-start text-[#0B57D0] font-[600] text-[18px] mt-[10px]"
          >
            Add reminder
          </button>
        </div>

        {/* Footer */}
        <div className="bg-[#fff] flex justify-center w-[100%] gap-[60px] sticky bottom-[0px] pt-[20px] pb-[30px]">
          <button
            onClick={() => dispatch(closeEventFormModal())}
            className="w-[120px] py-[8px] rounded-[20px] bg-[#999999] text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid}
            className={`w-[120px] py-[8px] rounded-[20px] text-white transition bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] 
              ${
                isFormValid
                  ? " cursor-pointer"
                  : "cursor-not-allowed opacity-50"
              }`}
          >
            Save
          </button>

        </div>
      </div>
    </div>
  );
};

export default ReminderModal;
