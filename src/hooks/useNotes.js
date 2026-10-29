"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteVendorNote, getVendorNotes } from "@/services/vendor.service";

// Notes kept against vendors/resources: { [rowId]: [{ id, text, createdAt }] }, newest first.
// Vendor notes are loaded from the API when a row's notes are opened. Resources have no notes API yet, and there are
// no add note API yet, so added notes only live in memory until the page reloads.
const NOTES_LIMIT = 50;

const FETCH_NOTES = {
  vendors: (rowId) => getVendorNotes({ vendorId: rowId, start: 0, offset: NOTES_LIMIT }),
};

const DELETE_NOTE = {
  vendors: deleteVendorNote,
};

// API note -> { id, text, createdAt }
const toNote = (n) => ({
  id: n.noteId ?? n._id ?? n.id,
  text: n.note ?? n.text ?? n.notes ?? n.description ?? "",
  createdAt: n.createdAt ?? n.createdOn ?? n.updatedAt,
});

export default function useNotes(tab) {
  const [notes, setNotes] = useState({});
  const [loadingNotes, setLoadingNotes] = useState({}); // { [rowId]: true } while its notes load
  const fetchedRef = useRef(new Set()); // rows whose notes have been loaded for this tab

  // Notes from older builds were kept in this browser; they're no longer used
  useEffect(() => {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith("notes:"))
        .forEach((key) => localStorage.removeItem(key));
    } catch {}
  }, []);

  useEffect(() => {
    setNotes({});
    setLoadingNotes({});
    fetchedRef.current = new Set();
  }, [tab]);

  // Loads a row's notes the first time they're opened
  const loadNotes = useCallback(
    async (rowId) => {
      const fetchNotes = FETCH_NOTES[tab];
      const fetched = fetchedRef.current;
      if (!fetchNotes || fetched.has(rowId)) return;

      fetched.add(rowId);
      setLoadingNotes((prev) => ({ ...prev, [rowId]: true }));
      try {
        const { result } = await fetchNotes(rowId);
        if (fetchedRef.current !== fetched) return; // tab changed meanwhile
        // Keep any notes added while the request was in flight
        setNotes((prev) => ({ ...prev, [rowId]: [...(prev[rowId] || []), ...result.map(toNote)] }));
      } catch {
        fetched.delete(rowId); // retried next time the notes are opened
      } finally {
        if (fetchedRef.current === fetched) {
          setLoadingNotes(({ [rowId]: _, ...rest }) => rest);
        }
      }
    },
    [tab]
  );

  const addNote = useCallback(
    (rowId, text) =>
      setNotes((prev) => ({
        ...prev,
        [rowId]: [
          // local: not saved on the server yet
          { id: `${Date.now()}`, text, createdAt: new Date().toISOString(), local: true },
          ...(prev[rowId] || []),
        ],
      })),
    []
  );

  // Throws if the API call fails, so the caller can show the error
  const deleteNote = useCallback(
    async (rowId, noteId) => {
      const note = notes[rowId]?.find((t) => t.id === noteId);
      const deleteOnServer = DELETE_NOTE[tab];
      if (deleteOnServer && note && !note.local) await deleteOnServer(noteId);

      setNotes((prev) => {
        const remaining = (prev[rowId] || []).filter((t) => t.id !== noteId);
        const { [rowId]: _, ...rest } = prev;
        return remaining.length ? { ...rest, [rowId]: remaining } : rest;
      });
    },
    [tab, notes]
  );

  // Used when the vendor/resource itself is deleted
  const clearNotes = useCallback(
    (rowId) =>
      setNotes((prev) => {
        const { [rowId]: _, ...rest } = prev;
        fetchedRef.current.delete(rowId);
        return rest;
      }),
    []
  );

  return { notes, loadingNotes, loadNotes, addNote, deleteNote, clearNotes };
}
