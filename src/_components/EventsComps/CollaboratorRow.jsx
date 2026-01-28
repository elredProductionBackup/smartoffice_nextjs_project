import { useState, useMemo, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import PointDropdown from "../UI/PointDropdown";

export const DUMMY_COLLABORATORS = [
  { id: 1, name: "Jason Statham" },
  { id: 2, name: "Emma Watson" },
  { id: 3, name: "Robert Downey Jr." },
  { id: 4, name: "Scarlett Johansson" },
  { id: 5, name: "Chris Evans" },
];

const CollaboratorRow = ({
  data = {},
  selectedNames = [],
  onChange,
  onRemove,
  canRemove,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const name = data.name || "";
  const debouncedValue = useDebounce(name);
  const isSelected = Boolean(name);

  useOutsideClick(wrapperRef, () => setOpen(false));

  /** filter out already selected collaborators */
  const filteredCollaborators = useMemo(() => {
    return DUMMY_COLLABORATORS.filter(
      (c) =>
        !selectedNames.includes(c.name) &&
        c.name.toLowerCase().includes(debouncedValue.toLowerCase())
    );
  }, [debouncedValue, selectedNames]);

  return (
    <div ref={wrapperRef} className="flex gap-[20px] items-center relative">
      {/* LEFT */}
      <div className="relative flex-1 flex items-center">
        {/* SELECTED PILL */}
        {isSelected ? (
          <div className="w-full h-[50px] pl-[50px] pr-[20px] bg-[#F6F6F6] outline-none border border-[#EAEAEA] rounded-lg flex items-center ">
            <div className="absolute left-[20px] flex items-center text-[#999]">
              <span className="la--handshake-solid text-[20px]" />
            </div>
            <div className="flex items-center gap-[6px] border border-[#B1B1B1]
                rounded-full px-[5px] py-[4px] h-[32px] w-fit" >
              <div className="h-[24px] w-[24px] rounded-full bg-[#CCCCCC]" />
              <span className="text-[14px] font-[500]">{name}</span>

              <button
                type="button"
                onClick={() => {
                  onChange({ ...data, name: "" });
                  setOpen(false);
                }}
                className="px-[4px] grid place-items-center cursor-pointer text-gray-500 hover:text-red-500"
              >
                <span className="akar-icons--cross small-cross"></span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* INPUT */}
            <div className="absolute left-[20px] flex items-center text-[#999]">
              <span className="la--handshake-solid text-[20px]" />
            </div>

            <input
              value={name}
              onChange={(e) => {
                onChange({ ...data, name: e.target.value });
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Officer or Day chair"
              className="w-full h-[50px] pl-[50px] pr-[20px]
                bg-[#F6F6F6] outline-none border border-[#EAEAEA] rounded-lg"
            />

            {/* DROPDOWN */}
            {open && (
              <div
                className="absolute left-0 top-[calc(100%+2px)] w-full max-h-[180px]
                  rounded-[4px] bg-white z-[99] overflow-auto"
                style={{ boxShadow: "0px 4px 4px 0px #A4A3A340" }}
              >
                {filteredCollaborators.length > 0 ? (
                  filteredCollaborators.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        onChange({ ...data, name: u.name });
                        setOpen(false);
                      }}
                      className="flex items-center gap-[8px] px-[20px] py-[12px]
                        hover:bg-[#FAFAFA] cursor-pointer font-[500]"
                    >
                      <div className="h-[32px] w-[32px] rounded-full bg-[#CCCCCC]" />
                      {u.name}
                    </div>
                  ))
                ) : (
                  <div className="w-full min-h-[180px] flex flex-col items-center justify-center gap-[10px]">
                    <div className="text-[16px] font-[600]">
                      No collaborator found
                    </div>
                    <div className="text-[14px] text-[#666]">
                      Try adjusting your search.
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* POINTS */}
      <PointDropdown
        value={data.point}
        onChange={(p) => onChange({ ...data, point: p })}
      />

      {/* REMOVE ROW */}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-[#999] hover:text-red-500 mt-[4px]"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default CollaboratorRow;
