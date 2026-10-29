import { useState } from "react";

export function EditableCell({
  value,
  onChange,
  className = "",
  isHighlighted = false,
  editable = true,
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(value.toString());
  // Last value we synced from props / committed. Kept in state (not a ref) so
  // it can be compared during render to re-sync the draft when the prop changes.
  const [prev, setPrev] = useState(value);

  if (!focused && !Object.is(prev, value)) {
    setPrev(value);
    setDraft(value.toString());
  }

  const commit = () => {
    const parsed = parseFloat(draft);

    if (!isNaN(parsed) && parsed >= 0) {
      onChange?.(parsed);
      setPrev(parsed);
    } else {
      setDraft(prev.toString());
    }

    setFocused(false);
  };

  // Read-only mode
  if (!editable) {
    return (
      <div
        className={`w-full min-w-[48px] px-1 py-0.5 text-right text-sm ${
          isHighlighted ? "font-medium" : ""
        } ${className}`}
      >
        {value}
      </div>
    );
  }

  return (
    <input
      type="number"
      min="0"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.target.blur();
        }
      }}
      className={`w-full min-w-[48px] px-1 py-0.5 text-right text-base md:text-sm bg-transparent border border-transparent rounded focus:border-blue-400 focus:bg-white focus:outline-none hover:border-gray-300 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
        isHighlighted ? "font-medium" : ""
      } ${className}`}
    />
  );
}