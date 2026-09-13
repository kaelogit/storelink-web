/** Human line for menu serves / lead time / duration. */
export function formatMenuMetaLine(row: {
  serves?: number;
  lead_time_hours?: number;
  duration_minutes?: number;
}): string | null {
  const parts: string[] = [];
  if (row.duration_minutes && row.duration_minutes > 0) {
    const m = Math.floor(row.duration_minutes);
    if (m < 60) parts.push(`${m} min`);
    else {
      const h = Math.floor(m / 60);
      const rem = m % 60;
      parts.push(rem === 0 ? (h === 1 ? '1 hr' : `${h} hrs`) : `${h}h ${rem}m`);
    }
  }
  if (row.serves && row.serves > 0) parts.push(`Serves ${row.serves}`);
  if (row.lead_time_hours && row.lead_time_hours > 0) {
    if (row.lead_time_hours >= 24 && row.lead_time_hours % 24 === 0) {
      const days = row.lead_time_hours / 24;
      parts.push(`Order ${days}d ahead`);
    } else if (row.lead_time_hours >= 24) {
      parts.push(`Order ${(row.lead_time_hours / 24).toFixed(1)}d ahead`);
    } else {
      parts.push(`Order ${row.lead_time_hours}h ahead`);
    }
  }
  return parts.length ? parts.join(' · ') : null;
}
