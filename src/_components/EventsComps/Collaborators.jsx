import { useEffect } from "react";
import CollaboratorRow from "./CollaboratorRow";

export function Collaborators({ form, setForm }) {
  const collaborators = form.collaborators || [];

useEffect(() => {
  if (collaborators.length === 0) {
    setForm({
      ...form,
      collaborators: [{ name: "", point: null }],
    });
  }
}, []);

  const updateCollaborator = (index, value) => {
    const next = [...collaborators];
    next[index] = value;
    setForm({ ...form, collaborators: next });
  };

  const addCollaborator = () => {
    setForm({
      ...form,
      collaborators: [...collaborators, { name: "", point: null }],
    });
  };


  const removeCollaborator = (index) => {
    if (collaborators.length === 1) return; // optional safety
    const next = collaborators.filter((_, i) => i !== index);
    setForm({ ...form, collaborators: next });
  };

  return (
    <div className="flex flex-col">
      <label className="text-[16px] mb-[6px] font-[700] text-[#333]">
        Add collaborator
      </label>

      <div className="flex flex-col gap-[10px]">
        {collaborators.map((c, i) => (
          <CollaboratorRow
            key={i}
            data={c}
            selectedNames={collaborators
              .filter((_, idx) => idx !== i)
              .map((x) => x.name)
              .filter(Boolean)}
            onChange={(v) => updateCollaborator(i, v)}
            onRemove={() => removeCollaborator(i)}
            canRemove={collaborators.length > 1}
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
