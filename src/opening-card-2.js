// ---------------------------------------------------------------------------
// opening-card: one door or window
// ---------------------------------------------------------------------------
import { ICONS, svgIcon, typeIcon } from "./icons.js";
import { esc } from "./strings.js";
import { autoEntities, canUnlatch, isAjar } from "./states.js";
import { dayOf, fmtTime, startOfDay } from "./durations.js";
import { SCENE_STYLE } from "./illustrations.js";
import { BANNER_STYLE, BASE_STYLE, BODY_STYLE, DIALOG_STYLE } from "./styles.js";
import { OpeningBase } from "./base-card.js";

export class OpeningCard extends OpeningBase {
  static getConfigElement() {
    return document.createElement("opening-card-editor");
  }

  static getStubConfig(hass) {
    const [first] = autoEntities(hass, false);
    return first ? { entity: first } : {};
  }

  setConfig(config) {
    if (config?.entity !== undefined && typeof config.entity !== "string") throw new Error("entity must be an entity id");
    super.setConfig(config);
  }

  getGridOptions() {
    return { columns: 6, min_columns: 4, rows: "auto" };
  }

  _entries() {
    const { entity, name } = this._config;
    return entity ? [{ entity, name }] : [];
  }

  _zoom() {
    return "";
  }

  _subtitle(it) {
    return isAjar(it.pos) || it.pos === "closed" ? this._since(it.st) : this._t(`y_${it.type}`);
  }

  _header(it) {
    return this._banner({
      title: it.name,
      sub: this._subtitle(it),
      cls: it.st.cls,
      icon: typeIcon(it.type, isAjar(it.pos)),
      pill: this._t(it.st.key),
      scenes: this._scene(it),
      zoom: this._zoom(),
      entity: it.id,
    });
  }

  _render() {
    const c = this._config;
    if (!c.entity) return this._error(this._t("no_entity"));
    const [it] = this._items();
    if (!it.s) return this._error(this._t("not_found", { entity: c.entity }));
    this._syncClock(isAjar(it.pos) || c.show_history !== false);
    return `<style>${BASE_STYLE}${SCENE_STYLE}${BANNER_STYLE}${BODY_STYLE}${DIALOG_STYLE}</style>
      <ha-card>${this._header(it)}${this._body(it)}</ha-card>`;
  }

  _body(it) {
    const alert = it.st.alert
      ? `<div class="alertline crit" role="status">${svgIcon(ICONS.alert)}<span>${esc(this._t("alert", { state: this._t(it.st.key), d: this._dur(it.st.min), limit: this._dur(it.alertMin) }))}</span></div>`
      : "";
    return `<div class="content">${alert}<div class="tiles">${this._tiles(it).join("")}</div>${this._day(it)}${this._actions(it)}</div>`;
  }

  // ---- Tiles ------------------------------------------------------------------

  _tile(key, value, cls, icon, entity) {
    return `<div class="tile ${cls}" role="button" tabindex="0" data-entity="${esc(entity)}" aria-label="${esc(`${this._t(key)}: ${value}`)}">
      <span class="dot"></span><div class="ti">${svgIcon(icon)}</div>
      <div><div class="k">${esc(this._t(key))}</div><div class="v">${esc(value)}</div></div></div>`;
  }

  _tiles(it) {
    const h = this._hass;
    const out = [];
    const ajar = isAjar(it.pos);
    const contactCls = it.st.cls === "warn" ? "ok" : it.st.alert ? "crit" : ajar ? "active" : it.st.cls === "crit" ? "crit" : "ok";
    const contactKey = it.pos === "tilt" ? "s_tilted" : ajar ? "s_open" : it.pos === "closed" ? "s_closed" : it.st.key;
    out.push(this._tile(it.handle ? "k_handle" : "k_contact", this._t(contactKey), contactCls, typeIcon(it.type, ajar), it.handle || it.id));
    if (it.ls) {
      const ls = it.lockState;
      const cls = ls === "locked" ? "ok" : ls === "unlocked" ? "warn" : "crit";
      const key = ls === "locked" ? "s_locked" : ls === "unlocked" ? "s_unlocked" : ls === "jammed" ? "s_jammed" : "s_unavailable";
      out.push(this._tile("k_lock", this._t(key), cls, ls === "locked" ? ICONS.lock : ls === "jammed" ? ICONS.jammed : ICONS.unlock, it.lock));
    }
    const pet = it.pet && h.states[it.pet];
    if (pet) {
      const inside = ["on", "home"].includes(pet.state);
      out.push(this._tile("k_pet", `${this._t(inside ? "v_inside" : "v_outside")} · ${fmtTime(Date.parse(pet.last_changed), this._locale())}`, "idle", ICONS.pet, it.pet));
    }
    const bell = it.doorbell && h.states[it.doorbell];
    if (bell) out.push(this._tile("k_doorbell", this._when(bell), "idle", ICONS.bell, it.doorbell));
    const clim = it.climate && h.states[it.climate];
    if (clim) out.push(this._heating(it, clim));
    if (it.breakers.length) {
      const n = this._breakersKnown(it);
      const off = this._tripped(it);
      out.push(this._tile("k_breakers", off ? this._t("v_tripped", { n: off }) : this._t("v_armed", { on: n - off, n }), off ? "crit" : "ok", ICONS.breakers, it.breakers[0]));
    }
    const pw = it.power && h.states[it.power];
    if (pw) out.push(this._tile("k_power", this._power(pw), "idle", ICONS.power, it.power));
    const bat = it.battery && h.states[it.battery];
    if (bat) {
      const pct = Number(bat.state);
      const cls = !Number.isFinite(pct) ? "idle" : pct < 20 ? "crit" : pct < 35 ? "warn" : "ok";
      out.push(this._tile("k_battery", Number.isFinite(pct) ? `${Math.round(pct)} %` : this._t("s_unknown"), cls, ICONS.battery, it.battery));
    }
    return out;
  }

  // The time of the last ring: an event entity's state is its time, a binary sensor's last change.
  _when(s) {
    const at = Date.parse(s.entity_id?.startsWith("event.") ? s.state : s.last_changed);
    if (!Number.isFinite(at)) return "—";
    const day = startOfDay(Date.now());
    if (at >= day) return fmtTime(at, this._locale());
    return new Intl.DateTimeFormat(this._locale(), { day: "numeric", month: "short" }).format(new Date(at));
  }

  // Heating: paused (amber) when it went off after the window opened (a minute's leeway for the automation), else
  // off (turned off for the season, say) or on with its target.
  _heating(it, s) {
    const off = s.state === "off";
    const paused = off && isAjar(it.pos) && Date.parse(s.last_changed) >= Date.parse(it.since) - 60000;
    const target = Number(s.attributes?.temperature);
    const value = paused ? this._t("v_paused") : off ? this._t("v_off") : Number.isFinite(target) ? `${this._t("v_on")} · ${target} °` : this._t("v_on");
    return this._tile("k_heating", value, paused ? "warn" : off ? "idle" : "ok", ICONS.heating, it.climate);
  }

  _power(s) {
    const v = Number(s.state);
    const unit = s.attributes?.unit_of_measurement || "";
    if (!Number.isFinite(v)) return this._t("s_unknown");
    const nf = (n, d) => new Intl.NumberFormat(this._locale(), { maximumFractionDigits: d }).format(n);
    return unit === "W" && Math.abs(v) >= 1000 ? `${nf(v / 1000, 1)} kW` : `${nf(v, 1)} ${unit}`.trim();
  }

  // ---- Today's timeline ---------------------------------------------------------

  _day(it) {
    if (this._config.show_history === false) return "";
    const hist = this._history(this._historyIds([it]));
    if (!hist) return "";
    const now = Date.now();
    const start = startOfDay(now);
    const d = dayOf(hist, it, start, now);
    const head =
      d.count === 0 && !d.spans.length
        ? this._t("no_opening")
        : this._t(d.count === 1 ? "one_opening" : "n_openings", { n: d.count, d: this._dur(Math.max(1, d.total)) });
    return `<div class="day"><div class="dayhead"><b>${esc(this._t("today"))}</b><span>${esc(head)}</span></div>
      ${dayBar(d, start, now, it.st.alert)}${this._axis()}</div>`;
  }

  // ---- Buttons --------------------------------------------------------------------

  _actions(it) {
    const out = [];
    if (it.ls && !it.readOnly && it.lockState !== "unavailable") {
      const locked = it.lockState === "locked";
      // No Lock button while the door stands open: the bolt would be thrown into the void.
      if (locked) out.push(this._button("unlock", ICONS.unlock, "unlock"));
      else if (!isAjar(it.pos)) out.push(this._button("lock", ICONS.lock, "lock"));
      if (canUnlatch(it.ls) && !isAjar(it.pos)) out.push(this._button("unlatch", ICONS.door_open, "unlatch"));
    }
    out.push(this._button("history", ICONS.history, "history"));
    return `<div class="actions">${out.join("")}</div>`;
  }

  _button(action, icon, key) {
    return `<button class="btn" data-action="${action}" aria-label="${esc(this._t(key))}">${svgIcon(icon)}<span>${esc(this._t(key))}</span></button>`;
  }

  _action(action, _value, ev) {
    const it = this._items()[0];
    if (!it) return;
    if (action === "history") return this._moreInfo(it.id);
    if (action === "lock") return this._call("lock", "lock", { entity_id: it.lock });
    if (action === "unlock" || action === "unlatch") {
      const service = action === "unlock" ? "unlock" : "open";
      const run = () => this._call("lock", service, { entity_id: it.lock });
      if (this._config.confirm === false) return run();
      return this._ask(this._t(`confirm_${action}`, { name: it.name }), this._t(action), run);
    }
    if (action === "zoom") return this._toggleZoom(ev);
  }
}

// The day bar: open spans in blue (the ongoing one red during an alert), unlocked spans in amber, the time now.
export const dayBar = (d, start, now, alert, thin = false) => {
  const span = 86400000;
  const pct = (ms) => (((ms - start) / span) * 100).toFixed(2);
  const seg = ([a, b], cls) => `<span class="seg ${cls}" style="left:${pct(a)}%;width:${(((b - a) / span) * 100).toFixed(2)}%"></span>`;
  const open = d.spans.map((s, i) => seg(s, alert && i === d.spans.length - 1 && s[1] >= now ? "crit" : ""));
  return `<div class="bar${thin ? " thin" : ""}" aria-hidden="true">${d.unlocked.map((s) => seg(s, "unl")).join("")}${open.join("")}<span class="now" style="left:${pct(now)}%"></span></div>`;
};
