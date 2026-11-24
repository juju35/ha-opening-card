// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------
import { ALL_TYPES } from "./opening-types.js";
import { lang, t } from "./strings.js";
import { STRINGS } from "./i18n/strings.js";

export const LANGUAGES = [
  ["en", "English"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["es", "Español"],
  ["sr", "Српски"],
  ["sr-Latn", "Srpski (latinica)"],
  ["it", "Italiano"],
  ["nl", "Nederlands"],
  ["pt", "Português (Portugal)"],
  ["pl", "Polski"],
  ["ro", "Română"],
  ["da", "Dansk"],
  ["sv", "Svenska"],
  ["bg", "Български"],
  ["ru", "Русский"],
  ["uk", "Українська"],
  ["hu", "Magyar"],
  ["sk", "Slovenčina"],
  ["cs", "Čeština"],
  ["sl", "Slovenščina"],
  ["lv", "Latviešu"],
  ["el", "Ελληνικά"],
];

export const entityField = (name, domain) => ({ name, selector: { entity: { domain } } });

// Options of each editor, by field: the single cards (with the mini card's detail button), the lists.
export const SINGLE_FIELDS = (tr, mini) => [
  entityField("entity", ["binary_sensor", "sensor", "cover"]),
  { name: "name", selector: { text: {} } },
  {
    name: "opening_type",
    selector: { select: { mode: "dropdown", options: [{ value: "auto", label: tr("type_auto") }, ...ALL_TYPES.map((v) => ({ value: v, label: tr(`y_${v}`) }))] } },
  },
  entityField("lock", "lock"),
  entityField("handle", "sensor"),
  entityField("doorbell", ["event", "binary_sensor"]),
  entityField("battery", "sensor"),
  entityField("climate", "climate"),
  entityField("power", "sensor"),
  entityField("pet", ["binary_sensor", "device_tracker"]),
  { name: "open_alert", selector: { number: { min: 0, max: 1440, mode: "box", unit_of_measurement: "min" } } },
  {
    type: "grid",
    name: "",
    schema: [...(mini ? ["zoom"] : []), "show_history", "confirm"].map((name) => ({ name, selector: { boolean: {} } })),
  },
];
export const LIST_FIELDS = (overview) => [
  { name: "title", selector: { text: {} } },
  { name: "entities", selector: { entity: { domain: ["binary_sensor", "sensor", "cover"], multiple: true } } },
  { name: "open_alert", selector: { number: { min: 0, max: 1440, mode: "box", unit_of_measurement: "min" } } },
  { type: "grid", name: "", schema: [...(overview ? ["show_journal"] : []), "include_covers"].map((name) => ({ name, selector: { boolean: {} } })) },
];
export const COMMON_FIELDS = (tr) => [
  {
    name: "illustration_theme",
    selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((v) => ({ value: v, label: tr(`theme_${v}`) })) } },
  },
  {
    name: "language",
    selector: { select: { mode: "dropdown", options: [{ value: "", label: tr("lang_auto") }, ...LANGUAGES.map(([value, label]) => ({ value, label }))] } },
  },
];
// Toggles and their defaults: a value at its default stays out of the YAML.
export const DEFAULTS = { zoom: true, show_history: true, confirm: true, show_journal: true, include_covers: true, open_alert: 10 };

export const toForm = (config) => {
  const data = { ...DEFAULTS, ...config };
  data.opening_type ??= "auto";
  data.illustration_theme ??= "auto";
  data.entities = (Array.isArray(config.entities) ? config.entities : []).map((e) => (typeof e === "string" ? e : e?.entity)).filter(Boolean);
  return data;
};

export const fromForm = (value, previous) => {
  const config = { ...value };
  // An opening given as an object (its own lock, name…) keeps its options.
  const objects = new Map((Array.isArray(previous.entities) ? previous.entities : []).filter((e) => e && typeof e === "object").map((e) => [e.entity, e]));
  const ids = Array.isArray(config.entities) ? config.entities.filter(Boolean) : [];
  if (ids.length) config.entities = ids.map((id) => objects.get(id) || id);
  else delete config.entities;
  if (config.opening_type === "auto") delete config.opening_type;
  if (config.illustration_theme === "auto") delete config.illustration_theme;
  for (const [k, v] of Object.entries(config)) {
    if (v === "" || v === undefined || v === null || (k in DEFAULTS && v === DEFAULTS[k])) delete config[k];
  }
  return config;
};

export class OpeningEditorBase extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _fields() {
    return [];
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, `e_${s.name}`);
      this._form.computeHelper = (s) => (STRINGS.en[`h_${s.name}`] ? t(this._hass, this._config, `h_${s.name}`) : undefined);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = fromForm(ev.detail.value, this._config);
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    if (this._formConfig !== this._config) {
      this._formConfig = this._config;
      this._form.data = toForm(this._config);
    }
    const l = lang(this._hass, this._config);
    if (this._schemaLang !== l) {
      this._schemaLang = l;
      const tr = (k) => t(this._hass, this._config, k);
      this._form.schema = [...this._fields(tr), ...COMMON_FIELDS(tr)];
    }
  }
}

export class OpeningCardEditor extends OpeningEditorBase {
  _fields(tr) {
    return SINGLE_FIELDS(tr, false);
  }
}
export class OpeningMiniCardEditor extends OpeningEditorBase {
  _fields(tr) {
    return SINGLE_FIELDS(tr, true);
  }
}
export class OpeningOverviewCardEditor extends OpeningEditorBase {
  _fields() {
    return LIST_FIELDS(true);
  }
}
export class OpeningJournalCardEditor extends OpeningEditorBase {
  _fields() {
    return LIST_FIELDS(false);
  }
}
