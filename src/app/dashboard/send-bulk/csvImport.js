// CSV import helpers for ContactsModal: parsing, column guessing and row validation.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Fields a CSV column can be mapped to. `required` fields must be mapped and
// filled on every row — the backend rejects a group save if any contact lacks a phone.
export const CSV_FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "phone", label: "Phone", required: true },
  { key: "email", label: "Email", required: false },
];

// RFC 4180-style parser: quoted cells, escaped quotes ("") and line breaks inside quotes.
// Returns { headers: string[], rows: string[][] }.
export function parseCsv(text) {
  const src = String(text || "").replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] || "";
  // Excel in some locales exports with ";" instead of ","
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";

  const records = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      records.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    records.push(row);
  }

  // Keep each record's spreadsheet row number (1-based) so issues can point at it
  const nonEmpty = records
    .map((cells, i) => ({ cells, rowNumber: i + 1 }))
    .filter(({ cells }) => cells.some((c) => c.trim() !== ""));
  if (nonEmpty.length === 0) return { headers: [], rows: [], rowNumbers: [] };

  const [headerRow, ...dataRows] = nonEmpty;
  const width = Math.max(...nonEmpty.map(({ cells }) => cells.length));
  const headers = Array.from({ length: width }, (_, i) => headerRow.cells[i]?.trim() || `Column ${i + 1}`);
  return {
    headers,
    rows: dataRows.map(({ cells }) => headers.map((_, i) => (cells[i] || "").trim())),
    rowNumbers: dataRows.map(({ rowNumber }) => rowNumber),
  };
}

const normalizeHeader = (h) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

const HEADER_GUESSES = {
  name: {
    exact: ["name", "fullname", "contactname", "membername", "attendeename", "personname"],
    contains: ["name"],
    exclude: ["company", "group", "user", "org", "first", "last", "event", "file"],
  },
  phone: {
    exact: ["phone", "phonenumber", "mobile", "mobilenumber", "whatsapp", "whatsappnumber", "contactnumber"],
    contains: ["phone", "mobile", "whatsapp", "cell", "contactno", "number"],
    exclude: ["email"],
  },
  email: {
    exact: ["email", "emailaddress", "emailid", "mail"],
    contains: ["email", "mail"],
    exclude: [],
  },
};

// Best-guess column index for each field (-1 when nothing fits).
export function guessMapping(headers) {
  const normalized = headers.map(normalizeHeader);
  const taken = new Set();
  const mapping = {};

  CSV_FIELDS.forEach(({ key }) => {
    const { exact, contains, exclude } = HEADER_GUESSES[key];
    const free = (i) => !taken.has(i);
    let idx = normalized.findIndex((h, i) => free(i) && exact.includes(h));
    if (idx === -1) {
      idx = normalized.findIndex(
        (h, i) => free(i) && contains.some((c) => h.includes(c)) && !exclude.some((x) => h.includes(x))
      );
    }
    mapping[key] = idx;
    if (idx !== -1) taken.add(idx);
  });

  return mapping;
}

// Strips spaces, dashes, dots and brackets; keeps a leading "+".
function cleanPhone(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const cleaned = trimmed.replace(/[\s().-]/g, "");
  return /^\+?\d{7,15}$/.test(cleaned) ? cleaned : null; // null = present but invalid
}

// Checks one contact. Returns { errors: { name?, phone?, email? }, contact } where
// `contact` holds the trimmed values and the cleaned phone.
export function validateContact({ name = "", phone = "", email = "" }) {
  const errors = {};
  const cleanName = name.trim();
  const cleanEmail = email.trim();
  let cleanedPhone = "";

  if (!cleanName) errors.name = "Name is required";
  if (!phone.trim()) {
    errors.phone = "Phone is required";
  } else {
    cleanedPhone = cleanPhone(phone);
    if (!cleanedPhone) errors.phone = "Enter a valid phone (7–15 digits)";
  }
  if (cleanEmail && !EMAIL_REGEX.test(cleanEmail)) errors.email = "Enter a valid email";

  return { errors, contact: { name: cleanName, phone: cleanedPhone || "", email: cleanEmail } };
}

// Applies the column mapping plus the user's fixes to every row. Nothing is
// dropped: rows with a problem come back in `issues` for the user to fix or remove.
// edits:   { [rowIndex]: { name, phone, email } } values typed in the fix popup
// removed: Set of row indexes the user chose to leave out
// Returns { items, ready: [{ name, phone, email }], issues: items with errors }.
export function buildContacts(rows, rowNumbers, mapping, edits = {}, removed = new Set()) {
  const valueAt = (row, key) => (mapping[key] >= 0 ? row[mapping[key]] || "" : "");
  const firstIndexByPhone = new Map();
  const items = [];

  rows.forEach((row, index) => {
    if (removed.has(index)) return;
    const values = edits[index] || {
      name: valueAt(row, "name"),
      phone: valueAt(row, "phone"),
      email: valueAt(row, "email"),
    };
    const { errors, contact } = validateContact(values);

    // Same phone twice would collapse into one contact — flag the later row
    if (!errors.phone) {
      const first = firstIndexByPhone.get(contact.phone);
      if (first !== undefined) errors.phone = `Same phone as row ${rowNumbers[first]}`;
      else firstIndexByPhone.set(contact.phone, index);
    }

    items.push({ index, rowNumber: rowNumbers[index], values, contact, errors, ok: Object.keys(errors).length === 0 });
  });

  return {
    items,
    ready: items.filter((it) => it.ok).map((it) => it.contact),
    issues: items.filter((it) => !it.ok),
  };
}
