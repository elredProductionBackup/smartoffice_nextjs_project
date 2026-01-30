"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import PointDropdown from "../UI/PointDropdown";
import Image from "next/image";

const CollaboratorRow = ({
  data = {},
  collaborators = [],
  selectedUserCodes = [],
  onChange,
  onRemove,
  canRemove,
  setQuery,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const name = data.name || "";
  const avatar = data.dpURL || "";
  const debouncedValue = useDebounce(name);
  const isSelected = Boolean(data.userCode);

  // Focus input when dropdown opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useOutsideClick(wrapperRef, () => setOpen(false));

  // Filter dropdown to exclude selected collaborators
  const filteredCollaborators = useMemo(
    () =>
      collaborators.filter(
        (c) =>
          !selectedUserCodes.includes(c.userCode) &&
          c.userCode !== data.userCode &&
          c.name.toLowerCase().includes(debouncedValue.toLowerCase())
      ),
    [debouncedValue, selectedUserCodes, collaborators, data.userCode]
  );

  return (
    <div ref={wrapperRef} className="flex gap-[20px] items-center relative">
      <div className="relative flex-1 flex items-center">
        {isSelected ? (
          // Selected pill
          <div className="w-full h-[50px] pl-[50px] pr-[20px] bg-[#F6F6F6] border border-[#EAEAEA] rounded-lg flex items-center">
            <div className="absolute left-[20px] flex items-center text-[#999]">
              <span className="la--handshake-solid text-[20px]" />
            </div>
            <div className="flex items-center gap-[6px] border border-[#B1B1B1] rounded-full px-[5px] py-[4px] h-[32px] w-fit">
              {avatar ? (
                <Image src={avatar} alt="Avatar" width={24} height={24} />
              ) : (
                <div className="h-[24px] w-[24px] rounded-full bg-[#CCCCCC]" />
              )}
              <span className="text-[14px] font-[500]">{name}</span>

              <button
                type="button"
                onClick={() => {
                  onChange({ userCode: "", name: "", email: "", dpURL: "", point: 1 });
                  setOpen(true);
                  setQuery("");
                }}
                className="px-[4px] grid place-items-center cursor-pointer text-gray-500 hover:text-red-500"
              >
                <span className="akar-icons--cross small-cross"></span>
              </button>
            </div>
          </div>
        ) : (
          // Input + dropdown
          <>
            <div className="absolute left-[20px] flex items-center text-[#999]">
              <span className="la--handshake-solid text-[20px]" />
            </div>

            <input
              ref={inputRef}
              value={data.name}
              onChange={(e) => {
                onChange({ ...data, name: e.target.value });
                setOpen(true);
                setQuery(e.target.value);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Officer or Day chair"
              className="w-full h-[50px] pl-[50px] pr-[20px] bg-[#F6F6F6] border border-[#EAEAEA] rounded-lg outline-none"
            />

            {open && (
              <div
                className="absolute left-0 top-[calc(100%+2px)] w-full max-h-[180px] bg-white rounded-[4px] z-[99] overflow-auto shadow-sm"
              >
                {filteredCollaborators.length > 0 ? (
                  filteredCollaborators.map((u) => (
                    <div
                      key={u.userCode}
                      onClick={() => {
                        onChange({
                          userCode: u.userCode,
                          name: u.name,
                          email: u.email,
                          dpURL: u.dpURL,
                          point: data.point || 1,
                        });
                        setOpen(false);
                        setQuery("");
                      }}
                      className="flex items-center gap-[8px] px-[20px] py-[12px] hover:bg-[#FAFAFA] cursor-pointer font-[500]"
                    >
                      {u.dpURL ? (
                        <Image src={u.dpURL} alt="Avatar" width={32} height={32} />
                      ) : (
                        <div className="h-[32px] w-[32px] rounded-full bg-[#CCCCCC]" />
                      )}
                      {u.name}
                    </div>
                  ))
                ) : (
                  <div className="w-full min-h-[180px] flex flex-col items-center justify-center gap-[10px]">
                    <div className="text-[16px] font-[600]">No collaborator found</div>
                    <div className="text-[14px] text-[#666]">Try adjusting your search.</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <PointDropdown value={data.point} onChange={(p) => onChange({ ...data, point: p })} />

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
