# Changelog

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
