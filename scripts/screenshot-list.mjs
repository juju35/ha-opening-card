// The README screenshots (PNG) and animations (GIF) rendered by scripts/screenshots.mjs.
// Every capture has a twin in the other theme ("-dark" for a light capture, "-light" for a dark one) that shows
// exactly the same state: only the theme differs (checked by test/screenshots.test.mjs).
import { BREAKERS } from "./mock-states.mjs";

const twins = (list) =>
  list.flatMap(({ file, theme = "light", ...s }) => [
    { file, theme, ...s },
    { file: `${file}-${theme === "light" ? "dark" : "light"}`, theme: theme === "light" ? "dark" : "light", ...s },
  ]);

const FRONT = { entity: "binary_sensor.front_door", lock: "lock.front_door", doorbell: "event.front_doorbell" };

export const shots = twins([
  { file: "card", type: "opening-card", width: 420, config: FRONT },
  { file: "card-alert", type: "opening-card", width: 420, config: { entity: "binary_sensor.patio_door", lock: "lock.patio_door" } },
  { file: "card-window", type: "opening-card", width: 420, config: { entity: "binary_sensor.bedroom_window", handle: "sensor.bedroom_window_handle", climate: "climate.bedroom" } },
  { file: "card-panel", type: "opening-card", width: 420, config: { entity: "binary_sensor.electrical_panel", breakers: BREAKERS, power: "sensor.house_power" } },
  { file: "card-pet", type: "opening-card", width: 420, config: { entity: "binary_sensor.cat_flap", lock: "lock.cat_flap", pet: "binary_sensor.cat_presence" } },
  { file: "mini-card", type: "opening-mini-card", width: 400, config: FRONT },
  { file: "mini-card-window", type: "opening-mini-card", width: 400, config: { entity: "binary_sensor.kitchen_window", climate: "climate.kitchen" } },
  { file: "mini-card-zoomed", type: "opening-mini-card", width: 400, config: { entity: "binary_sensor.office_door" }, clicks: ['[data-action="zoom"]'] },
  { file: "overview", type: "opening-overview-card", width: 480, config: {} },
  { file: "overview-journal", type: "opening-overview-card", width: 480, config: {}, clicks: ['[data-action="tab"][data-value="journal"]'] },
  { file: "journal-card", type: "opening-journal-card", width: 480, config: { entities: ["binary_sensor.front_door", "binary_sensor.patio_door", "binary_sensor.kitchen_window", "binary_sensor.garden_wicket", "cover.garage_door"] } },
]);

// One animation per distinct state: a door ajar stirring, an alert pulsing, a tilted sash, a pet flap swinging.
export const gifs = twins([
  { file: "door-open", type: "opening-mini-card", width: 400, config: { entity: "binary_sensor.office_door" } },
  { file: "alert", type: "opening-mini-card", width: 400, config: { entity: "binary_sensor.patio_door" } },
  { file: "window-tilt", type: "opening-mini-card", width: 400, config: { entity: "binary_sensor.bedroom_window", handle: "sensor.bedroom_window_handle" } },
  { file: "pet-flap", type: "opening-mini-card", width: 400, config: { entity: "binary_sensor.cat_flap" } },
]);
