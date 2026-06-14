/**
 * Client-side smart parse fallback — mirrors backend heuristic rules (TR + EN).
 * Used when the parse API is slow, unreachable, or returns an error.
 */

const TR_NUMBERS = {
  bir: 1,
  iki: 2,
  "üç": 3,
  uc: 3,
  "dört": 4,
  dort: 4,
  "beş": 5,
  bes: 5,
  "altı": 6,
  alti: 6,
  yedi: 7,
  sekiz: 8,
  dokuz: 9,
  on: 10,
  yirmi: 20,
  otuz: 30,
  "kırk": 40,
  kirk: 40,
  elli: 50,
  "altmış": 60,
  altmis: 60,
};

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "'");
}

function parseTrNumber(token) {
  if (!token) return null;
  const t = token.trim().toLowerCase();
  if (/^\d+$/.test(t)) return Number(t);
  return TR_NUMBERS[t] ?? null;
}

function parseDurationSeconds(text) {
  if (!text?.trim()) return null;
  const low = text.toLowerCase().replace(/½/g, " yarım ").replace(/buçuk/g, " buçuk ");

  let m = low.match(/\bfor\s+(\d+)\s*(?:minutes?|mins?)\b/);
  if (m) return Math.max(Number(m[1]) * 60, 60);

  if (/\byarım\s+saat\b|\byarim\s+saat\b/.test(low)) return 1800;

  m = low.match(/(?:bir\s+buçuk|bir\s+bucuk|1[,.]5)\s*saat/);
  if (m) return 5400;

  m = low.match(/\b(\d+)\s*saat(?:ler)?(?:\s*(?:ve\s+)?(\d+)\s*(?:dakika|dk))?/);
  if (m) {
    const hours = Number(m[1]);
    const minutes = m[2] ? Number(m[2]) : 0;
    return Math.max(Math.round(hours * 3600 + minutes * 60), 60);
  }

  m = low.match(
    /\b(bir|iki|üç|uc|dört|dort|beş|bes|altı|alti|yedi|sekiz|dokuz|on)\s+saat(?:\s*(?:ve\s+)?(\d+|yarım|yarim|buçuk|bucuk)\s*(?:dakika|dk))?/,
  );
  if (m) {
    const hours = parseTrNumber(m[1]) || 1;
    let minutes = 0;
    if (m[2] && ["yarım", "yarim", "buçuk", "bucuk"].includes(m[2])) minutes = 30;
    else if (m[2]) minutes = parseTrNumber(m[2]) || Number(m[2]) || 0;
    return Math.max(Math.round(hours * 3600 + minutes * 60), 60);
  }

  m = low.match(/\b(\d+)\s*(?:dakika|dk)\b/);
  if (m) return Math.max(Number(m[1]) * 60, 60);

  m = low.match(
    /\b(bir|iki|üç|uc|dört|dort|beş|bes|altı|alti|yedi|sekiz|dokuz|on|yirmi|otuz|kırk|kirk|elli|altmış|altmis|doksan)\s*(?:dakika|dk)\b/,
  );
  if (m) {
    const val = parseTrNumber(m[1]);
    if (val) return Math.max(val * 60, 60);
  }

  m = low.match(/\b(\d+(?:\.\d+)?)\s*hours?(?:\s*(?:and\s+)?(\d+)\s*(?:minutes?|mins?))?/);
  if (m) {
    const hours = Number(m[1]);
    const minutes = m[2] ? Number(m[2]) : 0;
    return Math.max(Math.round(hours * 3600 + minutes * 60), 60);
  }

  m = low.match(/\b(\d+)\s*(?:minutes?|mins?)\b/);
  if (m) return Math.max(Number(m[1]) * 60, 60);

  if (/\bhalf\s+an?\s+hour\b|\bhalf\s+hour\b/.test(low)) return 1800;
  if (/\bone\s+and\s+a\s+half\s+hours?\b|\b1\.5\s+hours?\b/.test(low)) return 5400;

  m = low.match(/\b(15|30|45|60)\s*(?:min|minutes|mins|dk|dakika)?\b/);
  if (m) return Number(m[1]) * 60;

  return null;
}

function nextWeekday(fromDay, weekday) {
  let daysAhead = (weekday - fromDay.getDay() + 7) % 7;
  if (daysAhead === 0) daysAhead = 7;
  const d = new Date(fromDay);
  d.setDate(d.getDate() + daysAhead);
  return d;
}

function resolveDay(text, baseDay) {
  if (/\btomorrow\b|\byarin\b|\byarın\b/.test(text)) {
    const d = new Date(baseDay);
    d.setDate(d.getDate() + 1);
    return { day: d, foundDate: true };
  }
  if (/\btoday\b|\bbugun\b|\bbugün\b/.test(text)) {
    return { day: new Date(baseDay), foundDate: true };
  }
  return { day: new Date(baseDay), foundDate: false };
}

function parseTimeOfDay(text) {
  let m = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (m) {
    let hour = Number(m[1]);
    const minute = Number(m[2] || 0);
    if (m[3] === "pm" && hour !== 12) hour += 12;
    if (m[3] === "am" && hour === 12) hour = 0;
    return { hour, minute };
  }

  m = text.match(/(?:\bat\s+)?(\d{1,2})[.:](\d{2})(?:\s*(?:am|pm))?(?:\s*(?:'da|'de|da|de))?\b/);
  if (m) {
    const hour = Number(m[1]);
    const minute = Number(m[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }

  m = text.match(/\b(?:at|saat)\s+(\d{1,2})(?!\s*(?:minutes?|mins?|dakika|dk|hours?|saat))\b/);
  if (m) {
    const hour = Number(m[1]);
    if (hour >= 0 && hour <= 23) return { hour, minute: 0 };
  }

  m = text.match(/\b(\d{1,2})(?:[.:](\d{2}))?\s*(?:'da|'de|da|de)\b/);
  if (m) {
    const hour = Number(m[1]);
    const minute = Number(m[2] || 0);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }

  m = text.match(/\bsaat\s+(\d{1,2})(?::(\d{2}))?\b/);
  if (m) {
    const hour = Number(m[1]);
    const minute = Number(m[2] || 0);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }

  return null;
}

function parseScheduledStart(text, timezone, now = new Date()) {
  const norm = normalizeText(text);
  const { day, foundDate } = resolveDay(norm, now);
  const clock = parseTimeOfDay(norm);

  if (!foundDate && !clock) return null;

  const hour = clock?.hour ?? now.getHours();
  const minute = clock?.minute ?? now.getMinutes();
  const start = new Date(day);
  start.setHours(hour, minute, 0, 0);

  return {
    start,
    foundDate,
    foundTime: clock !== null,
  };
}

function inferDifficulty(text) {
  const low = text.toLowerCase();
  if (/\b(easy|kolay)\b/.test(low)) return "EASY";
  if (/\b(hard|zor)\b/.test(low)) return "HARD";
  if (/\b(medium|orta)\b/.test(low)) return "MEDIUM";
  return "MEDIUM";
}

function inferTitle(text) {
  let cleaned = text.trim().replace(/\s+/g, " ");
  if (!cleaned) return "Focus Session";
  for (const marker of [" i will ", " i'll ", " going to ", " çalışacağım", " yapacağım"]) {
    const idx = cleaned.toLowerCase().indexOf(marker);
    if (idx !== -1) {
      const tail = cleaned.slice(idx + marker.length).trim().replace(/^[.\s]+/, "");
      if (tail) cleaned = tail;
      break;
    }
  }
  const title = cleaned.slice(0, 50).trim().replace(/[.\s]+$/, "");
  return title.length >= 3 ? title : "Focus Session";
}

function heuristicConfidence({ foundTime, foundDate, foundDuration }) {
  let score = 0.58;
  if (foundDuration) score += 0.12;
  if (foundTime) score += 0.14;
  if (foundDate) score += 0.06;
  if (foundTime && foundDuration) score += 0.08;
  if (foundTime && foundDate && foundDuration) score += 0.04;
  return Math.min(Math.max(score, 0.5), 0.92);
}

/** @returns {object} API-shaped parse result with source heuristic */
export function heuristicParseTask(text, timezone = "Europe/Istanbul") {
  void timezone;
  const now = new Date();
  const schedule = parseScheduledStart(text, timezone, now);

  let start;
  let foundTime = false;
  let foundDate = false;

  if (schedule) {
    start = schedule.start;
    foundTime = schedule.foundTime;
    foundDate = schedule.foundDate;
  } else {
    start = new Date(now);
    start.setSeconds(0, 0);
  }

  const durationSeconds = parseDurationSeconds(text);
  const foundDuration = durationSeconds !== null;
  const seconds = foundDuration ? durationSeconds : 30 * 60;
  const end = new Date(start.getTime() + seconds * 1000);

  return {
    title: inferTitle(text),
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
    durationSeconds: seconds,
    durationMinutes: Math.max(1, Math.round(seconds / 60)),
    difficulty: inferDifficulty(text),
    description: "Focus session derived from your plan.",
    confidence: heuristicConfidence({ foundTime, foundDate, foundDuration }),
    calendarEligible: true,
    calendarUrl: null,
    source: "heuristic",
  };
}
