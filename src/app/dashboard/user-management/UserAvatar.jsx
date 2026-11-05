"use client";

import { useState } from "react";

export const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

// Profile photo when the user has one (and it loads); coloured initials otherwise.
// className sets the size and text size; the circle and centring come from here.
export default function UserAvatar({ user, className = "" }) {
  const [brokenSrc, setBrokenSrc] = useState(null);
  const showImage = user.dpURL && brokenSrc !== user.dpURL;

  return (
    <div
      className={`rounded-full overflow-hidden grid place-items-center text-white font-bold shrink-0 ${
        user.status === "deactivated" ? "opacity-50" : ""
      } ${className}`}
      style={{ backgroundColor: user.color }}
    >
      {showImage ? (
        // Plain img: dpURLs come from the API's storage host, which next/image isn't configured for
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.dpURL} alt="" className="w-full h-full object-cover object-[50%_30%]" onError={() => setBrokenSrc(user.dpURL)} />
      ) : (
        getInitials(user.name)
      )}
    </div>
  );
}
