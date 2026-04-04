const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function getJstMondayUtc(): string {
  const jstNow = new Date(Date.now() + JST_OFFSET_MS);
  const day = jstNow.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(jstNow);
  monday.setUTCDate(monday.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  return new Date(monday.getTime() - JST_OFFSET_MS).toISOString();
}

export function getJstDayOfWeek(isoString: string): number {
  const day = new Date(new Date(isoString).getTime() + JST_OFFSET_MS).getUTCDay();
  return day === 0 ? 6 : day - 1;
}

export function formatJstDate(isoString: string): string {
  const d = new Date(new Date(isoString).getTime() + JST_OFFSET_MS);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}
