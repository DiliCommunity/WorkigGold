/**
 * Парсинг даты публикации объявления с бирж.
 * Поддерживает: DD.MM.YYYY, DD.MM.YYYY в HH:MM, ISO, "сегодня", "вчера", timestamp.
 */
export function parsePostedDate(
  text: string | undefined | null,
  isoString?: string | number | null
): Date | null {
  if (!text && !isoString) return null;

  // ISO или timestamp из API (Kwork и др.)
  if (isoString) {
    const d = new Date(isoString);
    if (!isNaN(d.getTime())) return d;
  }

  const raw = (text ?? "").trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();

  // "сегодня" / "today"
  if (lower.includes("сегодня") || lower.includes("today")) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // "вчера" / "yesterday"
  if (lower.includes("вчера") || lower.includes("yesterday")) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // DD.MM.YYYY или DD.MM.YYYY в HH:MM
  const dmY = raw.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (dmY) {
    const [, day, month, year] = dmY;
    const d = new Date(parseInt(year!, 10), parseInt(month!, 10) - 1, parseInt(day!, 10));
    if (!isNaN(d.getTime())) return d;
  }

  // YYYY-MM-DD
  const iso = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const [, year, month, day] = iso;
    const d = new Date(parseInt(year!, 10), parseInt(month!, 10) - 1, parseInt(day!, 10));
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}
