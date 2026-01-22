import { useState, useMemo, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import PointDropdown from "../UI/PointDropdown";

export const DUMMY_COLLABORATORS = [
  "jasonstatham@gmail.com",
  "emma.watson@gmail.com",
  "robert.downey@gmail.com",
  "scarlett.j@gmail.com",
  "chris.evans@gmail.com",
];

const CollaboratorRow = ({ data = {}, onChange, onRemove, canRemove }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const email = data.email || "";
  const debouncedValue = useDebounce(email);

  useOutsideClick(wrapperRef, () => setOpen(false));

  const suggestions = useMemo(() => {
    if (!debouncedValue) return [];
    return DUMMY_COLLABORATORS.filter((c) =>
      c.toLowerCase().includes(debouncedValue.toLowerCase())
    );
  }, [debouncedValue]);

  return (
    <div ref={wrapperRef} className="flex gap-2 items-start relative">
      {/* Input */}
      <div className="relative flex-1">
        {/* Left icon */}
        <div className="absolute left-[20px] top-1/2 -translate-y-1/2 text-gray-400 flex items-center">
          <span className="la--handshake-solid text-[20px]" />
        </div>

        <input
          value={email}
          onChange={(e) => {
            onChange({ ...data, email: e.target.value });
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (!DUMMY_COLLABORATORS.includes(email)) {
              onChange({ ...data, email: "" });
            }
          }}
          placeholder="Officer or Day chair"
          className="w-full h-[50px] pl-[50px] pr-4 bg-[#F6F6F6] outline-none border border-[#EAEAEA] rounded-lg"
        />

        {/* Suggestions */}
        {open && suggestions.length > 0 && (
          <div className="absolute z-30 mt-2 p-[10px] w-full bg-white rounded-[16px] shadow-lg border border-[#F2F6FC]">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  onChange({ ...data, email: item });
                  setOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#F2F6FC]"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Point */}
      <PointDropdown
        value={data.point}
        onChange={(p) => onChange({ ...data, point: p })}
      />

      {/* Remove */}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 mt-[12px]"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default CollaboratorRow;
