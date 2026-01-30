"use client";
import { useState, useEffect } from "react";

const createRule = (label = "", value = 1) => ({
    id: crypto.randomUUID(),
    label,
    value,
});

export default function PointSystemModal({
    onClose,
    onSave,
    initialRules,
}) {
    const [editMode, setEditMode] = useState(false);

    const [rules, setRules] = useState(() => {
        if (initialRules && initialRules.length) {
            return initialRules.map(r => ({
                id: crypto.randomUUID(),
                label: r.label,
                value: r.value,
            }));
        }
        return [createRule("Points per event", 1)];
    });


    const updateLabel = (id, val) => {
        setRules((prev) =>
            prev.map((r) => (r.id === id ? { ...r, label: val } : r))
        );
    };

    const updateValue = (id, val) => {
        setRules((prev) =>
            prev.map((r) => (r.id === id ? { ...r, value: val } : r))
        );
    };

    const addRule = () => {
        setRules((prev) => [...prev, createRule("Custom points", 1)]);
    };

    const removeRule = (id) => {
        setRules((prev) => prev.filter((r) => r.id !== id));
    };

    const handleSave = () => {
        onSave(
            rules.map((r) => ({
                label: r.label.trim() || "Untitled rule",
                value: Number(r.value) || 0,
            }))
        );
        // onClose();
        if(editMode){
            setEditMode(false)
        } else{
            onClose()
        }
    };

    return (
        <div className="w-[480px] max-h-[85vh]  bg-white rounded-[20px] overflow-y-auto flex flex-col  max-h-[85vh] px-[40px]  relative">
            {/* Header */}
            <div className="sticky top-[0px] pt-[30px] pb-[20px] z-[2] bg-[white]">
                <h2 className="text-[24px] font-[700]">Point System</h2>
            </div>

            <div className="flex flex-col gap-[20px] items-start w-[100%]">
                <div className="flex flex-col gap-[20px] w-[100%]">
                    {rules.map((rule) => (
                    <div key={rule.id} className="flex-1 flex items-center gap-[20px]">
                        <input
                            type="text"
                            value={rule.label}
                            disabled={!editMode}
                            onChange={(e) => updateLabel(rule.id, e.target.value)}
                            className={`flex-1 h-[48px] px-[20px] rounded-[4px] outline-none font-[500] border-[1.4] border-[#CCCCCC] ${editMode
                                    ? "bg-[#fff]"
                                    : "bg-[#F6F6F6]"
                                }`}
                        />

                        <input
                            type="number"
                            min={0}
                            value={rule.value}
                            disabled={!editMode}
                            onChange={(e) => updateValue(rule.id, e.target.value)}
                            className={`flex-1 text-center h-[48px] px-[20px] font-[500] rounded-[4px] outline-none  border-[1.4px] border-[#CCCCCC] ${editMode
                                    ? "bg-[#fff] max-w-[60px]"
                                    : "bg-[#F6F6F6] max-w-[100px]"
                                }`}
                        />

                        {editMode && (
                            <button
                                onClick={() => removeRule(rule.id)}
                                className="cursor-pointer h-[20px] w-[20px] bg-[#EEEEEE] text-[#999999] rounded-full grid place-items-center"
                            >
                                <span className="akar-icons--cross small-cross"></span>
                            </button>
                        )}
                    </div>
                ))}
                </div>
                <button
                    onClick={() => {
                        if (!editMode) setEditMode(true);
                        else addRule();
                    }}
                    className="w-full text-start text-[#0B57D0] font-[600] text-[18px] ml-[10px] mb-[80px] cursor-pointer mb-[60px]"
                >
                    {editMode ? "Add more" : "Add / Edit"}
                </button>
            </div>

            {/* Footer */}
            <div className="bg-[#fff] flex justify-center w-[100%] gap-[80px] sticky bottom-[0px] pt-[20px] pb-[30px]">
                <button
                    onClick={onClose}
                    className="w-[120px] py-[8px] rounded-[20px] bg-[#999999] text-white cursor-pointer"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className={`w-[120px] py-[8px] rounded-[20px] text-white transition bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] cursor-pointer`}
                >
                    Save
                </button>

            </div>
        </div>
    );
}
