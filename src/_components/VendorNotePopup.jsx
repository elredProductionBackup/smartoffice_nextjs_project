// components/VendorNotePopup.jsx
'use client'
import { useVendorPopup } from "@/store/useVendorPopup";
import { IoClose } from "react-icons/io5";

export default function VendorNotePopup() {
  const { isOpen, activeNote, closePopup, updateNote } = useVendorPopup();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]">
      <div className="bg-white w-[520px] rounded-3xl p-8 relative">
        {/* Close */}
        <button
          onClick={closePopup}
          className="absolute top-6 right-6 text-gray-500 hover:text-black"
        >
          <IoClose size={28} />
        </button>

        {/* Title */}
        <div className="text-2xl font-semibold mb-6">Edit the note</div>

        {/* Textarea */}
        <textarea
          className="w-full h-40 border border-blue-400 rounded-xl p-4 text-lg outline-none"
          value={activeNote.note}
          onChange={(e) => updateNote(e.target.value)}
        />

        {/* Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={closePopup}
            className="px-10 py-3 rounded-full text-white text-lg font-semibold bg-gradient-to-r from-blue-400 to-blue-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
