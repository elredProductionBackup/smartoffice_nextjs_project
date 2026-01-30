"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCollaborators } from "@/store/events/eventsThunks";
import CollaboratorRow from "./CollaboratorRow";

export function Collaborators({ form, setForm }) {
  const collaborators = form.collaborators || [];
  const apiCollaborators = useSelector((s) => s.events.collaboratorsList) || [];

  const [query, setQuery] = useState("");
  const debounceRef = useRef(null);
  const dispatch = useDispatch();

  // Initialize with one empty collaborator if none exist
  useEffect(() => {
    if (collaborators.length === 0) {
      setForm({
        ...form,
        collaborators: [{ userCode: "", name: "", email: "", dpURL: "", point: 1 }],
      });
    }
  }, []);

  // Debounced collaborator search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      dispatch(fetchCollaborators({ search: query, offset: 0 }));
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, dispatch]);

  // Filter collaborators to exclude already selected
  const filteredCollaborators = apiCollaborators.filter(
    (u) => u?.userCode && !collaborators.some((c) => c.userCode === u.userCode)
  );

  const updateCollaborator = (index, value) => {
    const next = [...collaborators];
    next[index] = value;
    setForm({ ...form, collaborators: next });
  };

  const addCollaborator = () => {
    setForm({
      ...form,
      collaborators: [
        ...collaborators,
        { userCode: "", name: "", email: "", dpURL: "", point: 1 },
      ],
    });
  };

  const removeCollaborator = (index) => {
    if (collaborators.length === 1) return;
    setForm({ ...form, collaborators: collaborators.filter((_, i) => i !== index) });
  };

  return (
    <div className="flex flex-col">
      <label className="text-[16px] mb-[6px] font-[700] text-[#333]">Add collaborator</label>

      <div className="flex flex-col gap-[10px]">
        {collaborators.map((c, i) => (
          <CollaboratorRow
            key={i}
            data={c}
            collaborators={filteredCollaborators}
            selectedUserCodes={collaborators
              .filter((_, idx) => idx !== i)
              .map((x) => x.userCode)
              .filter(Boolean)}
            onChange={(v) => updateCollaborator(i, v)}
            onRemove={() => removeCollaborator(i)}
            canRemove={collaborators.length > 1}
            setQuery={setQuery}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addCollaborator}
        className="text-[#0B57D0] text-[18px] mt-[10px] ml-[10px] font-[600] w-fit cursor-pointer"
      >
        Add more
      </button>
    </div>
  );
}
