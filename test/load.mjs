// Evaluates the bundled card source (test/source.mjs) (a classic script, bundled as is by scripts/build.mjs) in a sandbox with minimal DOM
// stand-ins and returns the names the tests need. No dependency, no browser.
import vm from "node:vm";
import { areas, devices, entities, historyAt, statesAt } from "../scripts/mock-states.mjs";
import { source } from "./source.mjs";


// Shadow root stand-in: keeps the HTML it is given and the listeners it gets.
const fakeRoot = () => ({
  innerHTML: "",
  listeners: {},
  addEventListener(type, fn) {
    this.listeners[type] = fn;
  },
  querySelector() {
    return null;
  },
  querySelectorAll() {
    return [];
  },
});

export const load = () => {
  const registry = new Map();
  class HTMLElement {
    attachShadow() {
      this.shadowRoot = fakeRoot();
      return this.shadowRoot;
    }
    dispatchEvent(ev) {
      (this.events ||= []).push(ev);
    }
    appendChild() {}
  }
  class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  }
  const docListeners = {};
  const sandbox = {
    HTMLElement,
    CustomEvent,
    Intl,
    console: { info() {}, warn() {} },
    customElements: { get: (t) => registry.get(t), define: (t, c) => registry.set(t, c) },
    document: {
      createElement: (t) => (registry.has(t) ? new (registry.get(t))() : { tagName: t.toUpperCase(), appendChild() {}, addEventListener() {} }),
      addEventListener: (type, fn) => (docListeners[type] ||= new Set()).add(fn),
      removeEventListener: (type, fn) => docListeners[type]?.delete(fn),
    },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  };
  sandbox.fireDocument = (type, ev) => {
    for (const fn of [...(docListeners[type] || [])]) fn(ev);
  };
  const winListeners = {};
  sandbox.addEventListener = (type, fn) => (winListeners[type] ||= new Set()).add(fn);
  sandbox.removeEventListener = (type, fn) => winListeners[type]?.delete(fn);
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  return vm.runInContext(
    `${source}
    ({ STRINGS, TYPES, ALL_TYPES, SCENES, typeOf, posOf, lockOf, itemOf, statusOf, autoEntities, spansOf, dayOf, openingSvg, toForm, fromForm, relatedOf,
       OpeningCard: customElements.get("opening-card"), OpeningMiniCard: customElements.get("opening-mini-card"),
       OpeningOverviewCard: customElements.get("opening-overview-card"), OpeningJournalCard: customElements.get("opening-journal-card"),
       editors: ["opening-card-editor", "opening-mini-card-editor", "opening-overview-card-editor", "opening-journal-card-editor"].map((n) => customElements.get(n)),
       window, document })`,
    sandbox,
  );
};

// A mock hass recording its service calls; `patch` changes states ({ id: "state" } or { id: { state, …attributes } }).
// With `history`, callWS answers today's history from the mock (synchronously resolved).
export const makeHass = (patch = {}, { language = "en", history = false, now = Date.now() } = {}) => {
  const st = statesAt(now);
  for (const [id, p] of Object.entries(patch)) {
    if (p === null) {
      delete st[id];
      continue;
    }
    const { state, ...attributes } = typeof p === "string" ? { state: p } : p;
    st[id] = { ...st[id], entity_id: id, state: state ?? st[id]?.state, attributes: { ...st[id]?.attributes, ...attributes } };
  }
  const calls = [];
  const ws = [];
  const hass = { calls, ws, states: st, entities, devices, areas, language, locale: { language }, callService: (...a) => calls.push(a) };
  if (history) {
    hass.callWS = (msg) => {
      ws.push(msg);
      return Promise.resolve(historyAt(now, msg.entity_ids));
    };
  }
  return hass;
};

export const newCard = (Card, config, hass = makeHass()) => {
  const card = new Card();
  card.setConfig(config);
  card.hass = hass;
  return card;
};

// A click as the shadow root receives it, on an element with these data attributes.
export const click = (card, dataset) => card._onClick({ composedPath: () => [{ dataset }], stopPropagation() {} });

// The card's markup, without its style sheets.
export const html = (card) => card.shadowRoot.innerHTML.replace(/<style>[\s\S]*?<\/style>/g, "");

export const plain = (v) => JSON.parse(JSON.stringify(v));

export const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
