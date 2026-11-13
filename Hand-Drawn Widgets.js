// Hand-Drawn Widgets for Scriptable
// Long-press a Scriptable widget > Edit Widget > Script: "Hand-Drawn Widgets"
// Parameter: calendar, clock, weather or events
// Works in Small, Medium and Large widget sizes.

const KIND = ((args.widgetParameter || "calendar") + "").toLowerCase().trim();
const FAM = config.widgetFamily || "medium";
const INK = new Color("#222220");
const CREAM = new Color("#f7f4f0");
const fm = FileManager.iCloud();
const DIR = fm.joinPath(fm.documentsDirectory(), "HandDrawn");
const F = {
  heavy: (s) => Font.heavyRoundedSystemFont(s),
  bold: (s) => Font.boldRoundedSystemFont(s),
  semi: (s) => Font.semiboldRoundedSystemFont(s),
  med: (s) => Font.mediumRoundedSystemFont(s),
};

async function img(name) {
  const f = fm.joinPath(DIR, name + ".png");
  if (!fm.fileExists(f)) return null;
  if (!fm.isFileDownloaded(f)) await fm.downloadFileFromiCloud(f);
  return fm.readImage(f);
}
async function bg(kind) {
  const fam = FAM === "large" && kind !== "events" ? "medium" : FAM;
  return (await img(`bg-${kind}-${fam}`)) || (await img(`bg-${kind}-medium`)) || (await img(`bg-${kind}-small`));
}
function txt(stack, s, font, color = INK, opacity = 1) {
  const t = stack.addText(s + "");
  t.font = font; t.textColor = color; t.textOpacity = opacity; t.lineLimit = 1; t.minimumScaleFactor = 0.6;
  return t;
}

const w = new ListWidget();
w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);

// ---------------- Calendar ----------------
async function calendarGrid(parent, cellW, cellH, fs) {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const today = await img("today");
  const head = parent.addStack();
  for (const d of ["S", "M", "T", "W", "T", "F", "S"]) {
    const c = head.addStack(); c.size = new Size(cellW, cellH); c.centerAlignContent();
    txt(c, d, F.bold(fs - 1), INK, 0.45);
  }
  let day = 1 - first;
  while (day <= days) {
    const row = parent.addStack();
    for (let i = 0; i < 7; i++, day++) {
      const c = row.addStack(); c.size = new Size(cellW, cellH); c.centerAlignContent();
      if (day < 1 || day > days) { txt(c, " ", F.semi(fs)); continue; }
      const isToday = day === now.getDate();
      if (isToday && today) { c.backgroundImage = today; }
      txt(c, day, isToday ? F.heavy(fs) : F.semi(fs), isToday ? CREAM : INK, (i === 0 || i === 6) && !isToday ? 0.55 : 1);
    }
  }
}
async function buildCalendar() {
  w.backgroundImage = await bg("calendar");
  w.url = "calshow://";
  const now = new Date();
  const month = now.toLocaleDateString(undefined, { month: "long" });
  if (FAM === "small") {
    w.setPadding(13, 12, 10, 12);
    const h = w.addStack(); h.size = new Size(146, 24); h.centerAlignContent();
    txt(h, month.toUpperCase(), F.heavy(12), CREAM);
    w.addSpacer(7);
    const g = w.addStack(); g.layoutVertically();
    await calendarGrid(g, 20.5, 14.2, 10);
    w.addSpacer();
  } else {
    w.setPadding(10, 12, 10, 12);
    const row = w.addStack(); row.centerAlignContent();
    const left = row.addStack(); left.layoutVertically(); left.size = new Size(110, 140);
    left.addSpacer();
    txt(left, now.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase(), F.heavy(12), CREAM);
    txt(left, now.getDate(), F.heavy(54), CREAM);
    txt(left, month, F.semi(14), CREAM, 0.9);
    left.addSpacer();
    row.addSpacer(14);
    const g = row.addStack(); g.layoutVertically();
    await calendarGrid(g, 29, 17.5, 11.5);
  }
}

// ---------------- Clock ----------------
async function buildClock() {
  w.backgroundImage = await bg("clock");
  w.url = "clock-alarm://";
  const now = new Date();
  const df = new DateFormatter();
  if (FAM === "small") {
    w.setPadding(0, 0, 0, 0);
    w.addSpacer();
    const r = w.addStack(); r.addSpacer();
    const d = r.addDate(now); d.applyTimeStyle(); d.font = F.heavy(26); d.textColor = INK; d.centerAlignText(); d.minimumScaleFactor = 0.5; d.lineLimit = 1;
    r.addSpacer();
    w.addSpacer(2);
    const r2 = w.addStack(); r2.addSpacer();
    df.dateFormat = "EEE, MMM d"; txt(r2, df.string(now).toUpperCase(), F.bold(11), INK, 0.6);
    r2.addSpacer();
    w.addSpacer();
  } else {
    w.setPadding(14, 26, 30, 26);
    w.addSpacer();
    const d = w.addDate(now); d.applyTimeStyle(); d.font = F.heavy(50); d.textColor = INK; d.lineLimit = 1; d.minimumScaleFactor = 0.5;
    df.dateFormat = "EEEE, MMMM d"; txt(w, df.string(now), F.semi(15), INK, 0.65);
    w.addSpacer();
  }
}

// ---------------- Weather ----------------
function codeInfo(code, isDay) {
  if (code === 0) return [isDay ? "w-sun" : "w-moon", "Clear"];
  if (code <= 2) return [isDay ? "w-partly" : "w-moon", "Partly Cloudy"];
  if (code === 3) return ["w-cloud", "Cloudy"];
  if (code === 45 || code === 48) return ["w-fog", "Foggy"];
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return ["w-rain", code < 60 ? "Drizzle" : "Rain"];
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ["w-snow", "Snow"];
  if (code >= 95) return ["w-storm", "Storms"];
  return ["w-cloud", "Cloudy"];
}
async function getWeather() {
  const cache = fm.joinPath(DIR, "weather-cache.json");
  let lat = 38.2527, lon = -85.7585, city = "Louisville";
  try {
    Location.setAccuracyToThreeKilometers();
    const loc = await Location.current();
    lat = loc.latitude; lon = loc.longitude;
    try { const g = await Location.reverseGeocode(lat, lon); if (g && g[0]) city = g[0].locality || city; } catch (e) {}
  } catch (e) {
    if (fm.fileExists(cache)) { try { const c = JSON.parse(fm.readString(cache)); lat = c.lat; lon = c.lon; city = c.city; } catch (e2) {} }
  }
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=4`;
  try {
    const data = await new Request(url).loadJSON();
    data.lat = lat; data.lon = lon; data.city = city;
    fm.writeString(cache, JSON.stringify(data));
    return data;
  } catch (e) {
    if (fm.fileExists(cache)) return JSON.parse(fm.readString(cache));
    throw e;
  }
}
async function buildWeather() {
  w.backgroundImage = await bg("weather");
  w.url = "weather://";
  let d;
  try { d = await getWeather(); } catch (e) { w.setPadding(16, 16, 16, 16); txt(w, "Weather unavailable", F.bold(13)); return; }
  const [icon, cond] = codeInfo(d.current.weather_code, d.current.is_day);
  const hi = Math.round(d.daily.temperature_2m_max[0]), lo = Math.round(d.daily.temperature_2m_min[0]);
  const temp = Math.round(d.current.temperature_2m) + "°";
  if (FAM === "small") {
    w.setPadding(16, 18, 20, 16);
    const top = w.addStack(); top.centerAlignContent();
    const tl = top.addStack(); tl.layoutVertically();
    txt(tl, d.city, F.bold(12));
    txt(tl, temp, F.heavy(36));
    top.addSpacer();
    const im = top.addImage(await img(icon)); im.imageSize = new Size(50, 50);
    w.addSpacer();
    txt(w, cond, F.bold(12));
    txt(w, `H:${hi}°  L:${lo}°`, F.semi(11), INK, 0.7);
  } else {
    w.setPadding(14, 20, 14, 18);
    const row = w.addStack(); row.centerAlignContent();
    const left = row.addStack(); left.layoutVertically();
    txt(left, d.city, F.bold(14));
    txt(left, temp, F.heavy(46));
    txt(left, cond, F.bold(13));
    txt(left, `H:${hi}°  L:${lo}°`, F.semi(12), INK, 0.7);
    row.addSpacer();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 0; i < 4; i++) {
      const col = row.addStack(); col.layoutVertically(); col.centerAlignContent(); col.size = new Size(46, 104);
      const dn = col.addStack(); dn.addSpacer();
      txt(dn, i === 0 ? "Now" : days[new Date(d.daily.time[i] + "T12:00").getDay()], F.bold(11)); dn.addSpacer();
      const ic = col.addStack(); ic.addSpacer();
      const im = ic.addImage(await img(i === 0 ? icon : codeInfo(d.daily.weather_code[i], 1)[0])); im.imageSize = new Size(38, 38); ic.addSpacer();
      const t = col.addStack(); t.addSpacer();
      txt(t, Math.round(d.daily.temperature_2m_max[i]) + "°", F.heavy(12)); t.addSpacer();
      const t2 = col.addStack(); t2.addSpacer();
      txt(t2, Math.round(d.daily.temperature_2m_min[i]) + "°", F.semi(11), INK, 0.6); t2.addSpacer();
    }
  }
}

// ---------------- Events ----------------
async function buildEvents() {
  w.backgroundImage = await bg("events");
  w.url = "calshow://";
  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
  let evs = [];
  try { evs = (await CalendarEvent.between(now, end, [])).filter((e) => e.endDate > now); } catch (e) {}
  evs.sort((a, b) => a.startDate - b.startDate);
  const max = FAM === "large" ? 7 : FAM === "medium" ? 2 : 2;
  const big = FAM !== "small";
  w.setPadding(big ? 13 : 12, big ? 22 : 16, 12, big ? 24 : 16);
  const h = w.addStack(); h.centerAlignContent(); h.size = new Size(0, big ? 26 : 24);
  txt(h, "UP NEXT", F.heavy(big ? 13 : 12));
  h.addSpacer();
  const df = new DateFormatter(); df.dateFormat = "EEE, MMM d";
  txt(h, df.string(now), F.bold(big ? 12 : 10), INK, 0.7);
  w.addSpacer(big ? 12 : 9);
  if (!evs.length) { txt(w, "Nothing scheduled", F.semi(13), INK, 0.6); w.addSpacer(); return; }
  const tf = new DateFormatter(); tf.useNoDateStyle(); tf.useShortTimeStyle();
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  for (const e of evs.slice(0, max)) {
    const r = w.addStack(); r.centerAlignContent();
    const bar = r.addStack(); bar.size = new Size(5, big ? 30 : 26); bar.cornerRadius = 2.5;
    bar.backgroundColor = e.calendar && e.calendar.color ? e.calendar.color : new Color("#a78fc9");
    bar.borderColor = INK; bar.borderWidth = 1;
    r.addSpacer(8);
    const col = r.addStack(); col.layoutVertically();
    txt(col, e.title || "Event", F.bold(big ? 13 : 12));
    const when = e.isAllDay ? "All day" : tf.string(e.startDate);
    const day = sameDay(e.startDate, now) ? "Today" : df.string(e.startDate);
    txt(col, `${day} · ${when}`, F.semi(big ? 11 : 10), INK, 0.6);
    w.addSpacer(big ? 8 : 6);
  }
  w.addSpacer();
}

if (KIND.startsWith("clock")) await buildClock();
else if (KIND.startsWith("weather")) await buildWeather();
else if (KIND.startsWith("event") || KIND.startsWith("up")) await buildEvents();
else await buildCalendar();

if (config.runsInWidget) Script.setWidget(w);
else if (FAM === "small") await w.presentSmall();
else if (FAM === "large") await w.presentLarge();
else await w.presentMedium();
Script.complete();
