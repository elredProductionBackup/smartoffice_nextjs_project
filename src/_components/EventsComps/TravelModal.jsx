import { useDispatch, useSelector } from "react-redux";
import { closeEventFormModal } from "@/store/events/eventsUiSlice";
import { useEffect, useState } from "react";

const TravelModal = ({ form, setForm }) => {
  const dispatch = useDispatch();
  const { type } = useSelector((s) => s.eventsUi.eventFormModal);

  const [draft, setDraft] = useState(form.travelInfo);

  /* Init */
  useEffect(() => {
    if (type !== "TRAVEL") return;
    setDraft(form.travelInfo);
  }, [type]);

  if (type !== "TRAVEL") return null;

  const update = (key, value) =>
    setDraft((p) => ({ ...p, [key]: value }));

  const toggleRequired = (key) =>
    setDraft((p) => ({
      ...p,
      requiredInfo: {
        ...p.requiredInfo,
        [key]: !p.requiredInfo[key],
      },
    }));

  const handleSave = () => {
    setForm((prev) => ({
      ...prev,
      travelInfo: draft,
    }));
    dispatch(closeEventFormModal());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div
        className="w-[560px] bg-white rounded-[20px] overflow-y-auto flex flex-col max-h-[85vh] px-[30px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 pt-[30px] pb-[20px] bg-white z-[2]">
          <h2 className="text-[24px] font-[700]">Add travel info</h2>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col gap-[16px]">

          <Input
            label="Venue link you want to add"
            value={draft.venueLink}
            onChange={(e) => update("venueLink", e.target.value)}
          />

          <Input
            label="Hotel link"
            value={draft.hotelLink}
            onChange={(e) => update("hotelLink", e.target.value)}
          />

          {/* Required info */}
          <div>
            <p className="text-[14px] font-[600] mb-[6px]">
              Please select the information required from attendees:
            </p>

            {[
              ["ticket", "Ticket details"],
              ["insurance", "Insurance"],
              ["visa", "Visa information"],
            ].map(([key, label]) => (
              <label key={key} className="flex gap-2 items-center text-[14px]">
                <input
                  type="checkbox"
                  checked={draft.requiredInfo[key]}
                  onChange={() => toggleRequired(key)}
                />
                {label}
              </label>
            ))}
          </div>

          {/* Deadline */}
          <div>
            <label className="text-[14px] font-[600] mb-[6px] block">
              Deadlines for submission
            </label>
            <input
              type="date"
              value={draft.deadline || ""}
              onChange={(e) => update("deadline", e.target.value)}
              className="h-[44px] px-4 bg-[#F6F6F6] border rounded-[8px]"
            />
          </div>

          {/* Notes */}
          <textarea
            rows={3}
            placeholder="Add notes"
            value={draft.note}
            onChange={(e) => update("note", e.target.value)}
            className="bg-[#F6F6F6] border rounded-[8px] px-4 py-3"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-[60px] sticky bottom-0 bg-white pt-[20px] pb-[30px]">
          <button
            onClick={() => dispatch(closeEventFormModal())}
            className="w-[120px] py-[8px] rounded-[20px] bg-[#999] text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="w-[120px] py-[8px] rounded-[20px] text-white
                       bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TravelModal;

const Input = ({ label, ...props }) => (
  <div>
    <label className="text-[14px] font-[600] mb-[6px] block">
      {label}
    </label>
    <input
      {...props}
      className="w-full h-[44px] px-4 bg-[#F6F6F6] rounded-[8px]"
    />
  </div>
);
