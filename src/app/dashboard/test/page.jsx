'use client'
import { fetchCollaborators } from "@/store/actionable/actionableThunks";
import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import MessageList from "./MessageList";

export default function SlackEditor() {
  const dispatch = useDispatch();
  const { collaboratorsList } = useSelector(
    (state) => state.actionable
  );

  const editorRef = useRef(null);

  const [isEmpty, setIsEmpty] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const [hoveredUser, setHoveredUser] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const [messages, setMessages] = useState([]);

  // =========================
  // FETCH USERS
  // =========================
  useEffect(() => {
    dispatch(fetchCollaborators({ search: "", offset: 0 }));
  }, [dispatch]);

  const filtered = collaboratorsList?.filter((u) =>
    u.name.toLowerCase().includes(query.toLowerCase())
  );

  // =========================
  // HANDLE INPUT
  // =========================
  const handleInput = () => {
    const selection = window.getSelection();
    const text = selection.anchorNode?.textContent || "";

    const content = editorRef.current.innerText.trim();
    setIsEmpty(content.length === 0);

    const match = text.slice(0, selection.anchorOffset).match(/@(\w*)$/);

    if (match) {
      setQuery(match[1]);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  // =========================
  // ADD MESSAGE
  // =========================
  const addMessage = () => {
    const html = editorRef.current.innerHTML.trim();
    const text = editorRef.current.innerText.trim();

    if (!text) return;

    const newMessage = {
      id: Date.now(),
      html,
    };

    setMessages((prev) => [newMessage, ...prev]);

    editorRef.current.innerHTML = "";
    setIsEmpty(true);
  };

  // =========================
  // KEYBOARD CONTROL
  // =========================
  const handleKeyDown = (e) => {
    if (showDropdown) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0
        );
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1
        );
      }

      if (e.key === "Enter") {
        e.preventDefault();
        insertMention(filtered[activeIndex]);
      }

      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      addMessage();
    }
  };

  // =========================
  // INSERT MENTION
  // =========================
  const insertMention = (user) => {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    range.setStart(
      range.startContainer,
      range.startOffset - query.length - 1
    );
    range.deleteContents();

    const el = document.createElement("span");
    el.textContent = `@${user.name}`;
    el.className =
      "text-blue-500 font-medium bg-blue-100 px-1 rounded cursor-pointer";

    // ✅ FIX: use userCode
    el.setAttribute("data-id", String(user.userCode));
    el.setAttribute("data-name", user.name);

    el.contentEditable = "false";

    range.insertNode(el);

    const space = document.createTextNode("\u00A0");
    el.after(space);

    range.setStartAfter(space);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);

    setShowDropdown(false);
    setQuery("");
  };

  // =========================
  // LIST TOOLTIP (FIXED 🔥)
  // =========================
  const handleListHover = (e) => {
    const el = e.target.closest("[data-id]");
    if (!el) return;

    const userId = el.getAttribute("data-id");

    // ✅ FIX: match with userCode
    const user = collaboratorsList.find(
      (u) => String(u.userCode) === String(userId)
    );

    if (!user) return;

    const rect = el.getBoundingClientRect();

    setHoveredUser(user);
    setTooltipPos({
      top: rect.top,
      left: rect.left + rect.width / 2,
    });
  };

  const handleListLeave = () => {
    setHoveredUser(null);
  };
const handleHover = (e) => {
  const el = e.target.closest("[data-id]");

  // ❌ If NOT hovering mention → instantly close
  if (!el) {
    if (hoveredUser !== null) {
      setHoveredUser(null);
    }
    return;
  }

  const userId = el.getAttribute("data-id");

  const user = collaboratorsList.find(
    (u) => String(u.userCode) === String(userId)
  );

  if (!user) {
    setHoveredUser(null);
    return;
  }

  const rect = el.getBoundingClientRect();

  setHoveredUser(user);
  setTooltipPos({
    top: rect.top,
    left: rect.left + rect.width / 2,
  });
};

  const handleLeave = () => {
    setHoveredUser(null);
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-20">
      {/* ================= EDITOR ================= */}
      <div className="relative border rounded-xl p-2">
        {isEmpty && (
          <div className="absolute left-4 top-4 text-gray-400 pointer-events-none">
            Type @ to mention...
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
           onMouseMove={handleHover}

          className="min-h-[100px] p-2 focus:outline-none"
          suppressContentEditableWarning
        />

        {/* DROPDOWN */}
        {showDropdown && filtered.length > 0 && (
          <div className="absolute top-[100%] left-0 w-full border mt-2 rounded-xl shadow bg-white max-h-60 overflow-y-auto">
            {filtered.map((user, index) => (
              <div
                key={user.userCode}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(user);
                }}
                className={`p-3 cursor-pointer flex items-center gap-2 ${index === activeIndex
                    ? "bg-gray-200"
                    : "hover:bg-gray-100"
                  }`}
              >
                <img src={user.dpURL} className="w-6 h-6 rounded-full" />
                <span>{user.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= LIST ================= */}
      <MessageList
        messages={messages}
         onHover={handleHover}
      />

      {/* ================= TOOLTIP ================= */}
      {hoveredUser && (
        <div
          style={{
            position: "fixed",
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: "translate(-50%, -110%)",
          }}
          className="z-50 bg-[#1f1f1f] text-white px-3 py-2 rounded-xl shadow-xl min-w-[180px]"
        >
          <div className="flex items-center gap-2">
            <img
              src={hoveredUser.dpURL}
              className="w-8 h-8 rounded-full"
            />
            <div className="font-semibold text-sm">
              {hoveredUser.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}