// ---------------------------------------------------------------------------
// opening-overview-card and opening-journal-card: every door and window
// ---------------------------------------------------------------------------
import { ICONS } from "./icons.js";
import { esc } from "./strings.js";
import { autoEntities, byStatus, isAjar } from "./states.js";
import { dayOf, fmtTime, startOfDay } from "./durations.js";
import { SCENE_STYLE } from "./illustrations.js";
import { BANNER_STYLE, BASE_STYLE, BODY_STYLE, LIST_STYLE } from "./styles.js";
import { isNight } from "./clicks-elsewhere.js";
import { OpeningBase } from "./base-card.js";
import { dayBar } from "./opening-card-2.js";

export const FILTERS = ["all", "open", "unlocked", "alert"];
export const FILTER_CLS = { all: "", open: "active", unlocked: "warn", alert: "crit" };
export const matches = (it, f) =>
  f === "all" || (f === "open" && isAjar(it.pos)) || (f === "unlocked" && it.lockState === "unlocked") || (f === "alert" && (it.st.alert || it.st.cls === "crit"));

export class OpeningListBase extends OpeningBase {
  static getStubConfig() {
    return {};
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  getCardSize() {
    return 6;
  }

  _entries() {
    const list = this._config.entities;
    return Array.isArray(list) && list.length ? list : autoEntities(this._hass, this._config.include_covers !== false);
  }

  _items() {
    return super._items().sort(byStatus);
  }

  _summary(items) {
    const alerts = items.filter((i) => i.st.alert || i.st.cls === "crit").length;
    const open = items.filter((i) => isAjar(i.pos)).length;
    if (alerts) return { cls: "crit", pill: alerts === 1 ? this._t("one_alert") : this._t("n_alerts", { n: alerts }) };
    if (open) return { cls: "active", pill: this._t("n_open", { n: open }) };
    return { cls: "ok", pill: this._t("all_closed") };
  }

  // The banner of a list: its two first openings drawn (alerts and open ones come first).
  _listBanner(items, sub) {
    const sum = this._summary(items);
    const icon = sum.cls === "ok" ? ICONS.home_lock : ICONS.door_open;
    const scenes = items
      .slice(0, 2)
      .map((i) => this._scene(i, true))
      .join("");
    return this._banner({ title: this._config.title || this._t("openings"), sub, cls: sum.cls, icon, pill: sum.pill, scenes });
  }

  _shell(items, body, extraStyle = "") {
    this._syncClock(true);
    return `<style>${BASE_STYLE}${SCENE_STYLE}${BANNER_STYLE}${BODY_STYLE}${LIST_STYLE}${extraStyle}</style>
      <ha-card class="${isNight(this._hass, this._config) ? "night" : ""}">${this._listBanner(items, this._t("n_tracked", { n: items.length }))}${body}</ha-card>`;
  }

  // ---- Journal ----------------------------------------------------------------------

  _journal(items) {
    const hist = this._history(this._historyIds(items));
    const now = Date.now();
    const start = startOfDay(now);
    const days = items.map((it) => ({ it, d: dayOf(hist, it, start, now) }));
    let longest = null;
    let last = null;
    for (const { it, d } of days) {
      for (const s of d.spans) {
        if (!longest || s[1] - s[0] > longest.s[1] - longest.s[0]) longest = { it, s };
        if (s[0] > start && (!last || s[0] > last.s[0])) last = { it, s };
      }
    }
    const loc = this._locale();
    const sum = (k, big, v, cls) => `<div class="sum ${cls}"><span class="k">${esc(this._t(k))}</span><b>${esc(big)}</b><span class="v">${esc(v)}</span></div>`;
    const sums = `<div class="sums">${sum("longest", longest ? this._dur((longest.s[1] - longest.s[0]) / 60000) : "—", longest ? `${longest.it.name} · ${fmtTime(longest.s[0], loc)}` : this._t("no_opening"), "active")}${sum(
      "last",
      last ? this._t("ago", { d: this._dur((now - last.s[0]) / 60000) }) : "—",
      last ? last.it.name : this._t("no_opening"),
      "active",
    )}</div>`;
    const rows = days
      .map(
        ({ it, d }) => `<div class="row ${it.st.cls}" role="button" tabindex="0" data-entity="${esc(it.id)}" aria-label="${esc(`${it.name}: ${this._t(it.st.key)}, ${d.count}×`)}">
        ${this._thumb(it, "sm")}
        <div class="rbody"><div class="rhead"><span class="dname">${esc(it.name)}</span><span class="rv"><b>${esc(this._t(it.st.key))}</b> · ${d.count}×</span></div>
        ${dayBar(d, start, now, it.st.alert, true)}</div></div>`,
      )
      .join("");
    return `<div class="content">${hist ? sums : ""}<div class="rows">${rows}</div>${this._axis("indent")}</div>`;
  }
}

export class OpeningOverviewCard extends OpeningListBase {
  static getConfigElement() {
    return document.createElement("opening-overview-card-editor");
  }

  _resetView() {
    this._tab = "list";
    this._filter = "all";
  }

  _action(action, value) {
    if (action === "tab") this._tab = value;
    else if (action === "filter") this._filter = value;
    this._update();
  }

  _render() {
    const items = this._items();
    if (!items.length) return this._error(this._t("none_found"));
    const journal = this._config.show_journal !== false;
    const tab = journal && this._tab === "journal" ? "journal" : "list";
    const tabs = journal
      ? `<div class="tabs" role="tablist" aria-label="${esc(this._t("tabs"))}">${[
          ["list", "openings"],
          ["journal", "journal"],
        ]
          .map(
            ([id, key]) =>
              `<button class="tab" role="tab" data-action="tab" data-value="${id}" aria-selected="${tab === id ? "true" : "false"}">${esc(this._t(key))}</button>`,
          )
          .join("")}</div>`
      : "";
    return this._shell(items, `${tabs}${tab === "journal" ? this._journal(items) : this._list(items)}`);
  }

  _list(items) {
    const f = FILTERS.includes(this._filter) ? this._filter : "all";
    const hasLocks = items.some((i) => i.ls);
    const filters = FILTERS.filter((id) => id !== "unlocked" || hasLocks)
      .map((id) => {
        const n = items.filter((i) => matches(i, id)).length;
        return `<button class="filter ${FILTER_CLS[id]}" data-action="filter" data-value="${id}" aria-pressed="${f === id ? "true" : "false"}">${esc(this._t(`f_${id}`))} · ${n}</button>`;
      })
      .join("");
    const shown = items.filter((i) => matches(i, f));
    const doors = shown
      .map(
        (it) => `<div class="door ${it.st.cls}" role="button" tabindex="0" data-entity="${esc(it.id)}" aria-label="${esc(`${it.name}: ${this._since(it.st)}`)}">
        <span class="dot"></span>${this._thumb(it)}
        <div class="dtxt"><span class="dname">${esc(it.name)}</span><span class="dstate">${esc(this._since(it.st))}</span>${it.readOnly ? `<span class="ro">${esc(this._t("read_only"))}</span>` : ""}</div></div>`,
      )
      .join("");
    return `<div class="content"><div class="filters">${filters}</div>${shown.length ? `<div class="grid">${doors}</div>` : `<div class="empty">${esc(this._t("nothing"))}</div>`}</div>`;
  }
}

export class OpeningJournalCard extends OpeningListBase {
  static getConfigElement() {
    return document.createElement("opening-journal-card-editor");
  }

  _render() {
    const items = this._items();
    if (!items.length) return this._error(this._t("none_found"));
    return this._shell(items, this._journal(items));
  }
}
