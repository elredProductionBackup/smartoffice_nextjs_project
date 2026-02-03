import { useDispatch, useSelector } from "react-redux";
import { closeEventFormModal } from "@/store/events/eventsUiSlice";
import { useEffect, useMemo, useState } from "react";
import CustomCheckbox from "../UI/CustomCheckbox";
import { DateInput } from "../UI/DateInput";
import { TimeInput } from "../UI/TimeInput";
import { isValidURL } from "@/utils/validation";

const TravelModal = ({ form, setForm }) => {
  const dispatch = useDispatch();
  const { type } = useSelector((s) => s.eventsUi.eventFormModal);

  const [draft, setDraft] = useState(form.travelInfo);
  const [errors, setErrors] = useState(form.travelInfo);

const update = (key, value) => {
  setDraft((prev) => ({ ...prev, [key]: value }));

  setErrors((prev) => {
    if (!prev[key]) return prev;
    const newErr = { ...prev };
    delete newErr[key];
    return newErr;
  });
};

  const toggleRequired = (key) =>
    setDraft((p) => ({
      ...p,
      requiredInfo: {
        ...p.requiredInfo,
        [key]: !p.requiredInfo[key],
      },
    }));

const handleSave = () => {
  const errors = {};

  // --- Validate venueLink ---
  const venue = draft.venueLink?.trim();
  if (venue) {
    if (venue.length < 3) errors.venueLink = "Venue link must be at least 3 characters";
    else if (venue.length > 200) errors.venueLink = "Venue link cannot exceed 200 characters";
    else if (!isValidURL(venue)) errors.venueLink = "Enter a valid venue link";
  }

  // --- Validate hotelLink ---
  const hotel = draft.hotelLink?.trim();
  if (hotel) {
    if (hotel.length < 3) errors.hotelLink = "Hotel link must be at least 3 characters";
    else if (hotel.length > 200) errors.hotelLink = "Hotel link cannot exceed 200 characters";
    else if (!isValidURL(hotel)) errors.hotelLink = "Enter a valid hotel link";
  }

  // --- Validate reminders ---
  const formattedReminders = (draft.reminders || []).map((r) => {
    const note = r.note?.trim() || "";
    if (note && (note.length < 5 || note.length > 200)) {
      errors[`reminder_${r.id}`] = "Reminder note must be 5–200 characters";
    }

    // combine date & time
    if (r.date) {
      const combinedDate = new Date(r.date);
      if (r.time?.hour != null && r.time?.minute != null) {
        combinedDate.setHours(Number(r.time.hour));
        combinedDate.setMinutes(Number(r.time.minute));
        combinedDate.setSeconds(0);
        combinedDate.setMilliseconds(0);
      }
      return { ...r, date: combinedDate };
    }
    return r;
  });

  // --- If any error, stop and set errors ---
  if (Object.keys(errors).length > 0) {
    setErrors(errors);
    return;
  }

  // --- Add https if missing for links ---
  const ensureHttps = (url) => {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url}`;
  };

  // --- Save form ---
  setForm((prev) => ({
    ...prev,
    travelInfo: {
      ...draft,
      venueLink: ensureHttps(venue),
      hotelLink: ensureHttps(hotel),
      reminders: formattedReminders,
    },
  }));

  dispatch(closeEventFormModal());
};


const addReminder = () => {
  setDraft((p) => ({
    ...p,
    reminders: [
      ...(p.reminders || []),
      {
        id: crypto.randomUUID(),
        date: null,
        time: "",
        note: "",
      },
    ],
  }));
};


const updateReminder = (id, key, value) => {
  setDraft((prev) => ({
    ...prev,
    reminders: prev.reminders.map((r) =>
      r.id === id ? { ...r, [key]: value } : r
    ),
  }));

  if (key === "note") {
    setErrors((prev) => {
      const errorKey = `reminder_${id}`;
      if (!prev[errorKey]) return prev;
      const newErr = { ...prev };
      delete newErr[errorKey];
      return newErr;
    });
  }
};

const hasInvalidReminder = (draft.reminders || []).some((r) => {
  const hasDate = !!r.date;
  const hasTime = r.time?.hour != null && r.time?.minute != null;

  return (hasDate && !hasTime) || (!hasDate && hasTime);
});
const isUnchanged = useMemo(() => {
  const original = form.travelInfo || {};
  const current = draft || {};

const normalizeReminder = (r) => {
  const hasDate = !!r.date;
  const hasTime = r.time?.hour != null && r.time?.minute != null;

  if (!hasDate && !hasTime && !r.note) return null;

  return {
    date: hasDate ? new Date(r.date).getTime() : null,
    hour: r.time?.hour ?? null,
    minute: r.time?.minute ?? null,
    note: r.note || "",
  };
};

  const originalReminders = (original.reminders || [])
  .map(normalizeReminder)
  .filter(Boolean);

const currentReminders = (current.reminders || [])
  .map(normalizeReminder)
  .filter(Boolean);

  return JSON.stringify({
    venueLink: original.venueLink || "",
    hotelLink: original.hotelLink || "",
    deadline: original.deadline
      ? new Date(original.deadline).getTime()
      : null,
    requiredInfo: original.requiredInfo || {},
    reminders: originalReminders,
  }) ===
  JSON.stringify({
    venueLink: current.venueLink || "",
    hotelLink: current.hotelLink || "",
    deadline: current.deadline
      ? new Date(current.deadline).getTime()
      : null,
    requiredInfo: current.requiredInfo || {},
    reminders: currentReminders,
  });
}, [draft, form.travelInfo]);
const disableDone = hasInvalidReminder || isUnchanged;

const removeReminder = (id) => {
  setDraft((p) => ({
    ...p,
    reminders: p.reminders.filter((r) => r.id !== id),
  }));
};


useEffect(() => {
    if (type !== "TRAVEL") return;

    setDraft((prev) => {
      const existing = form.travelInfo;

      return {
        ...existing,
        deadline: existing.deadline
          ? new Date(existing.deadline)
          : null,
        reminders:
          existing.reminders && existing.reminders.length > 0
            ? existing.reminders
            : [
                {
                  id: crypto.randomUUID(),
                  date: null,
                  time: "",
                  note: "",
                },
              ],
      };
    });
  }, [type]);


  if (type !== "TRAVEL") return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => dispatch(closeEventFormModal())}>
      <div
        className="w-[500px] bg-white rounded-[20px] overflow-y-auto flex flex-col max-h-[85vh] px-[30px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 pt-[30px] pb-[20px] bg-white z-[2]">
          <h2 className="text-[24px] font-[700]">Add travel info</h2>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col gap-[30px]">

          <Input
            label="Venue link you want to add"
            value={draft.venueLink}
            placeholder={'Enter link'}
            onChange={(e) => update("venueLink", e.target.value)}
            error={errors.venueLink}
          />

          <Input
            label="Hotel link"
            value={draft.hotelLink}
            placeholder={'Enter link'}
            onChange={(e) => update("hotelLink", e.target.value)}
            error={errors.hotelLink}
          />

          {/* Required info */}
          <div>
          <p className="text-[16px] font-[700] mb-[10px]">
            Please select the information required from attendees:
          </p>

          {[
            ["ticketDetails", "Ticket details"],
            ["insuranceDetails", "Insurance"],
            ["visaInformation", "Visa information"],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-[10px] py-[4px]">
              <CustomCheckbox
                checked={draft.requiredInfo[key]}
                onChange={() => toggleRequired(key)}
              />
              <span className="text-[18px] font-[500]">{label}</span>
            </div>
          ))}
        </div>


          {/* Deadline */}
          <div className="flex flex-col">
            <label className="text-[16px] font-[700] mb-[6px]">
              Deadlines for submission
            </label>

            <div className="w-[160px]">
              <DateInput
                value={draft.deadline}
                showYear
                onChange={(date) => update("deadline", date)}
                mode={'fullscreen'}
              />
            </div>
          </div>


          {/* Reminders */}
          <div className="flex flex-col items-start w-[100%]">
            <label className="text-[16px] font-[700] mb-[6px]">
              Reminder
            </label>

            {draft.reminders?.map((r, index) => (
              <div
                key={r.id}
                className={`relative w-[100%] ${
                  index !== draft.reminders.length - 1
                    ? "border-b border-[#EAEAEA] pb-[15px] mb-[15px]"
                    : "mb-[15px]"
                }`}
              >
                <div className="flex gap-[10px] items-start">
                  <div className="flex-1 flex flex-col gap-[10px]">
                    {/* Date + Time */}
                    <div className="flex gap-[10px]">
                      <div className="flex-[1.2] bg-[#F6F6F6] border-[1.4px] border-[#EAEAEA] rounded-lg h-[50px] flex items-center pl-[20px] font-[600]">Reminder</div>
                      <DateInput
                        value={r.date}
                        onChange={(date) =>
                          updateReminder(r.id, "date", date)
                        }
                        mode={'fullscreen'}
                      />

                      <TimeInput
                        value={r.time}
                        onChange={(time) =>
                          updateReminder(r.id, "time", time)
                        }
                        size={'small'}
                      />
                    </div>

                    {/* Notes */}
                    <textarea
                      rows={3}
                      className="w-full bg-[#F6F6F6] border-[1.4px] border-[#EAEAEA]
                                rounded-[8px] outline-none resize-none py-3 px-4"
                      placeholder="Add notes"
                      value={r.note}
                      onChange={(e) =>
                        updateReminder(r.id, "note", e.target.value)
                      }
                    />
                    {errors[`reminder_${r.id}`] && (
                      <p className="text-red-500 text-[14px] mt-[4px]">
                        {errors[`reminder_${r.id}`]}
                      </p>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeReminder(r.id)}
                    className="text-[#999] pt-[15px] cursor-pointer"
                  >
                    <span className="akar-icons--cross"></span>
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addReminder}
              className="text-start text-[#0B57D0] font-[600] text-[18px]"
            >
              Add reminder
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-center gap-[60px] sticky bottom-0 bg-white pt-[20px] pb-[30px]">
          <button
            onClick={() => dispatch(closeEventFormModal())}
            className="w-[120px] py-[8px] rounded-[20px] bg-[#999] text-white cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={disableDone}
            className={`w-[120px] py-[8px] rounded-[20px] text-white bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)]
              ${disableDone
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer "
              }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TravelModal;
const Input = ({ label, error, ...props }) => (
  <div className="mb-[12px] relative">
    <label className="text-[16px] font-[700] mb-[6px] block">{label}</label>
    <input
      {...props}
      className={`w-full pl-[20px] bg-[#F6F6F6] border-[1.4px] rounded-lg outline-none h-[50px]
        ${error ? "border-red-500" : "border-[#EAEAEA]"}`}
    />
    {error && <p className="absolute bottom-[-25px] text-red-500 text-[14px] mt-[4px]">{error}</p>}
  </div>
);
