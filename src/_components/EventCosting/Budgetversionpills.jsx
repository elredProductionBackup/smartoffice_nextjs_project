import { useState } from "react";
import { GitBranch, X } from "lucide-react";

export function BudgetVersionPills({
  versions,
  latestVersionId,
  onAddVersion,
  onRemoveVersion,
}) {
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [newPax, setNewPax] = useState(0);

  const submit = () => {
    const pax = parseInt(newPax, 10);

    onAddVersion(pax);
    setNewPax(0);
    setShowAddVersion(false);
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2 mb-4">
          <button
            onClick={submit}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            <GitBranch className="w-4 h-4" />
            Add Version
          </button>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {versions.map((v) => (
          <div
            key={v.id}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              v.id === latestVersionId
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            <span>
              {v.label} 
              {/* — {v.paxLabel} */}
            </span>

            {versions.length > 1 && (
              <button
                onClick={() => onRemoveVersion(v.id)}
                className="opacity-60 hover:opacity-100 transition-opacity ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">
          <span>Actual Amount</span>
        </div>
      </div>
    </>
  );
}