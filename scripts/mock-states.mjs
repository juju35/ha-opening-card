// Mock Home Assistant data for the tests and the README screenshots: neutral names, no real household.
// Everything is relative to a moment `now` (ms), so that durations ("open for 14 min") and today's history stay
// the same whatever the day: the screenshots use a fixed clock, the tests the real one.

// The moment the screenshots are taken (UTC, with the page in UTC): a summer afternoon.
export const SHOT_TIME = Date.parse("2026-06-15T15:20:00Z");

const DOORS = [
  // id, device class, friendly name, minutes since its last change, on?
  ["binary_sensor.front_door", "door", "Front door", 8, false],
  ["binary_sensor.patio_door", "door", "Living room patio door", 14, true],
  ["binary_sensor.office_door", "door", "Office door", 2, true],
  ["binary_sensor.bedroom_french_door", "door", "Bedroom French door", 75, false],
  ["binary_sensor.terrace_french_door", "door", "Terrace double French door", 190, false],
  ["binary_sensor.garden_wicket", "door", "Garden wicket gate", 41, false],
  ["binary_sensor.cat_flap", "door", "Cat flap", 3, true],
  ["binary_sensor.cellar_trapdoor", "opening", "Cellar trapdoor", 320, false],
  ["binary_sensor.kitchen_window", "window", "Kitchen window", 25, true],
  ["binary_sensor.living_room_window", "window", "Living room double window", 140, false],
  ["binary_sensor.bedroom_window", "window", "Bedroom tilt window", 25, true],
  ["binary_sensor.office_sliding_window", "window", "Office sliding window", 600, false],
  ["binary_sensor.bathroom_hopper", "window", "Bathroom hopper window", 55, false],
  ["binary_sensor.electrical_panel", "door", "Electrical panel", 1200, false],
];

export const areas = {};
export const devices = Object.fromEntries(DOORS.map(([id]) => [id.split(".")[1], { id: id.split(".")[1], name: id.split(".")[1] }]));

export const entities = {
  ...Object.fromEntries(DOORS.map(([id]) => [id, { entity_id: id, device_id: id.split(".")[1] }])),
  "sensor.front_door_battery": { entity_id: "sensor.front_door_battery", device_id: "front_door", entity_category: "diagnostic" },
  "sensor.patio_door_battery": { entity_id: "sensor.patio_door_battery", device_id: "patio_door", entity_category: "diagnostic" },
  "sensor.bedroom_window_battery": { entity_id: "sensor.bedroom_window_battery", device_id: "bedroom_window", entity_category: "diagnostic" },
};

const iso = (now, min) => new Date(now - min * 60000).toISOString();
const state = (now, entity_id, st, min, attributes = {}) => ({
  entity_id,
  state: st,
  last_changed: iso(now, min),
  last_updated: iso(now, min),
  attributes,
});

export const statesAt = (now) => {
  const out = {};
  for (const [id, dc, name, min, on] of DOORS) out[id] = state(now, id, on ? "on" : "off", min, { device_class: dc, friendly_name: name });
  const add = (id, st, min, attributes) => (out[id] = state(now, id, st, min, attributes));
  add("lock.front_door", "locked", 8, { friendly_name: "Front door lock", supported_features: 1 });
  add("lock.patio_door", "unlocked", 30, { friendly_name: "Patio door lock", supported_features: 0 });
  add("lock.bedroom_french_door", "unlocked", 75, { friendly_name: "French door lock", supported_features: 0 });
  add("lock.garden_wicket", "locked", 41, { friendly_name: "Wicket gate strike", supported_features: 0 });
  add("lock.cat_flap", "unlocked", 900, { friendly_name: "Cat flap lock", supported_features: 0 });
  add("event.front_doorbell", iso(now, 196), 196, { friendly_name: "Doorbell", event_type: "ring" });
  add("sensor.front_door_battery", "86", 600, { device_class: "battery", unit_of_measurement: "%", friendly_name: "Front door battery" });
  add("sensor.patio_door_battery", "18", 600, { device_class: "battery", unit_of_measurement: "%", friendly_name: "Patio door battery" });
  add("sensor.bedroom_window_battery", "91", 600, { device_class: "battery", unit_of_measurement: "%", friendly_name: "Bedroom window battery" });
  add("sensor.bedroom_window_handle", "tilted", 25, { friendly_name: "Bedroom window handle" });
  add("climate.bedroom", "off", 24, { friendly_name: "Bedroom radiator", temperature: 19 });
  add("climate.kitchen", "heat", 400, { friendly_name: "Kitchen radiator", temperature: 20 });
  add("binary_sensor.cat_presence", "off", 3, { device_class: "presence", friendly_name: "Cat" });
  add("sensor.house_power", "2430", 1, { device_class: "power", unit_of_measurement: "W", friendly_name: "House power" });
  for (let i = 1; i <= 16; i++) add(`switch.breaker_${i}`, i === 12 ? "off" : "on", 1300, { friendly_name: `Breaker ${i}` });
  add("cover.garage_door", "open", 6, { device_class: "garage", friendly_name: "Garage door", current_position: 100 });
  add("cover.driveway_gate", "closed", 95, { device_class: "gate", friendly_name: "Driveway gate" });
  return out;
};

export const BREAKERS = Array.from({ length: 16 }, (_, i) => `switch.breaker_${i + 1}`);

// Today's history, as Home Assistant's compressed rows ({ s, lu } in seconds): openings spread over the day.
// Every list ends with the state the entity is in now (statesAt), at its last change.
const OPENINGS = {
  "binary_sensor.front_door": [[7.4, 2], [8.1, 1], [8.6, 3], [12.2, 2], [12.5, 1], [17.9, 4], [18.6, 2]],
  "binary_sensor.patio_door": [[9.2, 40], [13.1, 25]],
  "binary_sensor.office_door": [[8.9, 6], [10.4, 2], [14.1, 1]],
  "binary_sensor.bedroom_french_door": [[7.1, 20], [11.6, 12]],
  "binary_sensor.terrace_french_door": [[10.2, 30]],
  "binary_sensor.garden_wicket": [[8.05, 1], [8.5, 1], [12.1, 2], [13.9, 1]],
  "binary_sensor.cat_flap": [[6.2, 0.2], [9.8, 0.2], [11.1, 0.2], [13.7, 0.2]],
  "binary_sensor.kitchen_window": [[7.8, 15], [12.9, 10]],
  "binary_sensor.living_room_window": [[9.5, 45], [11.9, 20]],
  "binary_sensor.bedroom_window": [[6.9, 30]],
  "binary_sensor.bathroom_hopper": [[7.2, 25], [13.4, 10]],
  "cover.garage_door": [[8.05, 42], [12.3, 5]],
  "cover.driveway_gate": [[8.0, 3], [12.2, 2]],
};
const UNLOCKED = { "lock.front_door": [[7.3, 30], [12.1, 70]], "lock.patio_door": [[9.1, 60]], "lock.bedroom_french_door": [[11.5, 20]] };

export const historyAt = (now, ids) => {
  const start = new Date(now).setUTCHours(0, 0, 0, 0);
  const st = statesAt(now);
  const out = {};
  for (const id of ids) {
    const lock = id.startsWith("lock.");
    const spans = (lock ? UNLOCKED : OPENINGS)[id] || [];
    const [on, off] = lock ? ["unlocked", "locked"] : id.startsWith("cover.") ? ["open", "closed"] : ["on", "off"];
    const rows = [{ s: off, lu: start / 1000 }];
    for (const [h, min] of spans) {
      const a = start + h * 3600000;
      if (a + min * 60000 > now) continue;
      rows.push({ s: on, lu: a / 1000 }, { s: off, lu: (a + min * 60000) / 1000 });
    }
    const cur = st[id];
    if (cur) rows.push({ s: cur.state, lu: Date.parse(cur.last_changed) / 1000 });
    out[id] = rows.sort((x, y) => x.lu - y.lu);
  }
  return out;
};
