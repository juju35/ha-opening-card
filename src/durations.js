// ---------------------------------------------------------------------------
// Durations, times and today's history
// ---------------------------------------------------------------------------
import { isAjar, lockOf, posOf } from "./states.js";

export const startOfDay = (now) => new Date(now).setHours(0, 0, 0, 0);

export const TIME_FMT = {};
export const fmtTime = (ms, locale) => {
  TIME_FMT[locale] ??= new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" });
  return TIME_FMT[locale].format(new Date(ms));
};
// The state changes of an entity, from Home Assistant's history (compressed or full rows), as { s, t } in ms.
export const changesOf = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((r) => {
      const at = r.lc ?? r.lu;
      return { s: r.s ?? r.state, t: at != null ? at * 1000 : Date.parse(r.last_changed ?? r.last_updated) };
    })
    .filter((c) => Number.isFinite(c.t));

// The spans of a day (start → end) where `on(state)` held, from the history rows plus the current state.
export const spansOf = (rows, current, start, end, on) => {
  const list = changesOf(rows);
  const cur = current && Date.parse(current.last_changed);
  if (current && Number.isFinite(cur) && (!list.length || cur > list.at(-1).t)) list.push({ s: current.state, t: cur });
  const out = [];
  let from = null;
  for (const c of list) {
    const at = Math.max(start, Math.min(end, c.t));
    if (on(c.s)) from ??= at;
    else if (from !== null) {
      out.push([from, at]);
      from = null;
    }
  }
  if (from !== null) out.push([from, end]);
  return out.filter(([a, b]) => b > a);
};
export const contactOn = (state) => isAjar(posOf({ state }));
export const lockOn = (state) => lockOf({ state }) === "unlocked";

// Count (openings started today), total open time and the spans, for one opening.
export const dayOf = (hist, it, start, now) => {
  const spans = hist ? spansOf(hist[it.id], it.s, start, now, contactOn) : [];
  const unlocked = hist && it.lock ? spansOf(hist[it.lock], it.ls, start, now, lockOn) : [];
  return {
    spans,
    unlocked,
    count: spans.filter(([a]) => a > start).length,
    total: spans.reduce((sum, [a, b]) => sum + (b - a), 0) / 60000,
  };
};
