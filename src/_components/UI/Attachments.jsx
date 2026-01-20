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
          className="h-[120px] border border-dashed border-[#EAEAEA] rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#F6F6F6]"
        >
          <div className="w-[36px] h-[36px] rounded-full bg-blue-600 text-white flex items-center justify-center">
            <IoAdd size={20} />
          </div>
          <p className="text-sm text-gray-600 text-center">
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
                  className="absolute top-1 right-1 w-[18px] h-[18px] bg-black/60 rounded-full flex items-center justify-center text-white z-10"
                >
                  <IoClose size={12} />
                </button>

                {/* Preview */}
                {isImage ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="w-full h-full object-cover"
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
          <button
            onClick={() => inputRef.current.click()}
            className="w-[80px] h-[100px] border border-dashed border-[#EAEAEA] rounded-lg flex flex-col items-center justify-center gap-1 text-gray-600"
          >
            <IoAdd size={20} />
            <span className="text-xs">Add more</span>
          </button>
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
