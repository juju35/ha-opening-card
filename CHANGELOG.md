# Changelog

## 1.0.5 - 2026-11-27

### Fixes
- Idle states use the theme's secondary text colour (`--secondary-text-color`), like every ha-* card.
- Tiles have the 10 px corner radius shared by the ha-* cards.

## 1.0.4 - 2026-11-24

### Maintenance
- The card source is split into ES modules: `src/` (entry `src/index.js`), cut at its sections, with the translations in one file per language (`i18n/<lang>.js`). `scripts/bundle.mjs` concatenates them back, in their original order, into the same single file and per-language files as before; the tests evaluate that bundle.

## 1.0.3 - 2026-11-22

### Fixes
- Opening Card and Opening Mini Card: the `name` option is now used in the header title and the unlock/open confirmations (the entity's own name was always shown).

## 1.0.2 - 2026-11-22

### Performance
- Card picker: the previews are back (`preview: true`), and light. Each card's preview is drawn only once it scrolls into view of Home Assistant's card picker, which otherwise builds the preview of every card at once: until then it holds Home Assistant's state (no render, no history request, no animation). On a dashboard or in the card editor the card is drawn as before.

## 1.0.1 - 2026-11-22

### Performance
- Card picker: the cards no longer ask Home Assistant for a live preview (`preview: false` in `window.customCards`). The picker drew every card at once (history requests, animations), which made the list slow to open; it now shows each card's description instead.

## 1.0.0 - 2026-11-22

### Features

- Opening Card (`custom:opening-card`): a door or window drawn and animated (14 kinds: front, interior, French, sliding patio door, wicket gate, pet flap, trapdoor, windows of every kind, electrical panel), its kind found from the device class and the name, with its lock (Lock, Unlock and Open buttons, unlocking asking first), window handle, doorbell, battery, heating, pet, breakers and power, an open-too-long alert and today's timeline
- Opening Mini Card (`custom:opening-mini-card`): the illustrated header, unfolding into the full card
- Opening Overview Card (`custom:opening-overview-card`): every door and window as tiles, alerts first, filters and a Journal tab; garage doors and gates read only
- Opening Journal Card (`custom:opening-journal-card`): today's 24-hour bar of every opening, longest and last opening
- Illustrated 90 px header, day and night, visual editors, 22 languages
