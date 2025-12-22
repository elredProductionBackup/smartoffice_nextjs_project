export function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function getEndOfWeek(date) {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

export function addWeeks(date, weeks) {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

export function formatWeekRange(date) {
  const start = getStartOfWeek(date);
  const end = getEndOfWeek(date);

  const month = start.toLocaleString("default", { month: "long" });
  const year = start.getFullYear();

  return {
    label: `${start.getDate()} – ${end.getDate()}`,
    month,
    year
  };
}
