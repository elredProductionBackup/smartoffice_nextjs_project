import Image from "next/image";
import { useRef } from "react";
import { IoClose } from "react-icons/io5";

export function Attachments({ value, onChange }) {
  const inputRef = useRef(null);

const handleFiles = (files) => {
  const mapped = Array.from(files).map((file) => ({
    id: crypto.randomUUID(),
    file,
    previewUrl: file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : null,
  }));

  onChange([...value, ...mapped]);
};

const removeFile = (id) => {
  const fileToRemove = value.find((v) => v.id === id);

  if (fileToRemove?.previewUrl) {
    URL.revokeObjectURL(fileToRemove.previewUrl);
  }

  onChange(value.filter((v) => v.id !== id));
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

      {value.length > 0 && (
        <div className="flex items-center gap-[20px] flex-wrap">
          {value.map((item) => {
            const isImage = item.file.type.startsWith("image/");

            return (
              <div
                key={item.id}
                className="relative w-[80px] h-[100px] rounded-lg overflow-hidden border border-[#EAEAEA] bg-[#F6F6F6]"
              >
                <button
                  onClick={() => removeFile(item.id)}
                  className="absolute top-1 right-1 w-[20px] h-[20px] bg-black/50 rounded-full flex items-center justify-center text-white z-10"
                >
                  <IoClose size={16} />
                </button>

                {isImage ? (
                  <Image
                    src={item.previewUrl}
                    alt="Attachment Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-600 px-2 text-center">
                    {item.file.name}
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
