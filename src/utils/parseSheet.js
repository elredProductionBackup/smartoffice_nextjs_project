// Reads an uploaded attendee sheet into { headers, rows }; each row is { cells: trimmed strings, line }.
// CSV is parsed here; .xlsx/.xls go through SheetJS (`xlsx`).

// RFC 4180-style CSV: quoted fields, "" escapes, commas/newlines inside quotes, CRLF, BOM
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// First worksheet of an .xlsx/.xls. raw values keep long mobile numbers intact
// (formatted text would show 919876543210 as 9.19877E+11). SheetJS loads only when needed.
async function readExcel(file) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer());
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws?.["!ref"]) return { rows: [], firstLine: 1 };
  return {
    rows: XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "", blankrows: true }),
    // The used range can start below row 1 when the top rows are empty
    firstLine: XLSX.utils.decode_range(ws["!ref"]).s.r + 1,
  };
}

export async function parseSheet(file) {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

  const { rows: raw, firstLine } =
    ext === ".csv"
      ? { rows: parseCsv((await file.text()).replace(/^﻿/, "")), firstLine: 1 }
      : await readExcel(file).catch(() => {
          throw new Error("Couldn't read this Excel file. Check it opens in Excel, or save it as CSV and upload that.");
        });

  // `line` is the row number as the sheet shows it, so skipped rows can be reported back
  const all = raw
    .map((r, i) => ({ cells: r.map((v) => String(v ?? "").trim()), line: firstLine + i }))
    // Drop fully blank lines anywhere in the sheet
    .filter((r) => r.cells.some(Boolean));

  if (!all.length) throw new Error("This sheet is empty. Add a header row and at least one attendee.");

  const [header, ...rows] = all;
  return { headers: header.cells, rows };
}
