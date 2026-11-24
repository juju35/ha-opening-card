// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
import { VERSION, pickerDefine } from "./card-picker.js";
import { OpeningCard } from "./opening-card-2.js";
import { OpeningMiniCard } from "./opening-mini-card.js";
import { OpeningJournalCard, OpeningOverviewCard } from "./opening-overview-card.js";
import { OpeningCardEditor, OpeningJournalCardEditor, OpeningMiniCardEditor, OpeningOverviewCardEditor } from "./visual-editors.js";

export const define = (name, cls) => {
  if (!customElements.get(name)) pickerDefine(name, cls);
};
define("opening-card", OpeningCard);
define("opening-mini-card", OpeningMiniCard);
define("opening-overview-card", OpeningOverviewCard);
define("opening-journal-card", OpeningJournalCard);
define("opening-card-editor", OpeningCardEditor);
define("opening-mini-card-editor", OpeningMiniCardEditor);
define("opening-overview-card-editor", OpeningOverviewCardEditor);
define("opening-journal-card-editor", OpeningJournalCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  { type: "opening-card", name: "Opening Card", description: "A door or window drawn and animated, with its lock, handle, doorbell, open-too-long alert and today's timeline." },
  { type: "opening-mini-card", name: "Opening Mini Card", description: "The illustrated banner of a door or window, unfolding into the full card." },
  { type: "opening-overview-card", name: "Opening Overview Card", description: "Every door and window as tiles, with filters and a Journal tab." },
  { type: "opening-journal-card", name: "Opening Journal Card", description: "Today's timeline of every door and window, longest and last opening." },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-opening-card" });
}

console.info(
  `%c OPENING-CARD %c v${VERSION} `,
  "color: white; background: #9a6a3a; font-weight: 700;",
  "color: #9a6a3a; background: white; font-weight: 700;",
);
