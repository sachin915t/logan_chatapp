export function parseUtcTimestamp(timestamp) {
  if (!timestamp) return null;
  try {
    let ts = String(timestamp).trim().replace(" ", "T");
    if (!ts.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(ts)) ts += "Z";
    const date = new Date(ts);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export function formatLocalTime(timestamp) {
  const date = parseUtcTimestamp(timestamp);
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function timeAgo(timestamp) {
  const date = parseUtcTimestamp(timestamp);
  if (!date) return "No activity";

  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";

  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} min ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;

  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function sameLocalDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getLocalDayKey(timestamp) {
  const date = parseUtcTimestamp(timestamp);
  if (!date) return null;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function formatDayLabel(timestamp) {
  const date = parseUtcTimestamp(timestamp);
  if (!date) return "";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (sameLocalDay(date, today)) return "Today";
  if (sameLocalDay(date, yesterday)) return "Yesterday";

  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  }).format(date);
}

export function chatSpansMultipleDays(messages) {
  const keys = new Set();
  for (const msg of messages) {
    const key = getLocalDayKey(msg.timestamp);
    if (key) keys.add(key);
    if (keys.size > 1) return true;
  }
  return false;
}
