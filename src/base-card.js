// ---------------------------------------------------------------------------
// Base card
// ---------------------------------------------------------------------------
import { svgIcon } from "./icons.js";
import { esc, intlLocale, t } from "./strings.js";
import { itemOf, statusOf } from "./states.js";
import { startOfDay } from "./durations.js";
import { openingSvg } from "./illustrations.js";
import { BASE_STYLE } from "./styles.js";
import { CONFIRM_GUARD_MS, HISTORY_MIN_MS, HISTORY_TTL, TICK_MS, focusSpot, isNight, isOutside, morph, watchOutside } from "./clicks-elsewhere.js";

export class OpeningBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    this.shadowRoot.addEventListener("keydown", (ev) => {
      const el = ev.target;
      if ((ev.key !== "Enter" && ev.key !== " ") || el?.getAttribute?.("role") !== "button") return;
      ev.preventDefault();
      el.click();
    });
    this._onKey = (ev) => {
      if (ev.key !== "Escape" || !this._confirm) return;
      ev.stopPropagation();
      this._closeConfirm();
    };
  }

  set hass(hass) {
    this._hass = hass;
    const deps = this._deps();
    const prev = this._lastDeps;
    if (deps && prev && deps.length === prev.length && deps.every((d, i) => d === prev[i])) return;
    this._lastDeps = deps;
    this._update();
  }

  get hass() {
    return this._hass;
  }

  // What the card shows: the language, the theme and the states of its entities (all their related entities).
  _deps() {
    const h = this._hass;
    if (!h || !this._config) return null;
    const ids = this._entries().flatMap((e) => {
      const it = itemOf(h, e, this._config);
      return [it.id, it.lock, it.handle, it.doorbell, it.battery, it.climate, it.power, it.pet, ...it.breakers];
    });
    return [h.language, h.locale, h.themes?.darkMode, h.entities, ...ids.map((id) => id && h.states[id])];
  }

  connectedCallback() {
    this._outside ??= watchOutside(
      (ev) => isOutside(this, ev),
      () => this._onOutside(),
    );
    this._outside.on();
    this._connected = true;
    if (this._hass && this._config) this._update();
    if (this._confirm) window.addEventListener("keydown", this._onKey);
  }

  disconnectedCallback() {
    this._outside?.off();
    window.removeEventListener("keydown", this._onKey);
    // Left (another view, a conditional card hidden): back to the defaults, popup closed without running.
    this._confirm = null;
    this._connected = false;
    this._resetView();
    this._syncClock(false);
  }

  _resetView() {}

  _onOutside() {
    if (this._confirm) this._closeConfirm();
  }

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("Invalid configuration");
    if (config.entities !== undefined && !Array.isArray(config.entities)) throw new Error("entities must be a list");
    this._config = { ...config };
    this._html = "";
    this._lastDeps = null;
    this._update();
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _locale() {
    return intlLocale(this._hass, this._config);
  }

  // A duration in minutes, in words: "4 min", "1 h 20 min", "2 d".
  _dur(min) {
    const m = Math.floor(min);
    if (m < 60) return this._t("dur_m", { m: Math.max(1, m) });
    if (m >= 1440) return this._t("dur_d", { d: Math.floor(m / 1440) });
    const h = Math.floor(m / 60);
    return m % 60 ? this._t("dur_hm", { h, m: m % 60 }) : this._t("dur_h", { h });
  }

  // "Open for 14 min", "Locked just now".
  _since(st) {
    const state = this._t(st.key);
    return st.min < 1 ? this._t("state_now", { state }) : this._t("state_for", { state, d: this._dur(st.min) });
  }

  _entries() {
    return [];
  }

  _items() {
    const now = Date.now();
    return this._entries().map((e) => {
      const it = itemOf(this._hass, e, this._config);
      return { ...it, st: statusOf(it, now) };
    });
  }

  // Keeps a clock running while something shown changes with time (an open door's duration, the timeline's now).
  _syncClock(on) {
    if (on && this._connected && !this._clock) this._clock = setInterval(() => this._update(), TICK_MS);
    else if (!on && this._clock) {
      clearInterval(this._clock);
      this._clock = null;
    }
  }

  _update() {
    if (!this._hass || !this._config) return;
    let html = this._render();
    if (this._confirm) html = html.replace(/<ha-card([^>]*)>([\s\S]*)<\/ha-card>\s*$/, (_, a, inner) => `<ha-card${a} data-dialog>${inner}${this._confirmHtml()}</ha-card>`);
    if (html === this._html) return;
    this._html = html;
    // The focused element is found again by what identifies it (a tile that moved in the overview loses the focus
    // when it is moved), and focused again.
    const spot = focusSpot(this.shadowRoot.activeElement);
    if (!morph(this.shadowRoot, html)) this.shadowRoot.innerHTML = html;
    if (spot && focusSpot(this.shadowRoot.activeElement) !== spot) {
      [...this.shadowRoot.querySelectorAll("[data-entity], [data-action]")].find((el) => focusSpot(el) === spot)?.focus({ preventScroll: true });
    }
    // The popup's main button takes the focus once, when the popup opens.
    const opened = this._confirm && !this._confirmShown;
    this._confirmShown = Boolean(this._confirm);
    if (opened) this.shadowRoot.querySelector(".modal .primary")?.focus?.({ preventScroll: true });
  }

  // Today's history of the given entities, fetched once and again after a state change or five minutes. Null until
  // it is in (or when Home Assistant gives no websocket, as in a preview).
  _history(ids) {
    const h = this._hass;
    if (!h?.callWS || !ids.length) return null;
    const start = startOfDay(Date.now());
    const key = `${ids.join(",")}|${start}`;
    const stamp = ids.map((id) => h.states[id]?.last_changed).join("|");
    const c = this._hist;
    const age = c ? Date.now() - c.at : Number.POSITIVE_INFINITY;
    const fresh = c && c.key === key && (age < HISTORY_MIN_MS || (c.stamp === stamp && age < HISTORY_TTL));
    if (!fresh && !this._histPending) {
      this._histPending = true;
      const at = Date.now();
      Promise.resolve(
        h.callWS({
          type: "history/history_during_period",
          start_time: new Date(start).toISOString(),
          entity_ids: ids,
          minimal_response: true,
          no_attributes: true,
          significant_changes_only: false,
        }),
      )
        .then(
          (res) => (this._hist = { key, stamp, at, data: res || {} }),
          () => (this._hist = { key, stamp, at, data: c?.key === key ? c.data : {} }),
        )
        .finally(() => {
          this._histPending = false;
          this._update();
        });
    }
    return c?.key === key ? c.data : null;
  }

  _axis(cls = "") {
    const labels = [0, 6, 12, 18, 24].map((h) => `<span>${String(h).padStart(2, "0")}:00</span>`).join("");
    return `<div class="axis ${cls}" aria-hidden="true">${labels}</div>`;
  }

  _historyIds(items) {
    return items.flatMap((i) => [i.id, i.lock].filter(Boolean));
  }

  // ---- The banner -----------------------------------------------------------

  _banner({ title, sub, cls, icon, pill, scenes = "", zoom = "", entity }) {
    const night = isNight(this._hass, this._config) ? " night" : "";
    const show = this._config.show_title !== false;
    const target = entity ? ` data-entity="${esc(entity)}" role="button" tabindex="0" aria-label="${esc(title)}"` : "";
    return `<div class="banner${night}${zoom ? " zoomable" : ""}">
      <div class="siding"></div><div class="ground"></div>
      <div class="htext">
        <div class="badge ${cls}">${svgIcon(icon)}</div>
        <div class="titles">
          <div class="trow">${show ? `<span class="name">${esc(title)}</span>` : ""}<span class="chip ${cls}" title="${esc(pill)}"><span class="dot"></span><span class="t">${esc(pill)}</span></span></div>
          ${sub && this._config.show_subtitle !== false ? `<span class="bsub">${esc(sub)}</span>` : ""}
        </div>
      </div>
      ${scenes ? `<div class="bscene${entity ? " bclick" : ""}"${target}>${scenes}</div>` : ""}
      ${zoom}
    </div>`;
  }

  _scene(it, small = false) {
    return `<div class="bv${small ? " small" : ""}">${openingSvg(it.type, it.pos, { tripped: this._tripped(it) > 0 })}</div>`;
  }

  _thumb(it, cls = "") {
    return `<div class="thumb ${cls}">${openingSvg(it.type, it.pos, { tripped: this._tripped(it) > 0, crop: true })}</div>`;
  }

  // Breakers reporting off; one unavailable or unknown (a module offline) is not counted as tripped.
  _tripped(it) {
    return it.breakers.filter((id) => this._hass.states[id]?.state === "off").length;
  }

  _breakersKnown(it) {
    return it.breakers.filter((id) => ["on", "off"].includes(this._hass.states[id]?.state)).length;
  }

  _error(msg) {
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(msg)}</div></ha-card>`;
  }

  // ---- Clicks and the confirmation popup --------------------------------------

  _onClick(ev) {
    const path = ev.composedPath();
    const el = path.find((n) => n.dataset && (n.dataset.action || n.dataset.entity));
    if (!this._confirm && Date.now() - (this._confirmClosedAt ?? 0) < CONFIRM_GUARD_MS) return ev.stopPropagation();
    if (this._confirm) {
      ev.stopPropagation();
      const action = el?.dataset.action;
      if (action === "confirm_ok") {
        const run = this._confirm.run;
        this._closeConfirm();
        run();
      } else if (action === "confirm_cancel" || (action === "confirm_backdrop" && path[0] === el)) this._closeConfirm();
      return;
    }
    if (!el) return;
    ev.stopPropagation();
    const { action, entity, value } = el.dataset;
    if (action) return this._action(action, value, ev);
    this._moreInfo(entity);
  }

  _action() {}

  _moreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }

  _ask(message, okLabel, run) {
    this._confirm = { message, okLabel, run };
    window.addEventListener("keydown", this._onKey);
    this._update();
  }

  _closeConfirm() {
    this._confirm = null;
    this._confirmClosedAt = Date.now();
    window.removeEventListener("keydown", this._onKey);
    this._update();
  }

  _confirmHtml() {
    const c = this._confirm;
    return `<div class="backdrop" data-action="confirm_backdrop"><div class="modal" role="alertdialog" aria-modal="true" aria-label="${esc(c.message)}">
      <div class="msg">${esc(c.message)}</div>
      <div class="modal-actions"><button class="btn" data-action="confirm_cancel"><span>${esc(this._t("cancel"))}</span></button>
      <button class="btn primary" data-action="confirm_ok"><span>${esc(c.okLabel)}</span></button></div></div></div>`;
  }

  _call(domain, service, data) {
    return Promise.resolve(this._hass.callService(domain, service, data)).catch(() => {});
  }

  getCardSize() {
    return 3;
  }
}
