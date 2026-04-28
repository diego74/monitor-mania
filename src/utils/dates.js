export function filterByDays(records, days) {
  if (!days) return records;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return records.filter((r) => {
    const ts = r.timestamp || r.submittedAt;
    return ts && new Date(ts) >= cutoff;
  });
}

export function filterByDateRange(records, from, to) {
  return records.filter((r) => {
    const ts = r.timestamp || r.submittedAt;
    if (!ts) return true;
    const d = new Date(ts);
    if (from && d < new Date(from)) return false;
    if (to) {
      const toEnd = new Date(to);
      toEnd.setHours(23, 59, 59, 999);
      if (d > toEnd) return false;
    }
    return true;
  });
}

// Mantiene solo el último registro por día (más reciente)
export function dedupeByDay(records) {
  const map = new Map();
  [...records].sort((a, b) => new Date(a.timestamp || a.submittedAt) - new Date(b.timestamp || b.submittedAt))
    .forEach((r) => {
      const ts = r.timestamp || r.submittedAt;
      if (!ts) return;
      const day = new Date(ts).toDateString();
      map.set(day, r);
    });
  return Array.from(map.values());
}

export function formatDate(ts) {
  return new Date(ts).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function formatDateShort(ts) {
  return new Date(ts).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

export function daysSince(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
