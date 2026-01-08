import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCollaborators } from "@/store/actionable/actionableThunks";
import Image from "next/image";

export default function CollaboratorSection({ task, collaborators = [], onChange }) {
  const dispatch = useDispatch();
  const collaboratorContainerRef = useRef(null);

  const { collaboratorsList = [], collaboratorsLoading } = useSelector(
    (state) => state.actionable
  );

  const [query, setQuery] = useState("");
  const [isActive, setIsActive] = useState(false);

  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  /* -------------------- FOCUS INPUT -------------------- */
  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus();
    }
  }, [isActive]);

  /* -------------------- DEBOUNCED SEARCH -------------------- */
  useEffect(() => {
    if (query.length < 3) return;

    // clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      dispatch(
        fetchCollaborators({
          actionableId: task?.actionableId,
          search: query,
          offset: 0,
        })
      );
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, dispatch, task?.actionableId]);

  /* -------------------- FILTER OUT ADDED USERS -------------------- */
  const filteredCollaborators = Array.isArray(collaboratorsList)
    ? collaboratorsList.filter(
        (u) =>
          u?.userCode &&
          !collaborators.some((c) => c.userCode === u.userCode)
      )
    : [];


  /* -------------------- HANDLERS -------------------- */
  const addUser = (user) => {
    onChange([...collaborators, user]);
    setQuery("");
    setIsActive(false);
  };

  const removeUser = (userCode) => {
    onChange(collaborators.filter((c) => c.userCode !== userCode));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        collaboratorContainerRef.current &&
        !collaboratorContainerRef.current.contains(event.target)
      ) {
        setIsActive(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  /* -------------------- UI -------------------- */
  return (
    <div className="relative flex flex-col gap-[8px] pt-[20px]" >
      <span className="text-[20px] text-[#333333] font-[700] uppercase">
        Collaborators
      </span>

      <div className="relative flex flex-col" ref={collaboratorContainerRef}>
              {/* CLICKABLE CONTAINER */}
      <div
        onClick={() => setIsActive(true)}
        className="border-[1.4px] border-[#CCCCCC] rounded-[4px] p-[8px] flex items-center flex-wrap gap-x-[8px] gap-y-[10px] cursor-text min-h-[48px]"
      >
        {collaborators.length === 0 && !isActive && (
          <span className="pl-[8px] font-[500] text-[#999999]">
            Type at least 3 chars to see matching collaborators
          </span>
        )}

        {collaborators.map((u) => (
          <div
            key={u.userCode}
            className="flex items-center gap-[6px] border border-[#B1B1B1] rounded-full px-[6px] py-[4px] h-[32px]"
          >
            {/* <div className="w-[24px] h-[24px] bg-[#CCCCCC] rounded-full" /> */}
            <Image src={u?.dp || u?.dpURL} alt="Collaborator Avatar" width={24} height={24} className="h-[24px] w-[24px] rounded-full bg-[#CCCCCC] object-cover" />
            <span className="text-[14px] font-[500]">{u.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeUser(u.userCode);
              }}
              className="pr-[6px]"
            >
              ✕
            </button>
          </div>
        ))}

        {isActive && (
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 outline-none min-w-[120px] pl-[8px]"
          />

        )}
      </div>

      {/* DROPDOWN */}
      {query.length >= 3 && (
        <div
          className="absolute left-0 top-[calc(100%+2px)] min-h-[250px] w-full
            rounded-[4px] bg-white z-[10] overflow-auto"
          style={{ boxShadow: "0px 4px 4px 0px #A4A3A340" }}
        >
          {filteredCollaborators.length > 0 ?
            filteredCollaborators.map((u) => (
              <div
                key={u.userCode}
                onClick={() => addUser(u)}
                className="flex items-center gap-[8px] px-[20px] py-[12px] hover:bg-[#FAFAFA] cursor-pointer font-[500]"
              > 
                <Image src={u?.dpURL} alt="Collaborator Avatar" width={32} height={32} className="min-h-[32px] min-w-[32px] rounded-full bg-[#CCCCCC]" />
                {u.name}
              </div>
            ))
          :
              <div className="w-full min-h-[250px] flex flex-col items-center gap-[10px] justify-center">
                  <div className="bg-[#D3E3FD] h-[60px] w-[60px] rounded-full mb-[10px] grid place-items-center">
                    <Image src={'/logo/no-search.svg'} alt="No Search" width={38} height={38}/>
                  </div>
                  <div className="text-[20px] font-[600]">No collaborator found</div>
                  <div className="text-[14px] text-[#666666] leading-[30px]">Try adjusting your search or filters.</div>
              </div>
          }

        </div>
      )}

      </div>

    </div>
  );
}
