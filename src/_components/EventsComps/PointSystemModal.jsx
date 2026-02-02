"use client";
import { setPointsMaster } from "@/store/events/eventsSlice";
import { fetchMasterConfig, saveMasterConfig } from "@/store/events/eventsThunks";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const createRule = (label = "", value = 1) => ({
  tempId: crypto.randomUUID(),
  label,
  value,
});

export default function PointSystemModal({ onClose }) {
  const dispatch = useDispatch();
  const masterLoading = useSelector((state) => state.events.masterLoading);
  const pointsMaster = useSelector((state) => state.events.pointsMaster) || [];
  const [editMode, setEditMode] = useState(false);
  const [localPoints, setLocalPoints] = useState([]);

  useEffect(() => {
    dispatch(fetchMasterConfig());
  }, [dispatch]);

  useEffect(() => {
    if (pointsMaster.length > 0) {
      setLocalPoints(
        pointsMaster.map((p) => ({
          id: p._id || crypto.randomUUID(),
          tempId: p._id ? null : crypto.randomUUID(),
          label: p.label || "",
          value: p.points ?? 1,
        }))
      );
    } else {
      setLocalPoints([]);
    }
  }, [pointsMaster]);

  const updateLabel = (id, value) => {
    setLocalPoints((prev) =>
      prev.map((p) => (p.id === id ? { ...p, label: value } : p))
    );
  };

  const updateValue = (id, value) => {
    setLocalPoints((prev) =>
      prev.map((p) => (p.id === id ? { ...p, value: Number(value) || 0 } : p))
    );
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
  const updatedPoints = rules.map((r) => ({
    label: r.label,
    points: r.value,
  }));

  dispatch(setPointsMaster(updatedPoints));

  const res = await dispatch(saveMasterConfig());

  if (saveMasterConfig.fulfilled.match(res)) {
    onClose()
  }
};

  return (
    <div className="w-[480px] min-h-[380px] max-h-[85vh] bg-white rounded-[20px] overflow-y-auto flex flex-col px-[40px] relative">
      {/* Header */}
      <div className="sticky top-[0px] pt-[30px] pb-[20px] z-[2] bg-white">
        <h2 className="text-[24px] font-[700]">Point System</h2>
      </div>

        <div className="flex-1 flex flex-col ">
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
                    onClick={() => setEditMode(true)}
                    className="text-[#0B57D0] font-[600] text-[18px]"
                    >  
                    Add Point
                    </button>
                </>
                ) : (
               !masterLoading && localPoints.map((point) => (
                    <div key={point.id} className="flex items-center gap-[20px] w-full">
                    <input
                        type="text"
                        value={point.label}
                        disabled={!editMode}
                        placeholder="Point Name"
                        onChange={(e) => updateLabel(point.id, e.target.value)}
                        className={`flex-1 h-[48px] px-[20px] rounded-[4px] outline-none font-[500] border-[1.4px] border-[#CCCCCC] ${
                        editMode ? "bg-[#fff]" : "bg-[#F6F6F6]"
                        }`}
                    />
                    <input
                        type="number"
                        value={point.value}
                        min={0}
                        disabled={!editMode}
                        onChange={(e) => updateValue(point.id, e.target.value)}
                        className={`w-[80px] h-[48px] px-[10px] text-center font-[500] rounded-[4px] outline-none border-[1.4px] border-[#CCCCCC] ${
                        editMode ? "bg-[#fff]" : "bg-[#F6F6F6]"
                        }`}
                    />
                    {editMode && localPoints.length !== 1 &&(
                        <button
                        onClick={() => removeRule(point.id)}
                        className="cursor-pointer h-[20px] w-[20px] bg-[#EEEEEE] text-[#999999] rounded-full grid place-items-center"
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
                className="w-full text-start text-[#0B57D0] font-[600] text-[18px] ml-[10px] mb-[20px] cursor-pointer"
                >
                Add more
                </button>
            )}
            {!masterLoading && !editMode && localPoints.length > 0 && (
                <button
                onClick={() => setEditMode(true)}
                className="w-full text-start text-[#0B57D0] font-[600] text-[18px] ml-[10px] mb-[20px] cursor-pointer"
                >
                Add / Edit
                </button>
            )}

        </div>


      {/* Footer */}
      <div className="bg-white flex justify-center w-[100%] gap-[80px] sticky bottom-[0px] pt-[20px] pb-[30px]">
        <button
          onClick={()=>{editMode ? setEditMode(false):onClose()}}
          className="w-[120px] py-[8px] rounded-[20px] bg-[#999999] text-white cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="w-[120px] py-[8px] rounded-[20px] text-white transition bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] cursor-pointer"
          disabled={masterLoading || localPoints.length === 0}
        >
          Save
        </button>
      </div>
    </div>
  );
}