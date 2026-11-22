// Keyboard access: every clickable element can be reached and used from the keyboard, icon buttons have a name.
import assert from "node:assert/strict";
import { test } from "node:test";
import { load, newCard } from "./load.mjs";

const oc = load();
const clickables = (html) => html.match(/<[a-z-]+\b[^>]*\bdata-(?:entity|action)="[^"]*"[^>]*>/g) || [];

test("every clickable element is a button or has the button role and a tab stop", () => {
  const cards = [
    newCard(oc.OpeningCard, { entity: "binary_sensor.front_door", lock: "lock.front_door", doorbell: "event.front_doorbell" }),
    newCard(oc.OpeningMiniCard, { entity: "binary_sensor.front_door" }),
    newCard(oc.OpeningOverviewCard, {}),
    newCard(oc.OpeningJournalCard, {}),
  ];
  for (const card of cards) {
    const tags = clickables(card.shadowRoot.innerHTML.replace(/<style>[\s\S]*?<\/style>/g, ""));
    assert.ok(tags.length > 0);
    for (const tag of tags) {
      if (tag.startsWith("<button")) continue;
      if (tag.startsWith('<div class="backdrop"')) continue;
      assert.match(tag, /\brole="button"/, tag);
      assert.match(tag, /\btabindex="0"/, tag);
    }
  }
});

test("Enter and Space activate an element with the button role", () => {
  const card = newCard(oc.OpeningCard, { entity: "binary_sensor.front_door" });
  let clicks = 0;
  const el = { getAttribute: (a) => (a === "role" ? "button" : null), click: () => clicks++ };
  for (const key of ["Enter", " ", "a"]) card.shadowRoot.listeners.keydown({ key, target: el, preventDefault() {} });
  assert.equal(clicks, 2);
});

test("buttons have a name, tabs say which is selected", () => {
  const html = newCard(oc.OpeningOverviewCard, {}).shadowRoot.innerHTML + newCard(oc.OpeningMiniCard, { entity: "binary_sensor.front_door" }).shadowRoot.innerHTML;
  for (const b of html.match(/<button [^>]*>/g) || []) assert.match(b, /aria-label="[^"]+"|role="tab"|class="filter/, b);
  assert.match(html, /role="tab"[^>]*aria-selected="true"/);
});

test("animations stop with prefers-reduced-motion", () => {
  const html = newCard(oc.OpeningCard, { entity: "binary_sensor.office_door" }).shadowRoot.innerHTML;
  assert.match(html, /@media \(prefers-reduced-motion: reduce\) \{ \*, \*::before, \*::after \{ transition: none !important; animation: none !important; \} \}/);
});
