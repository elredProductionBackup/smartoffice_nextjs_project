// import { useState } from "react";

// export default function CommentsSection() {
//   const [comment, setComment] = useState("");

//   const isDisabled = !comment.trim();

//   return (
//     <div className="flex flex-col gap-[12px] pt-[20px]">
//       <span className="text-[20px] text-[#333333] font-[700] uppercase">
//         Comments
//       </span>

//       <div className="flex gap-[10px] items-center border-[1.4px] border-[#CCCCCC] rounded-[8px] p-[10px]">
//         <div className="w-[32px] h-[32px] bg-gray-300 rounded-full" />

//         {/* INPUT */}
//         <input
//           value={comment}
//           onChange={(e) => setComment(e.target.value)}
//           className="flex-1 border-none outline-none bg-transparent"
//           placeholder="Add a comment"
//         />

//         {/* POST BUTTON */}
//         <button
//           disabled={isDisabled}
//           className={`text-white py-[5px] px-[24px] rounded-[100px] bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)]
//             transition-opacity cursor-pointer
//             ${isDisabled ? "opacity-50 cursor-not-allowed" : "opacity-100"}
//           `}
//         >
//           Post
//         </button>
//       </div>
//     </div>
//   );
// }










import { useState } from "react";

export default function CommentsSection({ comments = [], onAdd, onDelete }) {
  const [comment, setComment] = useState("");
  const [showAll, setShowAll] = useState(false);

  const isDisabled = !comment.trim();

const handlePost = () => {
  if (isDisabled) return;

  onAdd({
    id: Date.now(),
    text: comment.trim(),
    author: "Meezan",
    createdAt: new Date().toISOString(), // ✅ TIMESTAMP
  });

  setComment("");
};

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "min", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}


  return (
    <div className="flex flex-col gap-[14px] pt-[20px]">
      <span className="text-[20px] text-[#333333] font-[700] uppercase">
        Comments
      </span>

      {/* INPUT */}
      <div className="flex gap-[10px] items-center border-[1.4px] border-[#CCCCCC] rounded-[8px] p-[10px]">
        <div className="w-[32px] h-[32px] bg-gray-300 rounded-full" />

        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="flex-1 border-none outline-none bg-transparent"
          placeholder="Add a comment"
        />

        <button
          onClick={handlePost}
          disabled={isDisabled}
          className={`text-white py-[5px] px-[24px] rounded-[100px]
            bg-[linear-gradient(95.15deg,#5597ED_3.84%,#00449C_96.38%)]
            transition-opacity
            ${isDisabled ? "opacity-50 cursor-not-allowed" : "opacity-100"}
          `}
        >
          Post
        </button>
      </div>

      {/* COUNT + TOGGLE */}
      <div className="flex justify-between items-center">
        <span className="text-[16px] font-[600] text-[#333]">
          Comments ({comments.length})
        </span>

        {comments.length > 0 && (
          <button
            onClick={() => setShowAll((p) => !p)}
            className="flex items-center gap-[2px] text-[16px] font-[600] cursor-pointer"
          >
            All
            <span className={`grid place-items-center transition-transform text-[#999999] ${showAll ? "" : "rotate-180"}`}>
              <span className="iconamoon--arrow-up-2-duotone"></span>
            </span>
          </button>
        )}
      </div>

      {/* COMMENTS */}
      {showAll && comments.length > 0 && (
        <div className="flex flex-col gap-[20px] pt-[20px]">
          {comments.map((c) => (
            <div
              key={c.id}
             className="flex gap-[10px] items-start border-b border-[#D4DFF1] pb-[20px] last:border-b-0 last:pb-0"

            >
              <div className="w-[32px] h-[32px] bg-gray-300 rounded-full shrink-0" />

              <div className="flex-1">
                {/* AUTHOR */}
               <div className="flex items-center gap-[20px] h-[32px]">
                  <span className="text-[18px] font-[700] text-[#333333]">
                    {c.author}
                  </span>

                  <span className="text-[12px] text-[#999999]">
                    {timeAgo(c.createdAt)}
                  </span>
                </div>

                {/* TEXT */}
                <p className="font-[500] text-[#333] mt-[2px]">
                  {c.text}
                </p>
              </div>

              <button
                onClick={() => onDelete(c.id)}
                className="text-[#666666] cursor-pointer"
              >
                <span className="fluent--delete-16-regular"></span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
