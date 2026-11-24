// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------
import { typeOf } from "./opening-types.js";

// Words a window handle (a sensor) reports for a tilted window, and for open and closed.
export const TILT_WORDS = new Set(["tilt", "tilted", "kipp", "gekippt", "ajar", "vent", "incliné", "basculé", "bascule"]);
export const OPEN_WORDS = new Set(["on", "open", "opened", "opening", "closing", "offen", "ouvert", "home_open"]);
export const CLOSED_WORDS = new Set(["off", "closed", "close", "geschlossen", "fermé", "ferme"]);

// Where an opening stands: open, tilt, closed, unavailable, unknown, or missing (no such entity).
export const posOf = (s) => {
  if (!s) return "missing";
  const st = String(s.state).toLowerCase();
  if (st === "unavailable") return "unavailable";
  if (TILT_WORDS.has(st)) return "tilt";
  if (OPEN_WORDS.has(st)) return "open";
  if (CLOSED_WORDS.has(st)) return "closed";
  return "unknown";
};
export const isAjar = (pos) => pos === "open" || pos === "tilt";

// A lock as the card shows it: locked, unlocked, jammed or unavailable.
export const lockOf = (ls) => {
  if (!ls) return null;
  if (ls.state === "unavailable" || ls.state === "unknown") return "unavailable";
  if (ls.state === "jammed") return "jammed";
  return ls.state === "locked" || ls.state === "locking" ? "locked" : "unlocked";
};
// lock.open (unlatch) is in supported_features bit 1.
export const canUnlatch = (ls) => ((Number(ls?.attributes?.supported_features) || 0) & 1) === 1;

export const minutesSince = (iso, now) => {
  const at = Date.parse(iso);
  return Number.isFinite(at) ? Math.max(0, (now - at) / 60000) : 0;
};

// Entities of the sensor's own device that the card uses on their own: its battery and its lock (a smart lock's
// door sensor, a window with a locking handle). The registry is indexed once per registry object; whether a sensor
// is a battery is read from its current state at each lookup, so a sensor whose state comes in late is still found.
export const _related = new WeakMap();
export const relatedOf = (hass, id, kind) => {
  const reg = hass?.entities;
  if (!reg) return null;
  let map = _related.get(reg);
  if (!map) {
    map = { sensors: {}, lock: {} };
    for (const e of Object.values(reg)) {
      if (!e.device_id) continue;
      if (e.entity_id.startsWith("sensor.")) (map.sensors[e.device_id] ||= []).push(e.entity_id);
      if (e.entity_id.startsWith("lock.")) map.lock[e.device_id] ??= e.entity_id;
    }
    _related.set(reg, map);
  }
  const dev = reg[id]?.device_id;
  if (!dev) return null;
  if (kind === "lock") return map.lock[dev] || null;
  return (map.sensors[dev] || []).find((s) => hass.states[s]?.attributes?.device_class === "battery") || null;
};

export const OPTION_KEYS = ["lock", "doorbell", "battery", "handle", "climate", "power", "pet", "breakers", "open_alert"];

// One opening as the cards show it, from its entry in the config (a string or an object) and the card's options.
export const itemOf = (hass, entry, card = {}) => {
  const conf = typeof entry === "string" ? { entity: entry } : entry || {};
  const o = { ...Object.fromEntries(OPTION_KEYS.map((k) => [k, card[k]])), ...conf };
  const id = conf.entity;
  const s = hass?.states?.[id];
  const hs = o.handle ? hass.states[o.handle] : null;
  let pos = posOf(s);
  // A handle tells a tilted window from an open one; the contact still tells closed from open.
  if (hs && pos !== "unavailable" && pos !== "missing" && posOf(hs) === "tilt") pos = "tilt";
  // An option set to false turns the device's own entity off; unset, the device's own one is used.
  const own = (k) => (o[k] === false ? null : o[k] || relatedOf(hass, id, k));
  const lockId = own("lock");
  const ls = lockId ? hass.states[lockId] : null;
  const alert = Number(o.open_alert ?? 10);
  return {
    id,
    s,
    type: typeOf(id, s, conf.opening_type ?? card.opening_type),
    pos,
    name: conf.name || s?.attributes?.friendly_name || id,
    since: pos === "tilt" && hs ? hs.last_changed : s?.last_changed,
    lock: lockId,
    ls,
    lockState: lockOf(ls),
    lockSince: ls?.last_changed,
    handle: o.handle || null,
    doorbell: o.doorbell || null,
    battery: own("battery"),
    climate: o.climate || null,
    power: o.power || null,
    pet: o.pet || null,
    breakers: Array.isArray(o.breakers) ? o.breakers : [],
    alertMin: Number.isFinite(alert) ? alert : 10,
    readOnly: String(id).startsWith("cover."),
  };
};

// The status of an opening: its color class, its state word, whether it is an alert and since when.
export const statusOf = (it, now = Date.now()) => {
  if (it.pos === "missing" || it.pos === "unavailable") return { cls: "crit", key: "s_unavailable", min: 0 };
  if (it.lockState === "jammed") return { cls: "crit", key: "s_jammed", min: 0 };
  const min = minutesSince(it.since, now);
  if (isAjar(it.pos)) {
    const alert = it.alertMin > 0 && min >= it.alertMin;
    return { cls: alert ? "crit" : "active", key: it.pos === "tilt" ? "s_tilted" : "s_open", alert, min };
  }
  if (it.pos === "closed") {
    // Locked or unlocked: since the lock changed, not the contact (a door closed at 8:00 and locked at 11:58).
    const lmin = it.lockSince ? minutesSince(it.lockSince, now) : min;
    if (it.lockState === "unlocked") return { cls: "warn", key: "s_unlocked", min: lmin };
    if (it.lockState === "locked") return { cls: "ok", key: "s_locked", min: lmin };
    return { cls: "ok", key: "s_closed", min };
  }
  return { cls: "idle", key: "s_unknown", min: 0 };
};

// Overview order: alerts first, then what is open, unlocked, and the rest, by name.
export const RANK = { crit: 0, active: 1, warn: 2, idle: 3, ok: 4 };
export const byStatus = (a, b) => RANK[a.st.cls] - RANK[b.st.cls] || a.name.localeCompare(b.name);

// Every door, window and opening sensor (and the garage doors and gates, read only), hidden ones aside.
export const OPENING_CLASSES = new Set(["door", "window", "opening", "garage_door"]);
export const autoEntities = (hass, includeCovers = true) =>
  Object.values(hass?.states || {})
    .filter((s) => {
      const [domain] = s.entity_id.split(".");
      const reg = hass.entities?.[s.entity_id];
      if (reg?.hidden || reg?.disabled_by || reg?.entity_category) return false;
      const dc = s.attributes?.device_class;
      if (domain === "binary_sensor") return OPENING_CLASSES.has(dc);
      return includeCovers && domain === "cover" && (dc === "garage" || dc === "gate");
    })
    .map((s) => s.entity_id)
    .sort();
