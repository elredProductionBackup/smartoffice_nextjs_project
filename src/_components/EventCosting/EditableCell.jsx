import { useRef, useState } from "react";

export function EditableCell({
  value,
  onChange,
  className = "",
  isHighlighted = false,
  editable = true,
}) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(value.toString());
  const prev = useRef(value);

  if (!focused && prev.current !== value) {
    prev.current = value;
    setDraft(value.toString());
  }

  const commit = () => {
    const parsed = parseFloat(draft);

    if (!isNaN(parsed) && parsed >= 0) {
      onChange?.(parsed);
      prev.current = parsed;
    } else {
      setDraft(prev.current.toString());
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
      className={`w-full min-w-[48px] px-1 py-0.5 text-right text-sm bg-transparent border border-transparent rounded focus:border-blue-400 focus:bg-white focus:outline-none hover:border-gray-300 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
        isHighlighted ? "font-medium" : ""
      } ${className}`}
    />
  );
}