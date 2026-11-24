// ---------------------------------------------------------------------------
// Clicks elsewhere
// ---------------------------------------------------------------------------

export const DIALOG_TAGS = new Set(["HA-MORE-INFO-DIALOG", "HA-DIALOG", "DIALOG"]);
export const isOutside = (card, ev) => {
  const path = ev.composedPath();
  return !path.includes(card) && !path.some((n) => DIALOG_TAGS.has(n.tagName));
};
// A press and a release both outside the card count as a click elsewhere (iOS sends no click for a tap on nothing);
// keyboard clicks still go through the click event.
export const watchOutside = (isOut, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = isOut(ev);
  };
  const onUp = (ev) => {
    if (downOutside && isOut(ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0 && isOut(ev)) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
  };
};

// The card is updated in place, not rewritten: the same elements stay, only what changed is patched. A picture
// keeps its <svg>, so its leaf swings open with the CSS transition when its class turns to "open"; the keyboard
// focus stays on its element; running animations (a leaf stirring, the alert ring) are not restarted.
export const morphAttrs = (cur, next) => {
  for (const a of [...cur.attributes]) if (!next.hasAttribute(a.name)) cur.removeAttribute(a.name);
  for (const a of [...next.attributes]) if (cur.getAttribute(a.name) !== a.value) cur.setAttribute(a.name, a.value);
};
// Children are matched by their entity (data-entity) when they have one, by position otherwise: a tile that moves
// in the overview (an opening turning into an alert goes first) keeps its element, its picture and its focus.
export const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-entity") : null);
export const morphChildren = (cur, next) => {
  const keyed = new Map();
  for (const c of cur.childNodes) {
    const k = keyOf(c);
    if (k && !keyed.has(k)) keyed.set(k, c);
  }
  const after = [...next.childNodes];
  after.forEach((n, i) => {
    const ref = cur.childNodes[i] || null;
    const k = keyOf(n);
    const c = k ? keyed.get(k) : ref && !keyOf(ref) ? ref : null;
    if (k) keyed.delete(k);
    if (!c || c.nodeType !== n.nodeType || c.nodeName !== n.nodeName) {
      cur.insertBefore(n, ref);
      return;
    }
    if (c !== ref) cur.insertBefore(c, ref);
    if (n.nodeType === 1) {
      morphAttrs(c, n);
      morphChildren(c, n);
    } else if (c.nodeValue !== n.nodeValue) c.nodeValue = n.nodeValue;
  });
  while (cur.childNodes.length > after.length) cur.removeChild(cur.lastChild);
};
// What identifies a clickable element across renders.
export const focusSpot = (el) => {
  const d = el?.dataset;
  if (!d) return null;
  // Its kind (first class: tile, door, row…, not the state ones), entity, action and value.
  const kind = String(el.className?.baseVal ?? el.className ?? "").split(" ")[0];
  return d.entity || d.action ? `${kind}|${d.entity || ""}|${d.action || ""}|${d.value || ""}` : null;
};

// Patches `root` to `html`; false when it cannot (first render, or no DOM template, as in the tests).
export const morph = (root, html) => {
  if (!root.firstChild || typeof document === "undefined") return false;
  const tpl = document.createElement("template");
  if (!tpl.content) return false;
  tpl.innerHTML = html;
  morphChildren(root, tpl.content);
  return true;
};

export const isNight = (hass, config) => {
  if (config?.illustration_theme === "night") return true;
  if (config?.illustration_theme === "day") return false;
  return Boolean(hass?.themes?.darkMode);
};

// How long a history fetch is kept before it is asked again. A state change asks again too, at most once a minute:
// the current states are added to the fetched history meanwhile, so the bars stay up to date between fetches.
export const HISTORY_TTL = 5 * 60000;
export const HISTORY_MIN_MS = 60000;
// While something is open (its "open for" and alert), and for the timeline's "now", the card redraws this often.
export const TICK_MS = 30000;
// After the popup closes, clicks are ignored for this long (the second click of a double click on OK).
export const CONFIRM_GUARD_MS = 400;
