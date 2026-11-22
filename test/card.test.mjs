import assert from "node:assert/strict";
import { test } from "node:test";
import { historyAt } from "../scripts/mock-states.mjs";
import { click, html, load, makeHass, newCard, plain, tick } from "./load.mjs";

const oc = load();

test("every language has every English string, and the same placeholders", () => {
  const en = oc.STRINGS.en;
  const vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  for (const [l, table] of Object.entries(oc.STRINGS)) {
    assert.deepEqual(Object.keys(table).sort(), Object.keys(en).sort(), l);
    for (const k of Object.keys(en)) assert.equal(vars(table[k]), vars(en[k]), `${l}.${k}`);
  }
  assert.equal(Object.keys(oc.STRINGS).length, 22);
});

test("the opening type comes from the domain, the device class and the name, an option wins", () => {
  const st = (dc, name) => ({ attributes: { device_class: dc, friendly_name: name } });
  assert.equal(oc.typeOf("binary_sensor.a", st("door", "Front door")), "entry");
  assert.equal(oc.typeOf("binary_sensor.a", st("door", "Porte de la chambre")), "interior");
  assert.equal(oc.typeOf("binary_sensor.a", st("door", "Baie vitrée salon")), "sliding");
  assert.equal(oc.typeOf("binary_sensor.a", st("door", "Porte-fenêtre cuisine")), "french_single");
  assert.equal(oc.typeOf("binary_sensor.a", st("door", "Porte-fenêtre 2 vantaux")), "french");
  assert.equal(oc.typeOf("binary_sensor.a", st("door", "Chatière")), "pet");
  assert.equal(oc.typeOf("binary_sensor.a", st("door", "Portillon")), "wicket");
  assert.equal(oc.typeOf("binary_sensor.a", st("door", "Tableau électrique")), "electrical_panel");
  assert.equal(oc.typeOf("binary_sensor.a", st("opening", "Trappe de la cave")), "trapdoor");
  assert.equal(oc.typeOf("binary_sensor.a", st("window", "Fenêtre oscillo-battante")), "window_tilt");
  assert.equal(oc.typeOf("binary_sensor.a", st("window", "Soufflet salle de bain")), "hopper");
  assert.equal(oc.typeOf("binary_sensor.a", st("window", "Kitchen")), "window");
  assert.equal(oc.typeOf("binary_sensor.a", st("garage_door", "Garage")), "garage");
  assert.equal(oc.typeOf("sensor.handle", st(undefined, "Handle")), "window_tilt");
  assert.equal(oc.typeOf("cover.gate", st("gate", "Gate")), "gate");
  assert.equal(oc.typeOf("binary_sensor.a", st("door", "Front door"), "hopper"), "hopper");
  assert.equal(oc.typeOf("binary_sensor.a", st("door", "Front door"), "nonsense"), "entry");
});

test("every type has its picture, which moves with the open and tilted states", () => {
  for (const type of oc.ALL_TYPES) {
    assert.ok(oc.SCENES[type], type);
    const open = oc.openingSvg(type, "open");
    assert.match(open, new RegExp(`^<svg class="op op-${type} open sway"`), type);
    assert.match(open, /class="(sx|sy|tx)/, `${type} has a moving part`);
    assert.match(oc.openingSvg(type, "closed"), /class="op [\w-]+ closed"/);
  }
  assert.match(oc.openingSvg("window_tilt", "tilt"), /class="tl"/);
  assert.match(oc.openingSvg("electrical_panel", "closed", { tripped: true }), /tripped/);
});

test("states: contacts, window handles and locks", () => {
  assert.equal(oc.posOf({ state: "on" }), "open");
  assert.equal(oc.posOf({ state: "off" }), "closed");
  assert.equal(oc.posOf({ state: "tilted" }), "tilt");
  assert.equal(oc.posOf({ state: "unavailable" }), "unavailable");
  assert.equal(oc.posOf({ state: "weird" }), "unknown");
  assert.equal(oc.posOf(undefined), "missing");
  assert.equal(oc.lockOf({ state: "locking" }), "locked");
  assert.equal(oc.lockOf({ state: "open" }), "unlocked");
  assert.equal(oc.lockOf({ state: "jammed" }), "jammed");
  assert.equal(oc.lockOf(null), null);
});

test("status: an opening open longer than its alert limit is an alert; closed and unlocked is a warning", () => {
  const now = Date.now();
  const at = (min) => new Date(now - min * 60000).toISOString();
  const it = (pos, min, extra = {}) => ({ pos, since: at(min), alertMin: 10, lockState: null, ...extra });
  assert.deepEqual(plain(oc.statusOf(it("open", 3), now)).cls, "active");
  assert.equal(oc.statusOf(it("open", 12), now).cls, "crit");
  assert.equal(oc.statusOf(it("open", 12), now).alert, true);
  assert.equal(oc.statusOf(it("open", 120, { alertMin: 0 }), now).cls, "active");
  assert.equal(oc.statusOf(it("tilt", 1), now).key, "s_tilted");
  assert.equal(oc.statusOf(it("closed", 5, { lockState: "unlocked" }), now).cls, "warn");
  assert.equal(oc.statusOf(it("closed", 5, { lockState: "locked" }), now).key, "s_locked");
  assert.equal(oc.statusOf(it("closed", 5, { lockState: "jammed" }), now).cls, "crit");
  assert.equal(oc.statusOf(it("unavailable", 0), now).cls, "crit");
});

test("locked and unlocked count from the lock's last change, not the contact's", () => {
  const now = Date.now();
  const at = (min) => new Date(now - min * 60000).toISOString();
  const st = oc.statusOf({ pos: "closed", since: at(240), alertMin: 10, lockState: "locked", lockSince: at(2) }, now);
  assert.equal(st.key, "s_locked");
  assert.equal(Math.round(st.min), 2);
  assert.equal(Math.round(oc.statusOf({ pos: "closed", since: at(240), alertMin: 10, lockState: null }, now).min), 240);
  const h = makeHass();
  h.states["lock.front_door"] = { ...h.states["lock.front_door"], last_changed: at(2) };
  h.states["binary_sensor.front_door"] = { ...h.states["binary_sensor.front_door"], last_changed: at(240) };
  assert.match(html(newCard(oc.OpeningCard, { entity: "binary_sensor.front_door", lock: "lock.front_door" }, h)), /Locked for 2 min/);
});

test("a window handle reporting tilted turns an open window into a tilted one", () => {
  const h = makeHass();
  const it = oc.itemOf(h, { entity: "binary_sensor.bedroom_window", handle: "sensor.bedroom_window_handle" });
  assert.equal(it.pos, "tilt");
  assert.equal(it.since, h.states["sensor.bedroom_window_handle"].last_changed);
});

test("the battery and the lock of the sensor's own device are found unless turned off", () => {
  const h = makeHass();
  assert.equal(oc.relatedOf(h, "binary_sensor.front_door", "battery"), "sensor.front_door_battery");
  assert.equal(oc.itemOf(h, "binary_sensor.front_door").battery, "sensor.front_door_battery");
  assert.equal(oc.itemOf(h, { entity: "binary_sensor.front_door", battery: false }).battery, null);
  h.entities["lock.front_door"] = { entity_id: "lock.front_door", device_id: "front_door" };
  try {
    assert.equal(oc.itemOf({ ...h, entities: { ...h.entities } }, "binary_sensor.front_door").lock, "lock.front_door");
  } finally {
    delete h.entities["lock.front_door"];
  }
});

test("a battery sensor whose state comes in after the registry was indexed is still found", () => {
  const h = makeHass({ "sensor.front_door_battery": null });
  assert.equal(oc.relatedOf(h, "binary_sensor.front_door", "battery"), null);
  h.states["sensor.front_door_battery"] = { entity_id: "sensor.front_door_battery", state: "80", attributes: { device_class: "battery" } };
  assert.equal(oc.relatedOf(h, "binary_sensor.front_door", "battery"), "sensor.front_door_battery");
});

test("today's spans and openings, from compressed history rows and the current state", () => {
  const start = Date.UTC(2026, 5, 15);
  const s = (h) => (start + h * 3600000) / 1000;
  const rows = [
    { s: "off", lu: s(0) },
    { s: "on", lu: s(8) },
    { s: "off", lu: s(8.5) },
    { s: "on", lu: s(12) },
  ];
  const now = start + 13 * 3600000;
  const spans = oc.spansOf(rows, null, start, now, (st) => st === "on");
  assert.deepEqual(plain(spans), [
    [start + 8 * 3600000, start + 8.5 * 3600000],
    [start + 12 * 3600000, now],
  ]);
  const d = oc.dayOf({ "binary_sensor.x": rows }, { id: "binary_sensor.x", s: null, lock: null }, start, now);
  assert.equal(d.count, 2);
  assert.equal(Math.round(d.total), 90);
  // Open since before midnight: shown from midnight, not counted as an opening of today.
  const before = oc.dayOf({ "binary_sensor.x": [{ s: "on", lu: s(-2) }, { s: "off", lu: s(1) }] }, { id: "binary_sensor.x", s: null }, start, now);
  assert.equal(before.count, 0);
  assert.equal(Math.round(before.total), 60);
});

test("full card: banner, alert, tiles, lock buttons and today's timeline", async () => {
  const h = makeHass({}, { history: true });
  const card = newCard(oc.OpeningCard, { entity: "binary_sensor.patio_door", lock: "lock.patio_door" }, h);
  await tick();
  await tick();
  const out = html(card);
  assert.match(out, /class="banner/);
  assert.match(out, /class="badge crit"/);
  assert.match(out, /Open for 14 min, over the 10 min limit/);
  assert.match(out, /Contact[\s\S]*Lock[\s\S]*Unlocked[\s\S]*Battery[\s\S]*18 %/);
  // Open: no Lock button (see below), the History one stays.
  assert.doesNotMatch(out, /data-action="lock"/);
  assert.match(out, /data-action="history"/);
  // The mock history depends on the time of day: some openings, and their total.
  assert.match(out, /(\d+ openings|1 opening) · [\d a-z]+ in total/);
  assert.equal(h.ws.length, 1);
  assert.equal(h.ws[0].type, "history/history_during_period");
  assert.deepEqual(plain(h.ws[0].entity_ids), ["binary_sensor.patio_door", "lock.patio_door"]);
});

test("the name option replaces the entity's name in the title, the mini card and the confirmations", () => {
  const h = makeHass();
  for (const Card of [oc.OpeningCard, oc.OpeningMiniCard]) {
    const card = newCard(Card, { entity: "binary_sensor.front_door", name: "Main entrance" }, h);
    assert.match(html(card), /<span class="name">Main entrance<\/span>/);
    assert.doesNotMatch(html(card), /<span class="name">Front door<\/span>/);
  }
  const card = newCard(oc.OpeningCard, { entity: "binary_sensor.front_door", lock: "lock.front_door", name: "Main entrance" }, h);
  click(card, { action: "unlock" });
  assert.match(card.shadowRoot.innerHTML, /Unlock Main entrance\?/);
});

test("unlocking asks first, then calls lock.unlock; locking does not ask", () => {
  const h = makeHass();
  const card = newCard(oc.OpeningCard, { entity: "binary_sensor.front_door", lock: "lock.front_door" }, h);
  assert.match(html(card), /data-action="unlock"[\s\S]*data-action="unlatch"/);
  click(card, { action: "unlock" });
  assert.match(card.shadowRoot.innerHTML, /Unlock Front door\?/);
  assert.equal(h.calls.length, 0);
  click(card, { action: "confirm_ok" });
  assert.deepEqual(plain(h.calls), [["lock", "unlock", { entity_id: "lock.front_door" }]]);
  const closed = newCard(oc.OpeningCard, { entity: "binary_sensor.front_door", lock: "lock.patio_door" }, h);
  click(closed, { action: "lock" });
  assert.deepEqual(plain(h.calls.at(-1)), ["lock", "lock", { entity_id: "lock.patio_door" }]);
  const noAsk = newCard(oc.OpeningCard, { entity: "binary_sensor.front_door", lock: "lock.front_door", confirm: false }, h);
  click(noAsk, { action: "unlatch" });
  assert.deepEqual(plain(h.calls.at(-1)), ["lock", "open", { entity_id: "lock.front_door" }]);
});

test("no Lock nor Open button while the door stands open; Unlock stays", () => {
  const open = html(newCard(oc.OpeningCard, { entity: "binary_sensor.patio_door", lock: "lock.patio_door" }, makeHass()));
  assert.doesNotMatch(open, /data-action="lock"/);
  const lockedOpen = html(newCard(oc.OpeningCard, { entity: "binary_sensor.office_door", lock: "lock.front_door" }, makeHass()));
  assert.match(lockedOpen, /data-action="unlock"/);
  assert.doesNotMatch(lockedOpen, /data-action="unlatch"/);
  const closed = html(newCard(oc.OpeningCard, { entity: "binary_sensor.front_door", lock: "lock.patio_door" }, makeHass()));
  assert.match(closed, /data-action="lock"/);
});

test("history is asked again after a state change at most once a minute", async () => {
  const h = makeHass({}, { history: true });
  const card = newCard(oc.OpeningCard, { entity: "binary_sensor.front_door" }, h);
  await tick();
  await tick();
  assert.equal(h.ws.length, 1);
  card.hass = { ...h, states: { ...h.states, "binary_sensor.front_door": { ...h.states["binary_sensor.front_door"], state: "on", last_changed: new Date().toISOString() } } };
  await tick();
  assert.equal(h.ws.length, 1);
  card._hist.at -= 61000;
  card._update();
  await tick();
  assert.equal(h.ws.length, 2);
});

test("a tile opens the more-info dialog of its entity", () => {
  const card = newCard(oc.OpeningCard, { entity: "binary_sensor.front_door", lock: "lock.front_door" });
  click(card, { entity: "lock.front_door" });
  assert.equal(card.events.at(-1).type, "hass-more-info");
  assert.equal(card.events.at(-1).detail.entityId, "lock.front_door");
});

test("panel, pet, heating and doorbell tiles", () => {
  const h = makeHass();
  const breakers = Array.from({ length: 16 }, (_, i) => `switch.breaker_${i + 1}`);
  const panel = html(newCard(oc.OpeningCard, { entity: "binary_sensor.electrical_panel", breakers, power: "sensor.house_power" }, h));
  assert.match(panel, /1 tripped/);
  // A breaker module offline is not a tripped breaker.
  const offline = html(newCard(oc.OpeningCard, { entity: "binary_sensor.electrical_panel", breakers }, makeHass({ "switch.breaker_12": "unavailable" })));
  assert.match(offline, /15\/15 on/);
  assert.doesNotMatch(offline, /tripped/);
  assert.match(panel, /2\.4 kW/);
  assert.match(panel, /class="op op-electrical_panel closed tripped"/);
  const win = html(newCard(oc.OpeningCard, { entity: "binary_sensor.bedroom_window", handle: "sensor.bedroom_window_handle", climate: "climate.bedroom" }, h));
  assert.match(win, /Handle[\s\S]*Tilted/);
  assert.match(win, /Heating[\s\S]*Paused/);
  // Off long before the window opened (off for the season): plain Off, not Paused.
  const season = makeHass();
  season.states["climate.bedroom"] = { ...season.states["climate.bedroom"], last_changed: new Date(Date.now() - 86400000).toISOString() };
  const off = html(newCard(oc.OpeningCard, { entity: "binary_sensor.bedroom_window", handle: "sensor.bedroom_window_handle", climate: "climate.bedroom" }, season));
  assert.match(off, /Heating[\s\S]*>Off</);
  const pet = html(newCard(oc.OpeningCard, { entity: "binary_sensor.cat_flap", pet: "binary_sensor.cat_presence" }, h));
  assert.match(pet, /Outside · /);
  const bell = html(newCard(oc.OpeningCard, { entity: "binary_sensor.front_door", doorbell: "event.front_doorbell" }, h));
  assert.match(bell, /Doorbell/);
});

test("errors: no entity, unknown entity", () => {
  assert.match(html(newCard(oc.OpeningCard, {})), /Choose a door or window sensor/);
  assert.match(html(newCard(oc.OpeningCard, { entity: "binary_sensor.nope" })), /Entity not found: binary_sensor.nope/);
  assert.throws(() => new oc.OpeningCard().setConfig({ entities: "x" }));
});

test("translated card", () => {
  const out = html(newCard(oc.OpeningCard, { entity: "binary_sensor.patio_door", lock: "lock.patio_door" }, makeHass({}, { language: "fr" })));
  assert.match(out, /Ouvert depuis 14 min/);
  assert.match(out, /Déverrouillé/);
  assert.match(out, /Historique/);
});

test("mini card: the banner alone, unfolding with its detail button, folding back on a click elsewhere", () => {
  const card = newCard(oc.OpeningMiniCard, { entity: "binary_sensor.office_door" });
  card.connectedCallback();
  assert.doesNotMatch(html(card), /class="content"/);
  assert.match(html(card), /data-action="zoom"[^>]*aria-expanded="false"/);
  click(card, { action: "zoom" });
  assert.match(html(card), /class="content"/);
  card._onOutside();
  assert.doesNotMatch(html(card), /class="content"/);
  card.disconnectedCallback();
  assert.doesNotMatch(html(newCard(oc.OpeningMiniCard, { entity: "binary_sensor.office_door", zoom: false })), /data-action="zoom"/);
});

test("overview: every opening on its own, alerts first, filters and the journal tab", async () => {
  const h = makeHass({}, { history: true });
  const card = newCard(oc.OpeningOverviewCard, {}, h);
  const ids = oc.autoEntities(h);
  assert.ok(ids.includes("cover.garage_door") && !ids.includes("binary_sensor.cat_presence"));
  assert.equal(ids.length, 16);
  assert.equal(oc.autoEntities(h, false).length, 14);
  let out = html(card);
  assert.match(out, /3 alerts/);
  assert.match(out, /Open · 6/);
  assert.match(out, /read only/);
  const first = out.indexOf('class="door crit"');
  assert.ok(first > 0 && first < out.indexOf('class="door ok"'));
  click(card, { action: "filter", value: "alert" });
  out = html(card);
  assert.equal((out.match(/class="door /g) || []).length, 3);
  click(card, { action: "tab", value: "journal" });
  await tick();
  await tick();
  out = html(card);
  assert.match(out, /Longest opening/);
  assert.match(out, /class="row /);
  card.disconnectedCallback();
  card.connectedCallback();
  assert.match(html(card), /class="filters"/);
  card.disconnectedCallback();
});

test("overview with its own list keeps the lock of each opening; journal card", async () => {
  const h = makeHass({}, { history: true });
  const card = newCard(oc.OpeningOverviewCard, { entities: [{ entity: "binary_sensor.front_door", lock: "lock.front_door" }, "binary_sensor.kitchen_window"], show_journal: false }, h);
  const out = html(card);
  assert.doesNotMatch(out, /role="tablist"/);
  assert.match(out, /Front door[\s\S]*Locked for 8 min/);
  const journal = newCard(oc.OpeningJournalCard, { entities: ["binary_sensor.front_door"] }, h);
  await tick();
  await tick();
  // The mock history depends on the time of day: count the openings already over by now.
  const count = historyAt(Date.now(), ["binary_sensor.front_door"])["binary_sensor.front_door"].filter((r) => r.s === "on").length;
  assert.match(html(journal), new RegExp(`Front door[\\s\\S]*· ${count}×`));
});

test("editors: form data and config, defaults left out of the YAML", () => {
  const config = { entity: "binary_sensor.front_door", lock: "lock.front_door" };
  const form = plain(oc.toForm(config));
  assert.equal(form.opening_type, "auto");
  assert.equal(form.show_history, true);
  const back = plain(oc.fromForm({ ...form, open_alert: 15 }, config));
  assert.deepEqual(back, { entity: "binary_sensor.front_door", lock: "lock.front_door", open_alert: 15 });
  const list = plain(oc.fromForm({ entities: ["binary_sensor.a", "binary_sensor.b"], show_journal: true }, { entities: [{ entity: "binary_sensor.a", lock: "lock.a" }] }));
  assert.deepEqual(list, { entities: [{ entity: "binary_sensor.a", lock: "lock.a" }, "binary_sensor.b"] });
  for (const Editor of oc.editors) {
    const ed = new Editor();
    ed.setConfig({});
    ed.hass = makeHass();
    assert.ok(Array.isArray(ed._form.schema) && ed._form.schema.length > 3);
  }
});

test("the cards register in the card picker", () => {
  const types = oc.window.customCards.map((c) => c.type);
  assert.deepEqual(plain(types), ["opening-card", "opening-mini-card", "opening-overview-card", "opening-journal-card"]);
});
