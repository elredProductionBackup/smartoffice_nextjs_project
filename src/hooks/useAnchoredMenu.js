import { useEffect, useLayoutEffect, useRef } from "react";

const GAP = 6;

// Starting style for the menu: fixed and hidden until it's measured and placed
export const ANCHORED_MENU_STYLE = { position: "fixed", top: 0, left: 0, visibility: "hidden" };

// Positions a popup menu with position: fixed next to its trigger, so scroll containers
// (e.g. an overflow-x-auto table) can't clip it. Opens below, or above when there's no room.
// align="end" lines the menu up with the trigger's right edge.
// Closes on outside click, Escape, scroll and resize. Render the menu in a portal with ANCHORED_MENU_STYLE.
export function useAnchoredMenu(open, setOpen, { align = "start" } = {}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!open || !triggerRef.current || !menu) return;
    const t = triggerRef.current.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    const fitsBelow = t.bottom + GAP + m.height <= window.innerHeight;
    const top = fitsBelow || t.top - GAP - m.height < 0 ? t.bottom + GAP : t.top - GAP - m.height;
    const left = align === "end" ? t.right - m.width : t.left;
    menu.style.top = `${top}px`;
    menu.style.left = `${Math.max(8, Math.min(left, window.innerWidth - m.width - 8))}px`;
    menu.style.visibility = "visible";
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDown = (e) =>
      !triggerRef.current?.contains(e.target) && !menuRef.current?.contains(e.target) && close();
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open, setOpen]);

  return { triggerRef, menuRef };
}
