import { useState, useRef, useEffect } from "react";
import { DUMMY_COLLABORATORS } from "../../assets/helpers/sampleActionable";

export default function CollaboratorSection({ collaborators, onChange }) {
  const [query, setQuery] = useState("");
  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef(null);

  const filtered = DUMMY_COLLABORATORS.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) &&
      !collaborators.some((c) => c.id === u.id)
  );

  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus();
    }
  }, [isActive]);

  const addUser = (user) => {
    onChange([...collaborators, user]);
    setQuery("");
    setIsActive(false);
  };

  const removeUser = (id) => {
    onChange(collaborators.filter((c) => c.id !== id));
  };

  return (
    <div className="relative flex flex-col gap-[8px] pt-[20px]">
      <span className="text-[20px] text-[#333333] font-[700] uppercase">
        Collaborators
      </span>

      {/* CLICKABLE CONTAINER */}
      <div
        onClick={() => setIsActive(true)}
        className="border-[1.4px] border-[#CCCCCC] rounded-[4px] p-[8px] flex items-center flex-wrap gap-x-[8px] gap-y-[10px] cursor-text min-h-[48px]"
      >
        {collaborators?.length === 0 && !isActive && <span className="h-[100%] pl-[8px] font-[500] text-[#999999]">Add Collaborator</span>}
        {collaborators && collaborators?.map((u) => (
          <div
            key={u.id}
            className="flex items-center gap-[6px] border-1 border-[#B1B1B1] rounded-full px-[6px] py-[4px] h-[32px]"
          >
            <div className="w-[24px] h-[24px] bg-[#CCCCCC] rounded-full" />
            <span className="text-[14px] font-[500]">{u.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeUser(u.id);
              }}
              className="pr-[6px] cursor-pointer"
            >
              <span className="akar-icons--cross small-cross"></span>
            </button>
          </div>
        ))}

        {/* INPUT APPEARS ONLY WHEN ACTIVE */}
        {isActive && (
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => !query && setIsActive(false)}
            className="flex-1 outline-none min-w-[120px] pl-[8px]"
          />
        )}
      </div>

      {/* DROPDOWN */}
      {query && filtered.length > 0 && (
        <div className="absolute left-0 top-[calc(100%+2px)] max-h-[250px] w-full
              rounded-[4px] bg-white text-[#333333] z-[1]"
              style={{
                boxShadow: "0px 4px 4px 0px #A4A3A340",
              }}>
          {filtered.map((u) => (
            <div
              key={u.id}
              onClick={() => addUser(u)}
              className="flex items-center gap-[8px] px-[20px] py-[20px] hover:bg-[#FAFAFA] cursor-pointer font-[500]"
            >
              <span className="min-h-[32px] min-w-[32px] rounded-full bg-[#CCCCCC]"></span>
              {u.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
