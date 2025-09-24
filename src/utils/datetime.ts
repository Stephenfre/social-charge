export function toMinutes12(t: string) {
  // "h:mm AM/PM"
  const m = t.match(/^(\d{1,2}):([0-5]\d)\s?(AM|PM)$/i);
  if (!m) return NaN;
  let hh = Number(m[1]);
  const mm = Number(m[2]);
  const mer = m[3].toUpperCase();
  if (hh === 12) hh = 0; // 12:xx AM -> 00:xx
  if (mer === 'PM') hh += 12; // PM add 12
  return hh * 60 + mm;
}

export function combine(dateISO: string, time12: string) {
  // dateISO: "YYYY-MM-DD", time12: "h:mm AM/PM"
  const parts = dateISO.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new RangeError(`Invalid date string: ${dateISO}`);
  }
  const [y, mo, d] = parts;

  const total = toMinutes12(time12);
  if (Number.isNaN(total)) {
    throw new RangeError(`Invalid time string: ${time12}`);
  }
  const h = Math.floor(total / 60);
  const m = total % 60;

  // Construct safely
  const dt = new Date(y, mo - 1, d, h, m, 0, 0);
  if (Number.isNaN(dt.getTime())) {
    throw new RangeError(`Invalid Date from (${dateISO}, ${time12})`);
  }
  return dt;
}
