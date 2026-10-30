"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addVendorNote,
  deleteVendorNote,
  getVendorNotes,
  updateVendorNote,
} from "@/services/vendor.service";
import {
  addResourceNote,
  deleteResourceNote,
  getResourceNotes,
  updateResourceNote,
} from "@/services/resource.service";

// Notes kept against vendors/resources: { [rowId]: [{ id, text, createdAt }] }, newest first.
// Notes are loaded from the API when a row's notes are opened, and added/deleted through it.
const NOTES_LIMIT = 50;

const FETCH_NOTES = {
  vendors: (rowId) => getVendorNotes({ vendorId: rowId, start: 0, offset: NOTES_LIMIT }),
  resources: (rowId) => getResourceNotes({ resourceId: rowId, start: 0, offset: NOTES_LIMIT }),
};

const ADD_NOTE = {
  vendors: (rowId, text) => addVendorNote({ vendorId: rowId, text }),
  resources: (rowId, text) => addResourceNote({ resourceId: rowId, text }),
};

const UPDATE_NOTE = {
  vendors: (rowId, noteId, text) => updateVendorNote({ vendorId: rowId, noteId, text }),
  resources: (rowId, noteId, text) => updateResourceNote({ resourceId: rowId, noteId, text }),
};

const DELETE_NOTE = {
  vendors: deleteVendorNote,
  resources: deleteResourceNote,
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
        // Keep any notes added while the request was in flight, without listing them twice
        setNotes((prev) => {
          const current = prev[rowId] || [];
          const currentIds = new Set(current.map((t) => t.id));
          const loaded = result.map(toNote).filter((t) => !currentIds.has(t.id));
          return { ...prev, [rowId]: [...current, ...loaded] };
        });
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

  // Throws if the API call fails, so the form can show the error
  const addNote = useCallback(
    async (rowId, text) => {
      const addOnServer = ADD_NOTE[tab];
      // local: not saved on the server
      let note = { id: `${Date.now()}`, text, createdAt: new Date().toISOString(), local: true };

      if (addOnServer) {
        const saved = await addOnServer(rowId, text);
        const savedNote = saved ? toNote(saved) : {};
        if (!savedNote.id) {
          // Response didn't include the note, so reload the list to get its id
          const { result } = await FETCH_NOTES[tab](rowId);
          setNotes((prev) => ({ ...prev, [rowId]: result.map(toNote) }));
          return;
        }
        note = { ...note, ...savedNote, text: savedNote.text || text, local: false };
      }

      setNotes((prev) => ({ ...prev, [rowId]: [note, ...(prev[rowId] || [])] }));
    },
    [tab]
  );

  // Throws if the API call fails, so the form can show the error
  const editNote = useCallback(
    async (rowId, noteId, text) => {
      const note = notes[rowId]?.find((t) => t.id === noteId);
      const updateOnServer = UPDATE_NOTE[tab];
      if (updateOnServer && note && !note.local) await updateOnServer(rowId, noteId, text);

      setNotes((prev) => ({
        ...prev,
        [rowId]: (prev[rowId] || []).map((t) => (t.id === noteId ? { ...t, text } : t)),
      }));
    },
    [tab, notes]
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

  return { notes, loadingNotes, loadNotes, addNote, editNote, deleteNote, clearNotes };
}
