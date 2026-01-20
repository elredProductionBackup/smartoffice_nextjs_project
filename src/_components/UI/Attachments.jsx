import Image from "next/image";
import { useRef } from "react";
import { IoClose, IoAdd } from "react-icons/io5";

export function Attachments({ value, onChange }) {
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    const newFiles = Array.from(files);
    onChange([...value, ...newFiles]);
  };

  const removeFile = (index) => {
    const updated = [...value];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[16px] font-[700] text-[#333333]">
        Attachments
      </span>

      {/* Empty state */}
      {value.length === 0 && (
        <div
          onClick={() => inputRef.current.click()}
          className="h-[120px] border-[1.4px] border-dashed border-[#CCCCCC] rounded-lg flex flex-col items-center justify-center gap-[5px] cursor-pointer bg-[#F6F6F6]"
        >
          <button
              onClick={() => inputRef.current.click()}
              className={`w-[24px] h-[24px] rounded-full flex items-center justify-center text-white text-[24px] bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] cursor-pointer`}
            >
              +
            </button>
          <p className="text-[14px] text-[#333333] text-center">
            Add Documents, Videos, Photos, Reading materials etc
          </p>
        </div>
      )}

      {/* Filled state */}
      {value.length > 0 && (
        <div className="flex items-center gap-[20px] flex-wrap">
          {value.map((file, index) => {
            const isImage = file.type.startsWith("image/");

            return (
              <div
                key={index}
                className="relative w-[80px] h-[100px] rounded-lg overflow-hidden border border-[#EAEAEA] bg-[#F6F6F6]"
              >
                {/* Remove */}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 w-[20px] h-[20px] bg-black/50 rounded-full flex items-center justify-center text-white z-10 cursor-pointer"
                >
                  <IoClose size={16} />
                </button>

                {/* Preview */}
                {isImage ? (
                  <Image
                    src={URL.createObjectURL(file)}
                    alt="Attachments Preview"
                    className="w-full h-full object-cover"
                    width={500}
                    height={500}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-600 px-2 text-center">
                    {file.name}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add more */}
          <div className="w-[80px] h-[100px] flex flex-col items-center justify-center gap-1">
            <button
              onClick={() => inputRef.current.click()}
              className={`w-[24px] h-[24px] rounded-full flex items-center justify-center text-white text-[24px] bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)] cursor-pointer`}
            >
              +
            </button>
              <span className="text-[14px] text-[#333]">Add more</span>
          </div>
        </div>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
