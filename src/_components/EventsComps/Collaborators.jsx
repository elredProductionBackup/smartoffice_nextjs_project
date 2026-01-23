import { useEffect } from "react";
import CollaboratorRow from "./CollaboratorRow";

export function Collaborators({ form, setForm }) {
  const collaborators = form.collaborators || [];

  useEffect(() => {
    if (collaborators.length === 0) {
      setForm({
        ...form,
        collaborators: [{ email: "", point: null }],
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
      collaborators: [...collaborators, { email: "", point: null }],
    });
  };

  const removeCollaborator = (index) => {
    if (collaborators.length === 1) return; // optional safety
    const next = collaborators.filter((_, i) => i !== index);
    setForm({ ...form, collaborators: next });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-[16px] font-[700] text-[#333]">
        Add collaborator
      </label>

      {collaborators.map((c, i) => (
        <CollaboratorRow
          key={i}
          data={c}
          onChange={(v) => updateCollaborator(i, v)}
          onRemove={() => removeCollaborator(i)}
          canRemove={collaborators.length > 1}
        />
      ))}

      <button
        type="button"
        onClick={addCollaborator}
        className="text-[#3B82F6] text-sm font-[600] w-fit"
      >
        Add more
      </button>
    </div>
  );
}
