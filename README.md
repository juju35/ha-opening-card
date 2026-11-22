# ha-opening-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![HACS Validation](https://github.com/juju35/ha-opening-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/juju35/ha-opening-card/actions/workflows/hacs.yml)
[![Validate](https://github.com/juju35/ha-opening-card/actions/workflows/validate.yml/badge.svg)](https://github.com/juju35/ha-opening-card/actions/workflows/validate.yml)
[![Lint](https://github.com/juju35/ha-opening-card/actions/workflows/lint.yml/badge.svg)](https://github.com/juju35/ha-opening-card/actions/workflows/lint.yml)
[![Release](https://img.shields.io/github/v/release/juju35/ha-opening-card)](https://github.com/juju35/ha-opening-card/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-opening-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/images/icon.svg" alt="Opening Card" width="120"></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/images/zha.png" alt="ZHA" width="64">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/images/zwave_js.png" alt="Z-Wave" width="64">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/images/matter.png" alt="Matter" width="64">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/images/mqtt.png" alt="MQTT" width="64">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/images/shelly.png" alt="Shelly" width="64">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/images/tuya.png" alt="Tuya" width="64">&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/images/switchbot.png" alt="SwitchBot" width="64">
</p>

Lovelace cards for Home Assistant's **doors, windows and electrical panel**. Each opening is drawn as a little animated picture of its own kind — front door, interior door, French door, sliding patio door, wicket gate, pet flap, trapdoor, windows of every kind, electrical panel — that opens with its contact sensor, next to what goes with it: its lock (with Lock, Unlock and Open buttons), its window handle (open, tilted, closed), its doorbell, its battery, the heating it pauses, an **open-too-long alert** and **today's timeline** of its openings. An overview shows every door and window of the house at once, with filters and a journal of the day.

The cards read standard entities only (`binary_sensor` of the `door`, `window`, `opening` and `garage_door` classes, `lock`, `event`, `climate`, `sensor`), so they work with every integration that provides them. Garage doors and gates are controlled by [ha-cover-card](https://github.com/juju35/ha-cover-card); the overview shows them read only.

[![Open your Home Assistant instance and open a repository inside the Marketplace.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-opening-card&category=plugin)

| Opening Card | Opening Overview Card |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/card.png" alt="opening card" width="420"> | <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/overview.png" alt="opening overview card" width="480"> |

## Features

- Four cards: a full **Opening Card** (`custom:opening-card`), its **Opening Mini Card** (`custom:opening-mini-card`), an **Opening Overview Card** (`custom:opening-overview-card`) and an **Opening Journal Card** (`custom:opening-journal-card`)
- **14 kinds of openings drawn**: front door, interior door, French door (one or two leaves), sliding patio door, wicket gate, pet flap, trapdoor, window (one or two sashes), tilt-and-turn window, sliding window, hopper window and electrical panel — plus garage doors and gates, shown read only
- The kind of opening is **found on its own** from the device class and the name (*Front door*, *Porte-fenêtre*, *Baie vitrée*, *Chatière*, *Oscillo-battant*, *Soufflet*, *Tableau électrique*, *Kippfenster*, *Balkontür*…), and forced with `opening_type`
- The picture **opens with the contact**: the leaf swings on its hinges, the patio door slides, the sash tilts, the flap swings; while open it stirs gently in the draught, and the room behind lights up warm. Night picture with a dark Home Assistant theme
- **Lock**: its state on a tile and its buttons — *Lock*, *Unlock* and *Open* (unlatch, for the locks that support it), unlocking and opening asking first in a popup at the top of the card. The lock of the sensor's own device is used when none is set
- **Window handle** (a sensor reporting open / tilted / closed): a tilted window is drawn tilted and said *Tilted*
- **Open-too-long alert**: an opening open longer than `open_alert` minutes (10 by default) turns red, its icon pulses and a line says for how long
- **Today's timeline**: every opening of the day on a 24-hour bar (the unlocked time in amber), with their number and total open time, read from Home Assistant's history
- Tiles for the **doorbell** (time of the last ring, from an `event` or a `binary_sensor`), the **battery** (the sensor's own device's, found on its own), the **heating** (*Paused* while the window is open), the **pet** (inside or outside, for a pet flap), the **breakers** and the **power** of an electrical panel (a tripped breaker lights red in the picture)
- **Illustrated header** (90 px, all cards): the opening drawn on a facade, standing on a pavement strip, the round icon and the status pill in the state color — green closed or locked, amber unlocked, blue open, red alert or unavailable
- **Mini card**: the illustrated header alone, with a detail button at the top right that unfolds the full card; a click elsewhere folds it back
- **Overview**: every door and window (all the door, window and opening sensors when no list is given, garage doors and gates read only), alerts first, with **filters** (All, Open, Unlocked, Alerts) and a **Journal** tab
- **Journal**: one 24-hour bar per opening, the longest and the last opening of the day — as a tab of the overview or a card of its own
- Click a tile, an opening or the picture to open the Home Assistant more-info dialog
- Visual editor for the four cards (no YAML needed); options left at their default stay out of the YAML
- Keyboard and screen readers: every clickable element reachable and named; `prefers-reduced-motion` honoured
- Light and dark mode, English, French, German, Spanish, Serbian (Cyrillic and Latin), Italian, Dutch, European Portuguese, Polish, Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian and Greek
- Single file, no external dependency

## Supported integrations

Every integration that provides door and window sensors (`binary_sensor` with the `door`, `window`, `opening` or `garage_door` device class), locks (`lock`) and doorbells (`event` or `binary_sensor`). For example:

| Integration | Typical entities |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/images/zha.png" alt="" width="16"> [ZHA](https://www.home-assistant.io/integrations/zha/), [Zigbee2MQTT](https://www.zigbee2mqtt.io/) / <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/images/mqtt.png" alt="" width="16"> [MQTT](https://www.home-assistant.io/integrations/binary_sensor.mqtt/) | Door and window contacts (Aqara, Sonoff, IKEA…), window handles, smart locks |
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/images/zwave_js.png" alt="" width="16"> [Z-Wave](https://www.home-assistant.io/integrations/zwave_js/) | Door and window sensors, door locks |
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/images/matter.png" alt="" width="16"> [Matter](https://www.home-assistant.io/integrations/matter/) | Contact sensors, door locks (unlatch included) |
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/images/shelly.png" alt="" width="16"> [Shelly](https://www.home-assistant.io/integrations/shelly/) | Shelly Door/Window sensors (with their battery) |
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/images/tuya.png" alt="" width="16"> [Tuya](https://www.home-assistant.io/integrations/tuya/), <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/images/switchbot.png" alt="" width="16"> [SwitchBot](https://www.home-assistant.io/integrations/switchbot/) | Contact sensors, smart locks |
| [Nuki](https://www.home-assistant.io/integrations/nuki/), [Sure Petcare](https://www.home-assistant.io/integrations/surepetcare/) | Smart locks with their door sensor; pet flaps and pet presence |
| [Template](https://www.home-assistant.io/integrations/template/), [Group](https://www.home-assistant.io/integrations/group/) | Any sensor you build, groups of doors or windows |

Set the device class of a sensor in **Settings → Entities → (the sensor) → Show as**, or draw another kind with the `opening_type` option of the card.

## Prerequisites

Home Assistant 2024.8 or later. Today's timeline needs the Recorder (on by default).

## Installation

### Via the Marketplace (recommended)

Click the button below to add the repository directly:

[![Add to the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-opening-card&category=plugin)

Then click **Install**, and reload your browser when the Marketplace asks you to. The resource is `/local/community/ha-opening-card/opening-card.js`.

Or manually:

1. Open **Settings → Marketplace → Add from link** (top right; this needs a GitHub account connected)
2. Add `https://github.com/juju35/ha-opening-card` — Type: **Dashboard**
3. Open **Opening Cards** and click **Install**
4. Clear your browser cache and refresh

### Manual

1. Download `opening-card.js` and the `opening-card.i18n.*.js` translation files from the [latest release](https://github.com/juju35/ha-opening-card/releases/latest)
2. Copy them all to `/config/www/` (without the translation files, the cards show in English)
3. Go to **Settings → Dashboards → ⋮ → Resources** → Add resource:
   - URL: `/local/opening-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

## Configuration

### Card types

| Card | Type |
|---|---|
| Opening Card | `custom:opening-card` |
| Opening Mini Card | `custom:opening-mini-card` |
| Opening Overview Card | `custom:opening-overview-card` |
| Opening Journal Card | `custom:opening-journal-card` |

### Visual editor

Edit a dashboard, click **Add card** and search for **Opening**. The full and mini cards start with your first door or window sensor, the overview and journal cards with every one of them. Pick the sensor, its kind, its lock, handle, doorbell, battery, heating, power and pet, the alert delay, the parts to show, the illustration theme and the language. The preview updates live. The breakers of an electrical panel and the per-opening options of the overview are set in YAML (**YAML only** below); the editor keeps them.

### Minimal

```yaml
type: custom:opening-card
entity: binary_sensor.front_door
```

```yaml
type: custom:opening-overview-card
```

### Full options

```yaml
type: custom:opening-card
entity: binary_sensor.front_door
name: Front door
opening_type: entry
lock: lock.front_door
doorbell: event.front_doorbell
battery: sensor.front_door_battery
open_alert: 10
show_history: true
confirm: true
illustration_theme: auto
language: en
```

```yaml
type: custom:opening-card
entity: binary_sensor.bedroom_window
handle: sensor.bedroom_window_handle
climate: climate.bedroom
```

```yaml
type: custom:opening-card
entity: binary_sensor.electrical_panel
power: sensor.house_power
breakers:
  - switch.breaker_1
  - switch.breaker_2
  - switch.breaker_3
```

```yaml
type: custom:opening-overview-card
title: Doors and windows
entities:
  - entity: binary_sensor.front_door
    lock: lock.front_door
  - binary_sensor.kitchen_window
  - entity: binary_sensor.bedroom_window
    handle: sensor.bedroom_window_handle
  - cover.garage_door
include_covers: true
show_journal: true
open_alert: 15
```

### Options reference

| Option | Card | Default | Description |
|---|---|---|---|
| `entity` | card, mini | — | The door or window: a `binary_sensor` (on = open), a `sensor` reporting open / tilted / closed (a window handle), or a `cover` (read only) |
| `name` | card, mini | Friendly name | Name shown in the header |
| `opening_type` | card, mini | Found from the device class and the name | Kind of opening drawn: `entry`, `interior`, `french_single`, `french`, `sliding`, `wicket`, `pet`, `trapdoor`, `window`, `window_double`, `window_tilt`, `window_sliding`, `hopper`, `electrical_panel`, `garage` or `gate` |
| `lock` | all | The lock of the sensor's own device | The opening's lock: its state on a tile, the Lock / Unlock / Open buttons, and its unlocked time on the timeline; `false` turns it off |
| `handle` | all | — | A window handle sensor (open / tilted / closed): a tilted window is drawn and said tilted |
| `doorbell` | card, mini | — | An `event` or `binary_sensor` doorbell: the time of its last ring |
| `battery` | all | The battery of the sensor's own device | A battery sensor (%): red under 20 %, amber under 35 %; `false` hides it |
| `climate` | card, mini | — | The heating of the room: *Paused* (amber) while it is off with the window open |
| `power` | card, mini | — | A power sensor, for an electrical panel (W shown in kW from 1000 W) |
| `breakers` | card, mini | — | **YAML only.** The breakers of an electrical panel (`switch` or `binary_sensor`, on = on): how many are on, and a tripped one lights red in the picture |
| `pet` | card, mini | — | A pet presence (`binary_sensor` on = inside, or `device_tracker`), for a pet flap |
| `open_alert` | all | `10` | Minutes after which an open opening turns into an alert (red, pulsing icon, alert line); `0` turns the alert off |
| `show_history` | card, mini | `true` | Today's timeline (number of openings, total open time, 24-hour bar) |
| `confirm` | card, mini | `true` | Ask in a popup before unlocking or opening (unlatching) the lock; locking never asks |
| `zoom` | mini | `true` | Detail button at the top right of the mini card: it unfolds the full card (with the same options, all of them also in the mini card's editor) and folds it back; a click outside the card folds it too. `false` removes the button |
| `title` | overview, journal | "Openings" | Card title |
| `entities` | overview, journal | Every door, window and opening sensor | The openings shown: entity ids, or objects with `entity` and its own options (`name`, `opening_type`, `lock`, `handle`, `battery`, `open_alert`) — **YAML only** for the objects. Hidden, disabled and diagnostic entities are left out of the automatic list |
| `include_covers` | overview, journal | `true` | With the automatic list, add the garage doors and gates (`cover` of the `garage` and `gate` classes), read only |
| `show_journal` | overview | `true` | The Journal tab, next to the Openings tab |
| `show_title` | all | `true` | Show the title in the header |
| `show_subtitle` | all | `true` | Show the line under the title (how long it has been in its state; the number of openings tracked) |
| `illustration_theme` | all | `auto` | Day or night picture: `auto` (night with a dark Home Assistant theme, day with a light one), `day` or `night` |
| `language` | all | Auto | Force language: `fr`, `en`, `de`, `es`, `sr`, `sr-Latn`, `it`, `nl`, `pt`, `pl`, `ro`, `da`, `sv`, `bg`, `ru`, `uk`, `hu`, `sk`, `cs`, `sl`, `lv` or `el` (auto-detects from Home Assistant) |

## Screenshots

### Opening Card

A front door with its smart lock, its doorbell and its battery: locked, with today's openings and unlocked time on the timeline, and the Unlock and Open buttons:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/card.png" alt="opening card" width="420"> | <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/card-dark.png" alt="opening card, dark" width="420"> |

A patio door open longer than its alert limit: red header and alert line, its lock unlocked, its low battery:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/card-alert.png" alt="opening card with an alert" width="420"> | <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/card-alert-dark.png" alt="opening card with an alert, dark" width="420"> |

A tilt-and-turn window with its handle (tilted) and the radiator it paused:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/card-window.png" alt="opening card of a tilted window" width="420"> | <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/card-window-dark.png" alt="opening card of a tilted window, dark" width="420"> |

The electrical panel with its breakers (one tripped, lit red in the picture) and the house power:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/card-panel.png" alt="opening card of an electrical panel" width="420"> | <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/card-panel-dark.png" alt="opening card of an electrical panel, dark" width="420"> |

A pet flap with its lock and the cat outside:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/card-pet.png" alt="opening card of a pet flap" width="420"> | <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/card-pet-dark.png" alt="opening card of a pet flap, dark" width="420"> |

### Opening Mini Card

The header alone, with the detail button at the top right:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/mini-card.png" alt="opening mini card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/mini-card-dark.png" alt="opening mini card, dark" width="400"> |

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/mini-card-window.png" alt="opening mini card of an open window" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/mini-card-window-dark.png" alt="opening mini card of an open window, dark" width="400"> |

Unfolded with its detail button: the full card, folded back by a click elsewhere:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/mini-card-zoomed.png" alt="opening mini card unfolded" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/mini-card-zoomed-dark.png" alt="opening mini card unfolded, dark" width="400"> |

### Opening Overview Card

Every door and window, alerts first, with the filters; garage doors and gates read only:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/overview.png" alt="opening overview card" width="480"> | <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/overview-dark.png" alt="opening overview card, dark" width="480"> |

The Journal tab: the longest and last opening of the day, one 24-hour bar per opening:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/overview-journal.png" alt="opening overview card, journal tab" width="480"> | <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/overview-journal-dark.png" alt="opening overview card, journal tab, dark" width="480"> |

### Opening Journal Card

The journal as a card of its own:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/journal-card.png" alt="opening journal card" width="480"> | <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/journal-card-dark.png" alt="opening journal card, dark" width="480"> |

### Animations

An open door stirring in the draught, the room lit behind it:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/door-open.gif" alt="door ajar" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/door-open-dark.gif" alt="door ajar, dark" width="400"> |

An alert: the icon pulses and the pill's dot blinks:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/alert.gif" alt="open-too-long alert" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/alert-dark.gif" alt="open-too-long alert, dark" width="400"> |

A tilted window, its sash breathing:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/window-tilt.gif" alt="tilted window" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/window-tilt-dark.gif" alt="tilted window, dark" width="400"> |

A pet flap swinging:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/pet-flap.gif" alt="pet flap" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-opening-card/main/screenshots/pet-flap-dark.gif" alt="pet flap, dark" width="400"> |

## License

MIT — see [LICENSE](LICENSE).
