"use client";
import { setPointsMaster } from "@/store/events/eventsSlice";
import { fetchMasterConfig, saveMasterConfig } from "@/store/events/eventsThunks";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const createRule = (label = "", value = 1) => ({
  tempId: crypto.randomUUID(),
  label,
  value,
});

// Stable fallback so the selector doesn't hand back a new [] every render
const NO_POINTS = [];

// Store points -> editable rows
const toLocalPoints = (list) =>
  list.map((p) => ({
    id: p._id || crypto.randomUUID(),
    tempId: p._id ? null : crypto.randomUUID(),
    label: p.label || "",
    value: p.points !== undefined && p.points !== null ? String(p.points) : "1",
  }));

export default function PointSystemModal({ onClose }) {
  const dispatch = useDispatch();
  const masterLoading = useSelector((state) => state.events.masterLoading);
  const pointsMaster = useSelector((state) => state.events.pointsMaster) || NO_POINTS;
  const [editMode, setEditMode] = useState(false);
  const [localPoints, setLocalPoints] = useState(() => toLocalPoints(pointsMaster));
  const [saving, setSaving] = useState(false);
  // Re-copy the store's points into the editable rows whenever they change (fetch / save).
  // Done while rendering instead of in an effect, so there's no extra render with stale rows.
  const [syncedFrom, setSyncedFrom] = useState(pointsMaster);
  if (syncedFrom !== pointsMaster) {
    setSyncedFrom(pointsMaster);
    setLocalPoints(toLocalPoints(pointsMaster));
  }
  useEffect(() => {
    dispatch(fetchMasterConfig());
  }, [dispatch]);

  const updateLabel = (id, value) => {
    setLocalPoints((prev) =>
      prev.map((p) => (p.id === id ? { ...p, label: value } : p))
    );
  };
const updateValue = (id, value) => {
  if (value === "" || (/^\d+$/.test(value) && value !== "0")) {
    setLocalPoints((prev) =>
      prev.map((p) => (p.id === id ? { ...p, value } : p))
    );
  }
};

  const addRule = () => {
    const newPoint = createRule("", 1);
    setLocalPoints((prev) => [...prev, { ...newPoint, id: newPoint.tempId }]);
  };

  const removeRule = (id) => {
    setLocalPoints((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = () => {
    const validPoints = localPoints.filter((p) => p.label.trim() !== "");
    if(editMode){
        handlePointSave(validPoints);
    } else{
        onClose()
    }
  };

const handlePointSave = async (rules) => {
  if (saving) return; // guard against double clicks while the save is in flight
  const updatedPoints = rules.map((r) => ({
    label: r.label,
    points: r.value === "" ? 1 : Number(r.value),
  }));

  const previous = pointsMaster;
  setSaving(true);
  dispatch(setPointsMaster(updatedPoints));

  const res = await dispatch(saveMasterConfig());
  setSaving(false);

  if (saveMasterConfig.fulfilled.match(res)) {
    onClose();
  } else {
    dispatch(setPointsMaster(previous)); // roll back the unsaved change, like the checklist does
  }
};

  // Cancel while editing drops the unsaved edits instead of leaving them on screen
  const cancelEdit = () => {
    setLocalPoints(toLocalPoints(pointsMaster));
    setEditMode(false);
  };

  // "Add Point" on an empty list opens edit mode with a first blank row to fill in
  const startFirstPoint = () => {
    setEditMode(true);
    addRule();
  };

  const originalPoints = useMemo(
    () =>
      pointsMaster.map((p) => ({
        label: p.label || "",
        value: String(p.points ?? 1),
      })),
    [pointsMaster]
  );

  const isChanged = () => {
    const cleanLocal = localPoints.map((p) => ({
      label: p.label.trim(),
      value: String(p.value),
    }));

    return JSON.stringify(cleanLocal) !== JSON.stringify(originalPoints);
  };

  return (
    <div className="w-[calc(100vw-32px)] max-w-[480px] min-h-[380px] max-h-[85dvh] md:max-h-[85vh] bg-white rounded-[20px] overflow-y-auto flex flex-col px-5 md:px-[40px] relative">
      {/* Header */}
      <div className="sticky top-[0px] pt-6 md:pt-[30px] pb-4 md:pb-[20px] z-[2] bg-white">
        <h2 className="text-[20px] md:text-[24px] font-[700]">Point System</h2>
      </div>

        <div className="flex-1 flex flex-col items-start">
            {/* Points list */}
            <div className={`${masterLoading && 'flex-1'} flex flex-col gap-[20px] items-start w-[100%] mb-[20px]`}>
                {masterLoading && (
                <div className="flex-1 w-[100%] grid place-items-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    {/* <p className="text-[18px] font-[500] text-[#555]">Loading checklist...</p> */}
                </div>
                    )
                }

                {!masterLoading && localPoints.length === 0 && !editMode ? (
                <>
                    <p className="text-[18px] text-[#555]">No points created yet</p>
                    <button
                    onClick={startFirstPoint}
                    className="text-[#0B57D0] font-[600] text-[18px] cursor-pointer"
                    >  
                    Add Point
                    </button>
                </>
                ) : (
               !masterLoading && localPoints.map((point) => (
                    <div key={point.id} className="flex items-center gap-3 md:gap-[20px] w-full">
                    <input
                        type="text"
                        value={point.label}
                        disabled={!editMode}
                        placeholder="Point Name"
                        onChange={(e) => updateLabel(point.id, e.target.value)}
                        className={`flex-1 min-w-0 h-[48px] px-3 md:px-[20px] rounded-[4px] outline-none font-[500] border-[1.4px] border-[#CCCCCC] ${
                        editMode ? "bg-[#fff]" : "bg-[#F6F6F6]"
                        }`}
                    />
                   <input
                      type="number"
                      value={point.value}
                      placeholder="1"
                      min={1} 
                      disabled={!editMode}
                      onChange={(e) => updateValue(point.id, e.target.value)}
                      className={`w-[64px] md:w-[80px] shrink-0 h-[48px] px-[10px] text-center font-[500] rounded-[4px] outline-none border-[1.4px] border-[#CCCCCC] ${
                        editMode ? "bg-[#fff]" : "bg-[#F6F6F6]"
                      }`}
                    />
                    {editMode && localPoints.length !== 1 &&(
                        <button
                        onClick={() => removeRule(point.id)}
                        aria-label="Remove point"
                        className="cursor-pointer shrink-0 h-[20px] w-[20px] bg-[#EEEEEE] text-[#999999] rounded-full grid place-items-center"
                        >
                        <span className="akar-icons--cross small-cross"></span>
                        </button>
                    )}
                    </div>
                ))
                )}
            </div>

            {/* Add / Edit Button */}
            {editMode && (
                <button
                onClick={addRule}
                className=" text-start text-[#0B57D0] font-[600] text-[18px] ml-[10px] mb-[20px] cursor-pointer"
                >
                Add more
                </button>
            )}
            {!masterLoading && !editMode && localPoints.length > 0 && (
                <button
                onClick={() => setEditMode(true)}
                className=" text-start text-[#0B57D0] font-[600] text-[18px] ml-[10px] mb-[20px] cursor-pointer"
                >
                Add / Edit
                </button>
            )}

        </div>


      {/* Footer */}
      <div className="bg-white flex justify-center w-[100%] gap-4 md:gap-[80px] sticky bottom-[0px] pt-4 md:pt-[20px] pb-6 md:pb-[30px]">
        <button
          onClick={()=>{editMode ? cancelEdit():onClose()}}
          className="w-[120px] py-[8px] rounded-[20px] bg-[#999999] text-white cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || masterLoading || localPoints.length === 0 || !isChanged()}
          className={`w-[120px] py-[8px] rounded-[20px] text-white transition bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] ${
            !isChanged()
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer"
          }`}
        >
          Save
        </button>
      </div>
    </div>
  );
}