"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { addToast } from "@/store/toastSlice";
import { useDispatch } from "react-redux";
import addIcon from "@/assets/logo/add.svg";
import deleteIcon from "@/assets/logo/delete.svg";

export const EventImage = ({ value, onChange }) => {
  const inputRef = useRef(null);
  const dispatch = useDispatch();

  const MAX_SIZE = 2 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      dispatch(addToast({
        message: {
          title: "Invalid Image Type",
          descrip: "Only JPG/PNG files are allowed",
        },
        type: "error",
      }));
      e.target.value = "";
      return;
    }

    if (file.size > MAX_SIZE) {
      dispatch(addToast({
        message: {
          title: "Maximum File Size Exceeded",
          descrip: "The file is too large. Allowed maximum size is 2MB.",
        },
        type: "error",
      }));
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onChange({ file, previewUrl });
  };

  const openGallery = () => {
    inputRef.current?.click();
  };

  useEffect(() => {
    return () => {
      if (value?.previewUrl) {
        URL.revokeObjectURL(value.previewUrl);
      }
    };
  }, [value]);

const isValidPreview =
  (value?.file &&
    ALLOWED_TYPES.includes(value.file.type) &&
    value.file.size <= MAX_SIZE) ||
  (!value?.file && typeof value?.previewUrl === "string");

        const imageSrc = value?.previewUrl;


  return (
    <div className="sticky top-0 flex flex-col items-center gap-[30px]">
      {/* Image Preview */}
      <div className="relative h-[600px] aspect-[3/4] overflow-hidden rounded-[20px] bg-gray-200">

{imageSrc && isValidPreview ? (
  <Image
    src={imageSrc}
    alt="event"
    fill
    sizes="450px"
    className="object-cover border-[1.4px] border-[#EAEAEA] rounded-[20px]"
  />
) : (
         <div className="
            flex flex-col h-full w-full items-center justify-center
            rounded-[20px] border-[1.4px] border-[#EAEAEA]
            bg-gradient-to-b from-[#999999] to-[#333333] gap-[20px]"
        >
          <Image src={`/logo/no-image.svg`} alt="Default Image" width={100} height={100}/>
          <span className="text-white text-[20px] font-[600]">
            No event image
          </span>
        </div>


        )}
      </div>

      {/* Controls */}
      <div className="flex gap-[60px]">
        {/* Add / Replace */}
        <div
          onClick={openGallery}
          className="flex flex-col items-center gap-[12px] cursor-pointer w-[120px] "
        >
          <div className="h-[40px] w-[40px] rounded-full bg-[#147BFF1A] grid place-items-center">
            <Image
              src={addIcon}
              alt="Add"
              height={20}
              width={20}
            />
          </div>
          <span className="text-[18px] font-[600] text-[#333333] text-center leading-[125%] font-nunito ">
            Add / Replace<br />image
          </span>
        </div>

        {/* Delete */}
        <div
          onClick={() => {
            onChange({ file: null, previewUrl: null });
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="flex flex-col items-center gap-[12px] cursor-pointer w-[120px]"
        >
          <div className="h-[40px] w-[40px] rounded-full bg-[#FF00001A] grid place-items-center">
            <Image
              src={deleteIcon}
              alt="Delete"
              height={20}
              width={20}
            />
          </div>
          <span className="text-[18px] font-[600] text-[#333333] text-center leading-[125%] font-nunito ">
            Delete<br />image
          </span>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        hidden
        onChange={handleFileChange}
      />
    </div>
  );
};
