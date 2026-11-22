// ha-opening-card — Lovelace cards for Home Assistant's doors, windows and electrical panel.
// opening-card (one door or window: animated picture, lock, handle, open-too-long alert, today's timeline),
// opening-mini-card (its illustrated banner, unfolding into the full card), opening-overview-card (every door and
// window as tiles, with filters and a Journal tab) and opening-journal-card (today's timelines of every opening).
// A classic script, bundled as is by scripts/build.mjs.

const VERSION = "__VERSION__";

// ---------------------------------------------------------------------------
// Opening types
// ---------------------------------------------------------------------------

// Drawn and described: the doors and windows this card is about.
const TYPES = [
  "entry",
  "interior",
  "french_single",
  "french",
  "sliding",
  "wicket",
  "pet",
  "trapdoor",
  "window",
  "window_double",
  "window_tilt",
  "window_sliding",
  "hopper",
  "electrical_panel",
];
// Shown read only: a garage door's contact sensor, and the garage doors and gates of the overview (their controls
// live in the cover card).
const EXTRA_TYPES = ["garage", "gate"];
const ALL_TYPES = [...TYPES, ...EXTRA_TYPES];
const WINDOWS = new Set(["window", "window_double", "window_tilt", "window_sliding", "hopper"]);

// Words of an entity's name that tell its kind of opening, in the card's languages where it matters most.
const NAME_RE = {
  panel: /tableau|electrical|breaker|disjonct|fuse ?box|sicherung|verteiler|cuadro el|quadro el|meterkast/i,
  pet: /chati[eè]re|pet ?(door|flap)|cat ?flap|dog ?door|katzenklappe|gatera|gattaiola|kattenluik/i,
  trapdoor: /trapp|hatch|trap ?door|\bcave\b|cellar|keller|s[oó]tano|cantina|attic|grenier|dachboden|zolder/i,
  wicket: /portillon|wicket|garden gate|gartent[üu]r|gartentor|portillo|cancelletto|tuinhek/i,
  french: /porte[- ]?fen[eê]tre|french|balcon|balcony|balkon|terrassent[üu]r|puerta ?ventana|portafinestra/i,
  sliding: /coulissant|baie|sliding|patio|schiebe|corredera|scorrevole|schuif/i,
  double: /double|2 vantaux|deux vantaux|two[- ]?leaf|zweifl[üu]gel|doble|doppi/i,
  tilt: /oscillo|tilt|kipp|abatible|anta ribalta|draaikiep/i,
  hopper: /soufflet|vasistas|hopper|oberlicht|wasistas|bovenlicht/i,
  window: /fen[eê]tre|window|fenster|ventana|finestra|raam|okno|janela|ablak/i,
  interior:
    /chambre|bedroom|bureau|office|bain|bath|toilet|\bwc\b|cuisine|kitchen|salon|living|placard|closet|cellier|buanderie|laundry|dressing|schlafzimmer|b[üu]ro|badezimmer|k[üu]che|dormitorio|ba[ñn]o|cocina|camera da letto|slaapkamer/i,
};

// The opening type of an entity: the card's own option, else its domain and device class, then its name.
const typeOf = (id, s, override) => {
  if (ALL_TYPES.includes(override)) return override;
  const domain = String(id).split(".")[0];
  const dc = s?.attributes?.device_class;
  const name = `${s?.attributes?.friendly_name || ""} ${id}`;
  if (domain === "cover") return dc === "gate" ? "gate" : dc === "window" ? "window" : dc === "door" ? "entry" : "garage";
  if (dc === "garage_door") return "garage";
  // A sensor (not on / off) is a window handle: open, tilted or closed.
  if (domain === "sensor") return "window_tilt";
  if (NAME_RE.panel.test(name)) return "electrical_panel";
  if (NAME_RE.pet.test(name)) return "pet";
  if (NAME_RE.trapdoor.test(name)) return "trapdoor";
  if (NAME_RE.wicket.test(name)) return "wicket";
  if (NAME_RE.french.test(name)) return NAME_RE.double.test(name) ? "french" : "french_single";
  if (dc === "window" || NAME_RE.window.test(name)) {
    if (NAME_RE.tilt.test(name)) return "window_tilt";
    if (NAME_RE.hopper.test(name)) return "hopper";
    if (NAME_RE.sliding.test(name)) return "window_sliding";
    return NAME_RE.double.test(name) ? "window_double" : "window";
  }
  if (NAME_RE.sliding.test(name)) return "sliding";
  return NAME_RE.interior.test(name) || dc === "opening" ? "interior" : "entry";
};

// ---------------------------------------------------------------------------
// Icons (Material Design Icons paths)
// ---------------------------------------------------------------------------

const ICONS = {
  door: "M8,3C6.89,3 6,3.89 6,5V21H18V5C18,3.89 17.11,3 16,3H8M8,5H16V19H8V5M13,11V13H15V11H13Z",
  door_open: "M12,3C10.89,3 10,3.89 10,5H3V19H2V21H22V19H21V5C21,3.89 20.11,3 19,3H12M12,5H19V19H12V5M5,11H7V13H5V11Z",
  window: "M21 20V2H3V20H1V23H23V20M19 4V11H13V4M5 4H11V11H5M5 20V13H11V20M13 20V13H19V20Z",
  window_open: "M21 20V2H3V20H1V23H23V20M19 4V11H17V4M5 4H7V11H5M5 20V13H7V20M9 20V4H15V20M17 20V13H19V20Z",
  sliding: "M10 13H8V11H10V13M16 11H14V13H16V11M21 19V21H3V19H4V5C4 3.9 4.9 3 6 3H18C19.1 3 20 3.9 20 5V19H21M11 5H6V19H11V5M18 5H13V19H18V5Z",
  lock: "M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z",
  unlock:
    "M18 1C15.24 1 13 3.24 13 6V8H4C2.9 8 2 8.89 2 10V20C2 21.11 2.9 22 4 22H16C17.11 22 18 21.11 18 20V10C18 8.9 17.11 8 16 8H15V6C15 4.34 16.34 3 18 3C19.66 3 21 4.34 21 6V8H23V6C23 3.24 20.76 1 18 1M10 13C11.1 13 12 13.89 12 15C12 16.11 11.11 17 10 17C8.9 17 8 16.11 8 15C8 13.9 8.9 13 10 13Z",
  jammed:
    "M10 17C11.1 17 12 16.1 12 15C12 13.9 11.1 13 10 13C8.9 13 8 13.9 8 15S8.9 17 10 17M16 8C17.1 8 18 8.9 18 10V20C18 21.1 17.1 22 16 22H4C2.9 22 2 21.1 2 20V10C2 8.9 2.9 8 4 8H5V6C5 3.2 7.2 1 10 1S15 3.2 15 6V8H16M10 3C8.3 3 7 4.3 7 6V8H13V6C13 4.3 11.7 3 10 3M22 13H20V7H22V13M22 17H20V15H22V17Z",
  bell: "M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21",
  battery:
    "M16 20H8V6H16M16.67 4H15V2H9V4H7.33C6.6 4 6 4.6 6 5.33V20.67C6 21.4 6.6 22 7.33 22H16.67C17.41 22 18 21.41 18 20.67V5.33C18 4.6 17.4 4 16.67 4M15 16H9V19H15V16M15 7H9V10H15V7M15 11.5H9V14.5H15V11.5Z",
  heating:
    "M7.95,3L6.53,5.19L7.95,7.4H7.94L5.95,10.5L4.22,9.6L5.64,7.39L4.22,5.19L6.22,2.09L7.95,3M13.95,2.89L12.53,5.1L13.95,7.3L13.94,7.31L11.95,10.4L10.22,9.5L11.64,7.3L10.22,5.1L12.22,2L13.95,2.89M20,2.89L18.56,5.1L20,7.3V7.31L18,10.4L16.25,9.5L17.67,7.3L16.25,5.1L18.25,2L20,2.89M2,22V14A2,2 0 0,1 4,12H20A2,2 0 0,1 22,14V22H20V20H4V22H2M6,14A1,1 0 0,0 5,15V17A1,1 0 0,0 6,18A1,1 0 0,0 7,17V15A1,1 0 0,0 6,14M10,14A1,1 0 0,0 9,15V17A1,1 0 0,0 10,18A1,1 0 0,0 11,17V15A1,1 0 0,0 10,14M14,14A1,1 0 0,0 13,15V17A1,1 0 0,0 14,18A1,1 0 0,0 15,17V15A1,1 0 0,0 14,14M18,14A1,1 0 0,0 17,15V17A1,1 0 0,0 18,18A1,1 0 0,0 19,17V15A1,1 0 0,0 18,14Z",
  power: "M7,2V13H10V22L17,10H13L17,2H7Z",
  breakers:
    "M1,11H3.17C3.58,9.83 4.69,9 6,9C6.65,9 7.25,9.21 7.74,9.56L14.44,4.87L15.58,6.5L8.89,11.2C8.96,11.45 9,11.72 9,12A3,3 0 0,1 6,15C4.69,15 3.58,14.17 3.17,13H1V11M23,11V13H20.83C20.42,14.17 19.31,15 18,15A3,3 0 0,1 15,12A3,3 0 0,1 18,9C19.31,9 20.42,9.83 20.83,11H23M6,11A1,1 0 0,0 5,12A1,1 0 0,0 6,13A1,1 0 0,0 7,12A1,1 0 0,0 6,11M18,11A1,1 0 0,0 17,12A1,1 0 0,0 18,13A1,1 0 0,0 19,12A1,1 0 0,0 18,11Z",
  panel: "M8,7V17H15V7H8M11.16,16V12.87H9.41L11.91,8V11.14H13.59L11.16,16M16,2V6H7V2A1,1 0 0,1 8,1H15A1,1 0 0,1 16,2M16,18V22A1,1 0 0,1 15,23H8A1,1 0 0,1 7,22V18H16Z",
  pet: "M8.35,3C9.53,2.83 10.78,4.12 11.14,5.9C11.5,7.67 10.85,9.25 9.67,9.43C8.5,9.61 7.24,8.32 6.87,6.54C6.5,4.77 7.17,3.19 8.35,3M15.5,3C16.69,3.19 17.35,4.77 17,6.54C16.62,8.32 15.37,9.61 14.19,9.43C13,9.25 12.35,7.67 12.72,5.9C13.08,4.12 14.33,2.83 15.5,3M3,7.6C4.14,7.11 5.69,8 6.5,9.55C7.26,11.13 7,12.79 5.87,13.28C4.74,13.77 3.2,12.89 2.41,11.32C1.62,9.75 1.9,8.08 3,7.6M21,7.6C22.1,8.08 22.38,9.75 21.59,11.32C20.8,12.89 19.26,13.77 18.13,13.28C17,12.79 16.74,11.13 17.5,9.55C18.31,8 19.86,7.11 21,7.6M19.33,18.38C19.37,19.32 18.65,20.36 17.79,20.75C16,21.57 13.88,19.87 11.89,19.87C9.9,19.87 7.76,21.64 6,20.75C5,20.26 4.31,18.96 4.44,17.88C4.62,16.39 6.41,15.59 7.47,14.5C8.88,13.09 9.88,10.44 11.89,10.44C13.89,10.44 14.95,13.05 16.3,14.5C17.41,15.72 19.26,16.75 19.33,18.38Z",
  history:
    "M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3",
  timer:
    "M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M11,14H13V8H11M15,1H9V3H15V1Z",
  alert: "M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z",
  garage: "M19,20H17V11H7V20H5V9L12,5L19,9V20M8,12H16V14H8V12M8,15H16V17H8V15M16,18V20H8V18H16Z",
  gate: "M9 6V11H7V7H5V11H3V9H1V21H3V19H5V21H7V19H9V21H11V19H13V21H15V19H17V21H19V19H21V21H23V9H21V11H19V7H17V11H15V6H13V11H11V6H9M3 13H5V17H3V13M7 13H9V17H7V13M11 13H13V17H11V13M15 13H17V17H15V13M19 13H21V17H19V13Z",
  home_lock: "M12,3L2,12H5V20H19V12H22L12,3M12,9A3,3 0 0,1 15,12V13H16V17H8V13H9V12A3,3 0 0,1 12,9M12,11A1,1 0 0,0 11,12V13H13V12C13,11.5 12.6,11 12,11Z",
  expand: "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  collapse: "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
};

// The header icon of an opening type, closed and open.
const typeIcon = (type, open) => {
  if (type === "electrical_panel") return ICONS.panel;
  if (type === "pet") return ICONS.pet;
  if (type === "garage") return ICONS.garage;
  if (type === "gate" || type === "wicket") return ICONS.gate;
  if (type === "sliding" || type === "window_sliding") return ICONS.sliding;
  if (WINDOWS.has(type) || type === "french" || type === "french_single") return open ? ICONS.window_open : ICONS.window;
  return open ? ICONS.door_open : ICONS.door;
};

const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;

// ---------------------------------------------------------------------------
// Strings
// ---------------------------------------------------------------------------

const STRINGS = {
  en: {
    openings: "Openings",
    journal: "Journal",
    tabs: "Views",
    s_open: "Open",
    s_tilted: "Tilted",
    s_closed: "Closed",
    s_locked: "Locked",
    s_unlocked: "Unlocked",
    s_jammed: "Jammed",
    s_unavailable: "Unavailable",
    s_unknown: "Unknown",
    state_for: "{state} for {d}",
    state_now: "{state} just now",
    alert: "{state} for {d}, over the {limit} limit",
    dur_m: "{m} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m} min",
    dur_d: "{d} d",
    n_open: "{n} open",
    n_alerts: "{n} alerts",
    one_alert: "1 alert",
    all_closed: "All closed",
    n_tracked: "{n} tracked",
    k_contact: "Contact",
    k_handle: "Handle",
    k_lock: "Lock",
    k_doorbell: "Doorbell",
    k_battery: "Battery",
    k_heating: "Heating",
    k_power: "Power",
    k_breakers: "Breakers",
    k_pet: "Pet",
    v_off: "Off",
    v_on: "On",
    v_paused: "Paused",
    v_inside: "Inside",
    v_outside: "Outside",
    v_armed: "{on}/{n} on",
    v_tripped: "{n} tripped",
    today: "Today",
    n_openings: "{n} openings · {d} in total",
    one_opening: "1 opening · {d} in total",
    no_opening: "No opening today",
    longest: "Longest opening",
    last: "Last opening",
    ago: "{d} ago",
    lock: "Lock",
    unlock: "Unlock",
    unlatch: "Open",
    history: "History",
    cancel: "Cancel",
    confirm_unlock: "Unlock {name}?",
    confirm_unlatch: "Open {name}?",
    f_all: "All",
    f_open: "Open",
    f_unlocked: "Unlocked",
    f_alert: "Alerts",
    read_only: "read only",
    nothing: "Nothing to report",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    not_found: "Entity not found: {entity}",
    no_entity: "Choose a door or window sensor.",
    none_found: "No door or window found.",
    y_entry: "Front door",
    y_interior: "Interior door",
    y_french_single: "French door",
    y_french: "Double French door",
    y_sliding: "Sliding patio door",
    y_wicket: "Wicket gate",
    y_pet: "Pet flap",
    y_trapdoor: "Trapdoor",
    y_window: "Window",
    y_window_double: "Double window",
    y_window_tilt: "Tilt-and-turn window",
    y_window_sliding: "Sliding window",
    y_hopper: "Hopper window",
    y_electrical_panel: "Electrical panel",
    y_garage: "Garage door",
    y_gate: "Gate",
    e_entity: "Door or window sensor",
    e_entities: "Doors and windows",
    e_name: "Name (optional)",
    e_title: "Title (optional)",
    e_opening_type: "Opening type",
    type_auto: "Automatic (device class and name)",
    e_lock: "Lock",
    e_doorbell: "Doorbell",
    e_battery: "Battery",
    e_handle: "Window handle",
    e_climate: "Heating",
    e_power: "Power",
    e_pet: "Pet presence",
    e_open_alert: "Alert after (min)",
    e_show_history: "Show today's timeline",
    e_confirm: "Ask before unlocking",
    e_zoom: "Detail button",
    e_include_covers: "Garage doors and gates (read only)",
    e_show_journal: "Journal tab",
    e_illustration_theme: "Illustration theme",
    theme_auto: "Automatic: night with a dark theme, day with a light theme",
    theme_day: "Day",
    theme_night: "Night",
    e_language: "Language",
    lang_auto: "Automatic",
    h_entities: "Empty: every door, window and opening sensor",
    h_open_alert: "Open longer than this turns red; 0 turns the alert off",
    h_battery: "Empty: the battery of the sensor's own device",
    h_handle: "A sensor reporting open, tilted or closed",
    h_zoom: "Button at the top right that switches the mini card to the full card and back",
    h_include_covers: "Covers of the garage and gate classes, drawn without their controls",
  },
  fr: {
    openings: "Ouvertures",
    journal: "Journal",
    tabs: "Vues",
    s_open: "Ouvert",
    s_tilted: "Basculé",
    s_closed: "Fermé",
    s_locked: "Verrouillé",
    s_unlocked: "Déverrouillé",
    s_jammed: "Bloqué",
    s_unavailable: "Indisponible",
    s_unknown: "Inconnu",
    state_for: "{state} depuis {d}",
    state_now: "{state} à l'instant",
    alert: "{state} depuis {d}, au-delà de la limite de {limit}",
    dur_m: "{m} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m} min",
    dur_d: "{d} j",
    n_open: "Ouverts : {n}",
    n_alerts: "{n} alertes",
    one_alert: "1 alerte",
    all_closed: "Tout est fermé",
    n_tracked: "{n} suivis",
    k_contact: "Contact",
    k_handle: "Poignée",
    k_lock: "Serrure",
    k_doorbell: "Sonnette",
    k_battery: "Batterie",
    k_heating: "Chauffage",
    k_power: "Puissance",
    k_breakers: "Disjoncteurs",
    k_pet: "Animal",
    v_off: "Arrêt",
    v_on: "Marche",
    v_paused: "En pause",
    v_inside: "Dedans",
    v_outside: "Dehors",
    v_armed: "{on}/{n} armés",
    v_tripped: "{n} déclenché(s)",
    today: "Aujourd'hui",
    n_openings: "{n} ouvertures · {d} au total",
    one_opening: "1 ouverture · {d} au total",
    no_opening: "Aucune ouverture aujourd'hui",
    longest: "Ouverture la plus longue",
    last: "Dernière ouverture",
    ago: "il y a {d}",
    lock: "Verrouiller",
    unlock: "Déverrouiller",
    unlatch: "Ouvrir",
    history: "Historique",
    cancel: "Annuler",
    confirm_unlock: "Déverrouiller {name} ?",
    confirm_unlatch: "Ouvrir {name} ?",
    f_all: "Toutes",
    f_open: "Ouvertes",
    f_unlocked: "Déverrouillées",
    f_alert: "Alertes",
    read_only: "lecture seule",
    nothing: "Rien à signaler",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    not_found: "Entité introuvable : {entity}",
    no_entity: "Choisissez un capteur de porte ou de fenêtre.",
    none_found: "Aucune porte ni fenêtre trouvée.",
    y_entry: "Porte d'entrée",
    y_interior: "Porte intérieure",
    y_french_single: "Porte-fenêtre",
    y_french: "Porte-fenêtre 2 vantaux",
    y_sliding: "Baie coulissante",
    y_wicket: "Portillon",
    y_pet: "Chatière",
    y_trapdoor: "Trappe",
    y_window: "Fenêtre",
    y_window_double: "Fenêtre 2 vantaux",
    y_window_tilt: "Fenêtre oscillo-battante",
    y_window_sliding: "Fenêtre coulissante",
    y_hopper: "Soufflet",
    y_electrical_panel: "Tableau électrique",
    y_garage: "Porte de garage",
    y_gate: "Portail",
    e_entity: "Capteur de porte ou de fenêtre",
    e_entities: "Portes et fenêtres",
    e_name: "Nom (facultatif)",
    e_title: "Titre (facultatif)",
    e_opening_type: "Type d'ouverture",
    type_auto: "Automatique (classe et nom)",
    e_lock: "Serrure",
    e_doorbell: "Sonnette",
    e_battery: "Batterie",
    e_handle: "Poignée de fenêtre",
    e_climate: "Chauffage",
    e_power: "Puissance",
    e_pet: "Présence de l'animal",
    e_open_alert: "Alerte après (min)",
    e_show_history: "Afficher la frise du jour",
    e_confirm: "Demander avant de déverrouiller",
    e_zoom: "Bouton détail",
    e_include_covers: "Portes de garage et portails (lecture seule)",
    e_show_journal: "Onglet Journal",
    e_illustration_theme: "Thème de l'illustration",
    theme_auto: "Automatique : nuit avec un thème sombre, jour avec un thème clair",
    theme_day: "Jour",
    theme_night: "Nuit",
    e_language: "Langue",
    lang_auto: "Automatique",
    h_entities: "Vide : tous les capteurs de porte, de fenêtre et d'ouverture",
    h_open_alert: "Ouvert plus longtemps : passe au rouge ; 0 désactive l'alerte",
    h_battery: "Vide : la batterie de l'appareil du capteur",
    h_handle: "Un capteur indiquant ouvert, basculé ou fermé",
    h_zoom: "Bouton en haut à droite qui passe de la mini-carte à la carte complète et inversement",
    h_include_covers: "Volets de classe garage et portail, dessinés sans leurs commandes",
  },
  de: {
    openings: "Öffnungen",
    journal: "Verlauf",
    tabs: "Ansichten",
    s_open: "Offen",
    s_tilted: "Gekippt",
    s_closed: "Geschlossen",
    s_locked: "Verriegelt",
    s_unlocked: "Entriegelt",
    s_jammed: "Blockiert",
    s_unavailable: "Nicht verfügbar",
    s_unknown: "Unbekannt",
    state_for: "{state} seit {d}",
    state_now: "{state} seit gerade eben",
    alert: "{state} seit {d}, über dem Limit von {limit}",
    dur_m: "{m} Min.",
    dur_h: "{h} Std.",
    dur_hm: "{h} Std. {m} Min.",
    dur_d: "{d} T.",
    n_open: "{n} offen",
    n_alerts: "{n} Warnungen",
    one_alert: "1 Warnung",
    all_closed: "Alles geschlossen",
    n_tracked: "{n} überwacht",
    k_contact: "Kontakt",
    k_handle: "Griff",
    k_lock: "Schloss",
    k_doorbell: "Klingel",
    k_battery: "Batterie",
    k_heating: "Heizung",
    k_power: "Leistung",
    k_breakers: "Sicherungen",
    k_pet: "Haustier",
    v_off: "Aus",
    v_on: "An",
    v_paused: "Pausiert",
    v_inside: "Drinnen",
    v_outside: "Draußen",
    v_armed: "{on}/{n} an",
    v_tripped: "{n} ausgelöst",
    today: "Heute",
    n_openings: "{n} Öffnungen · {d} insgesamt",
    one_opening: "1 Öffnung · {d} insgesamt",
    no_opening: "Heute keine Öffnung",
    longest: "Längste Öffnung",
    last: "Letzte Öffnung",
    ago: "vor {d}",
    lock: "Verriegeln",
    unlock: "Entriegeln",
    unlatch: "Öffnen",
    history: "Verlauf",
    cancel: "Abbrechen",
    confirm_unlock: "{name} entriegeln?",
    confirm_unlatch: "{name} öffnen?",
    f_all: "Alle",
    f_open: "Offen",
    f_unlocked: "Entriegelt",
    f_alert: "Warnungen",
    read_only: "nur Anzeige",
    nothing: "Nichts zu melden",
    zoom_in: "Ganze Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    not_found: "Entität nicht gefunden: {entity}",
    no_entity: "Wähle einen Tür- oder Fenstersensor.",
    none_found: "Keine Tür und kein Fenster gefunden.",
    y_entry: "Haustür",
    y_interior: "Innentür",
    y_french_single: "Balkontür",
    y_french: "Zweiflügelige Balkontür",
    y_sliding: "Schiebetür",
    y_wicket: "Gartentür",
    y_pet: "Katzenklappe",
    y_trapdoor: "Falltür",
    y_window: "Fenster",
    y_window_double: "Zweiflügeliges Fenster",
    y_window_tilt: "Dreh-Kipp-Fenster",
    y_window_sliding: "Schiebefenster",
    y_hopper: "Kippfenster",
    y_electrical_panel: "Sicherungskasten",
    y_garage: "Garagentor",
    y_gate: "Tor",
    e_entity: "Tür- oder Fenstersensor",
    e_entities: "Türen und Fenster",
    e_name: "Name (optional)",
    e_title: "Titel (optional)",
    e_opening_type: "Art der Öffnung",
    type_auto: "Automatisch (Geräteklasse und Name)",
    e_lock: "Schloss",
    e_doorbell: "Klingel",
    e_battery: "Batterie",
    e_handle: "Fenstergriff",
    e_climate: "Heizung",
    e_power: "Leistung",
    e_pet: "Anwesenheit des Haustiers",
    e_open_alert: "Warnung nach (Min.)",
    e_show_history: "Tagesverlauf anzeigen",
    e_confirm: "Vor dem Entriegeln fragen",
    e_zoom: "Detail-Schaltfläche",
    e_include_covers: "Garagentore und Tore (nur Anzeige)",
    e_show_journal: "Reiter Verlauf",
    e_illustration_theme: "Thema der Illustration",
    theme_auto: "Automatisch: Nacht mit dunklem Thema, Tag mit hellem Thema",
    theme_day: "Tag",
    theme_night: "Nacht",
    e_language: "Sprache",
    lang_auto: "Automatisch",
    h_entities: "Leer: alle Tür-, Fenster- und Öffnungssensoren",
    h_open_alert: "Länger offen wird rot; 0 schaltet die Warnung ab",
    h_battery: "Leer: die Batterie des Sensorgeräts selbst",
    h_handle: "Ein Sensor, der offen, gekippt oder geschlossen meldet",
    h_zoom: "Schaltfläche oben rechts, die von der Mini-Karte zur ganzen Karte und zurück wechselt",
    h_include_covers: "Abdeckungen der Klassen Garage und Tor, ohne ihre Steuerung gezeichnet",
  },
  es: {
    openings: "Aberturas",
    journal: "Registro",
    tabs: "Vistas",
    s_open: "Abierto",
    s_tilted: "Abatido",
    s_closed: "Cerrado",
    s_locked: "Con llave",
    s_unlocked: "Sin llave",
    s_jammed: "Atascado",
    s_unavailable: "No disponible",
    s_unknown: "Desconocido",
    state_for: "{state} desde hace {d}",
    state_now: "{state} ahora mismo",
    alert: "{state} desde hace {d}, por encima del límite de {limit}",
    dur_m: "{m} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m} min",
    dur_d: "{d} d",
    n_open: "Abiertos: {n}",
    n_alerts: "{n} alertas",
    one_alert: "1 alerta",
    all_closed: "Todo cerrado",
    n_tracked: "{n} vigilados",
    k_contact: "Contacto",
    k_handle: "Manilla",
    k_lock: "Cerradura",
    k_doorbell: "Timbre",
    k_battery: "Batería",
    k_heating: "Calefacción",
    k_power: "Potencia",
    k_breakers: "Interruptores",
    k_pet: "Mascota",
    v_off: "Apagada",
    v_on: "Encendida",
    v_paused: "En pausa",
    v_inside: "Dentro",
    v_outside: "Fuera",
    v_armed: "{on}/{n} activos",
    v_tripped: "{n} saltado(s)",
    today: "Hoy",
    n_openings: "{n} aperturas · {d} en total",
    one_opening: "1 apertura · {d} en total",
    no_opening: "Ninguna apertura hoy",
    longest: "Apertura más larga",
    last: "Última apertura",
    ago: "hace {d}",
    lock: "Cerrar con llave",
    unlock: "Quitar llave",
    unlatch: "Abrir",
    history: "Historial",
    cancel: "Cancelar",
    confirm_unlock: "¿Quitar la llave de {name}?",
    confirm_unlatch: "¿Abrir {name}?",
    f_all: "Todas",
    f_open: "Abiertas",
    f_unlocked: "Sin llave",
    f_alert: "Alertas",
    read_only: "solo lectura",
    nothing: "Nada que señalar",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    not_found: "Entidad no encontrada: {entity}",
    no_entity: "Elige un sensor de puerta o ventana.",
    none_found: "No se ha encontrado ninguna puerta ni ventana.",
    y_entry: "Puerta de entrada",
    y_interior: "Puerta interior",
    y_french_single: "Puerta ventana",
    y_french: "Puerta ventana de dos hojas",
    y_sliding: "Puerta corredera",
    y_wicket: "Portillo",
    y_pet: "Gatera",
    y_trapdoor: "Trampilla",
    y_window: "Ventana",
    y_window_double: "Ventana de dos hojas",
    y_window_tilt: "Ventana oscilobatiente",
    y_window_sliding: "Ventana corredera",
    y_hopper: "Ventana abatible",
    y_electrical_panel: "Cuadro eléctrico",
    y_garage: "Puerta de garaje",
    y_gate: "Portón",
    e_entity: "Sensor de puerta o ventana",
    e_entities: "Puertas y ventanas",
    e_name: "Nombre (opcional)",
    e_title: "Título (opcional)",
    e_opening_type: "Tipo de abertura",
    type_auto: "Automático (clase y nombre)",
    e_lock: "Cerradura",
    e_doorbell: "Timbre",
    e_battery: "Batería",
    e_handle: "Manilla de ventana",
    e_climate: "Calefacción",
    e_power: "Potencia",
    e_pet: "Presencia de la mascota",
    e_open_alert: "Alerta tras (min)",
    e_show_history: "Mostrar la línea de tiempo de hoy",
    e_confirm: "Preguntar antes de quitar la llave",
    e_zoom: "Botón de detalle",
    e_include_covers: "Puertas de garaje y portones (solo lectura)",
    e_show_journal: "Pestaña Registro",
    e_illustration_theme: "Tema de la ilustración",
    theme_auto: "Automático: noche con un tema oscuro, día con un tema claro",
    theme_day: "Día",
    theme_night: "Noche",
    e_language: "Idioma",
    lang_auto: "Automático",
    h_entities: "Vacío: todos los sensores de puerta, ventana y abertura",
    h_open_alert: "Abierto más tiempo se vuelve rojo; 0 desactiva la alerta",
    h_battery: "Vacío: la batería del propio dispositivo del sensor",
    h_handle: "Un sensor que indica abierto, abatido o cerrado",
    h_zoom: "Botón arriba a la derecha que pasa de la mini tarjeta a la tarjeta completa y viceversa",
    h_include_covers: "Cubiertas de las clases garaje y portón, dibujadas sin sus mandos",
  },
  sr: {
    openings: "Отвори",
    journal: "Дневник",
    tabs: "Прикази",
    s_open: "Отворено",
    s_tilted: "На кип",
    s_closed: "Затворено",
    s_locked: "Закључано",
    s_unlocked: "Откључано",
    s_jammed: "Заглављено",
    s_unavailable: "Недоступно",
    s_unknown: "Непознато",
    state_for: "{state} већ {d}",
    state_now: "{state} управо сада",
    alert: "{state} већ {d}, преко границе од {limit}",
    dur_m: "{m} мин",
    dur_h: "{h} х",
    dur_hm: "{h} х {m} мин",
    dur_d: "{d} д",
    n_open: "Отворено: {n}",
    n_alerts: "Упозорења: {n}",
    one_alert: "1 упозорење",
    all_closed: "Све затворено",
    n_tracked: "Праћено: {n}",
    k_contact: "Контакт",
    k_handle: "Ручка",
    k_lock: "Брава",
    k_doorbell: "Звоно",
    k_battery: "Батерија",
    k_heating: "Грејање",
    k_power: "Снага",
    k_breakers: "Осигурачи",
    k_pet: "Љубимац",
    v_off: "Искљ.",
    v_on: "Укљ.",
    v_paused: "Паузирано",
    v_inside: "Унутра",
    v_outside: "Напољу",
    v_armed: "{on}/{n} укљ.",
    v_tripped: "Искључено: {n}",
    today: "Данас",
    n_openings: "Отварања: {n} · укупно {d}",
    one_opening: "1 отварање · укупно {d}",
    no_opening: "Данас без отварања",
    longest: "Најдуже отварање",
    last: "Последње отварање",
    ago: "пре {d}",
    lock: "Закључај",
    unlock: "Откључај",
    unlatch: "Отвори",
    history: "Историја",
    cancel: "Откажи",
    confirm_unlock: "Откључати {name}?",
    confirm_unlatch: "Отворити {name}?",
    f_all: "Све",
    f_open: "Отворене",
    f_unlocked: "Откључане",
    f_alert: "Упозорења",
    read_only: "само читање",
    nothing: "Ништа за пријаву",
    zoom_in: "Прикажи целу картицу",
    zoom_out: "Назад на сажети приказ",
    not_found: "Ентитет није пронађен: {entity}",
    no_entity: "Изаберите сензор врата или прозора.",
    none_found: "Нису пронађена врата ни прозори.",
    y_entry: "Улазна врата",
    y_interior: "Унутрашња врата",
    y_french_single: "Балконска врата",
    y_french: "Двокрилна балконска врата",
    y_sliding: "Клизна врата",
    y_wicket: "Капија за пешаке",
    y_pet: "Вратанца за мачке",
    y_trapdoor: "Поклопац",
    y_window: "Прозор",
    y_window_double: "Двокрилни прозор",
    y_window_tilt: "Прозор на кип",
    y_window_sliding: "Клизни прозор",
    y_hopper: "Нагибни прозор",
    y_electrical_panel: "Електрични ормар",
    y_garage: "Гаражна врата",
    y_gate: "Капија",
    e_entity: "Сензор врата или прозора",
    e_entities: "Врата и прозори",
    e_name: "Назив (опционо)",
    e_title: "Наслов (опционо)",
    e_opening_type: "Врста отвора",
    type_auto: "Аутоматски (класа и назив)",
    e_lock: "Брава",
    e_doorbell: "Звоно",
    e_battery: "Батерија",
    e_handle: "Ручка прозора",
    e_climate: "Грејање",
    e_power: "Снага",
    e_pet: "Присуство љубимца",
    e_open_alert: "Упозорење после (мин)",
    e_show_history: "Прикажи данашњу временску линију",
    e_confirm: "Питај пре откључавања",
    e_zoom: "Дугме за детаље",
    e_include_covers: "Гаражна врата и капије (само читање)",
    e_show_journal: "Картица Дневник",
    e_illustration_theme: "Тема илустрације",
    theme_auto: "Аутоматски: ноћ уз тамну тему, дан уз светлу",
    theme_day: "Дан",
    theme_night: "Ноћ",
    e_language: "Језик",
    lang_auto: "Аутоматски",
    h_entities: "Празно: сви сензори врата, прозора и отварања",
    h_open_alert: "Дуже отворено постаје црвено; 0 искључује упозорење",
    h_battery: "Празно: батерија уређаја самог сензора",
    h_handle: "Сензор који јавља отворено, на кип или затворено",
    h_zoom: "Дугме горе десно које прелази са мини картице на целу и назад",
    h_include_covers: "Застори класа гаража и капија, нацртани без команди",
  },
  "sr-Latn": {
    openings: "Otvori",
    journal: "Dnevnik",
    tabs: "Prikazi",
    s_open: "Otvoreno",
    s_tilted: "Na kip",
    s_closed: "Zatvoreno",
    s_locked: "Zaključano",
    s_unlocked: "Otključano",
    s_jammed: "Zaglavljeno",
    s_unavailable: "Nedostupno",
    s_unknown: "Nepoznato",
    state_for: "{state} već {d}",
    state_now: "{state} upravo sada",
    alert: "{state} već {d}, preko granice od {limit}",
    dur_m: "{m} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m} min",
    dur_d: "{d} d",
    n_open: "Otvoreno: {n}",
    n_alerts: "Upozorenja: {n}",
    one_alert: "1 upozorenje",
    all_closed: "Sve zatvoreno",
    n_tracked: "Praćeno: {n}",
    k_contact: "Kontakt",
    k_handle: "Ručka",
    k_lock: "Brava",
    k_doorbell: "Zvono",
    k_battery: "Baterija",
    k_heating: "Grejanje",
    k_power: "Snaga",
    k_breakers: "Osigurači",
    k_pet: "Ljubimac",
    v_off: "Isklj.",
    v_on: "Uklj.",
    v_paused: "Pauzirano",
    v_inside: "Unutra",
    v_outside: "Napolju",
    v_armed: "{on}/{n} uklj.",
    v_tripped: "Isključeno: {n}",
    today: "Danas",
    n_openings: "Otvaranja: {n} · ukupno {d}",
    one_opening: "1 otvaranje · ukupno {d}",
    no_opening: "Danas bez otvaranja",
    longest: "Najduže otvaranje",
    last: "Poslednje otvaranje",
    ago: "pre {d}",
    lock: "Zaključaj",
    unlock: "Otključaj",
    unlatch: "Otvori",
    history: "Istorija",
    cancel: "Otkaži",
    confirm_unlock: "Otključati {name}?",
    confirm_unlatch: "Otvoriti {name}?",
    f_all: "Sve",
    f_open: "Otvorene",
    f_unlocked: "Otključane",
    f_alert: "Upozorenja",
    read_only: "samo čitanje",
    nothing: "Ništa za prijavu",
    zoom_in: "Prikaži celu karticu",
    zoom_out: "Nazad na sažeti prikaz",
    not_found: "Entitet nije pronađen: {entity}",
    no_entity: "Izaberite senzor vrata ili prozora.",
    none_found: "Nisu pronađena vrata ni prozori.",
    y_entry: "Ulazna vrata",
    y_interior: "Unutrašnja vrata",
    y_french_single: "Balkonska vrata",
    y_french: "Dvokrilna balkonska vrata",
    y_sliding: "Klizna vrata",
    y_wicket: "Kapija za pešake",
    y_pet: "Vratanca za mačke",
    y_trapdoor: "Poklopac",
    y_window: "Prozor",
    y_window_double: "Dvokrilni prozor",
    y_window_tilt: "Prozor na kip",
    y_window_sliding: "Klizni prozor",
    y_hopper: "Nagibni prozor",
    y_electrical_panel: "Električni ormar",
    y_garage: "Garažna vrata",
    y_gate: "Kapija",
    e_entity: "Senzor vrata ili prozora",
    e_entities: "Vrata i prozori",
    e_name: "Naziv (opciono)",
    e_title: "Naslov (opciono)",
    e_opening_type: "Vrsta otvora",
    type_auto: "Automatski (klasa i naziv)",
    e_lock: "Brava",
    e_doorbell: "Zvono",
    e_battery: "Baterija",
    e_handle: "Ručka prozora",
    e_climate: "Grejanje",
    e_power: "Snaga",
    e_pet: "Prisustvo ljubimca",
    e_open_alert: "Upozorenje posle (min)",
    e_show_history: "Prikaži današnju vremensku liniju",
    e_confirm: "Pitaj pre otključavanja",
    e_zoom: "Dugme za detalje",
    e_include_covers: "Garažna vrata i kapije (samo čitanje)",
    e_show_journal: "Kartica Dnevnik",
    e_illustration_theme: "Tema ilustracije",
    theme_auto: "Automatski: noć uz tamnu temu, dan uz svetlu",
    theme_day: "Dan",
    theme_night: "Noć",
    e_language: "Jezik",
    lang_auto: "Automatski",
    h_entities: "Prazno: svi senzori vrata, prozora i otvaranja",
    h_open_alert: "Duže otvoreno postaje crveno; 0 isključuje upozorenje",
    h_battery: "Prazno: baterija uređaja samog senzora",
    h_handle: "Senzor koji javlja otvoreno, na kip ili zatvoreno",
    h_zoom: "Dugme gore desno koje prelazi sa mini kartice na celu i nazad",
    h_include_covers: "Zastori klasa garaža i kapija, nacrtani bez komandi",
  },
  it: {
    openings: "Aperture",
    journal: "Diario",
    tabs: "Viste",
    s_open: "Aperto",
    s_tilted: "A ribalta",
    s_closed: "Chiuso",
    s_locked: "Bloccato",
    s_unlocked: "Sbloccato",
    s_jammed: "Inceppato",
    s_unavailable: "Non disponibile",
    s_unknown: "Sconosciuto",
    state_for: "{state} da {d}",
    state_now: "{state} proprio ora",
    alert: "{state} da {d}, oltre il limite di {limit}",
    dur_m: "{m} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m} min",
    dur_d: "{d} g",
    n_open: "Aperti: {n}",
    n_alerts: "{n} avvisi",
    one_alert: "1 avviso",
    all_closed: "Tutto chiuso",
    n_tracked: "{n} monitorati",
    k_contact: "Contatto",
    k_handle: "Maniglia",
    k_lock: "Serratura",
    k_doorbell: "Campanello",
    k_battery: "Batteria",
    k_heating: "Riscaldamento",
    k_power: "Potenza",
    k_breakers: "Interruttori",
    k_pet: "Animale",
    v_off: "Spento",
    v_on: "Acceso",
    v_paused: "In pausa",
    v_inside: "Dentro",
    v_outside: "Fuori",
    v_armed: "{on}/{n} attivi",
    v_tripped: "{n} scattato/i",
    today: "Oggi",
    n_openings: "{n} aperture · {d} in totale",
    one_opening: "1 apertura · {d} in totale",
    no_opening: "Nessuna apertura oggi",
    longest: "Apertura più lunga",
    last: "Ultima apertura",
    ago: "{d} fa",
    lock: "Blocca",
    unlock: "Sblocca",
    unlatch: "Apri",
    history: "Cronologia",
    cancel: "Annulla",
    confirm_unlock: "Sbloccare {name}?",
    confirm_unlatch: "Aprire {name}?",
    f_all: "Tutte",
    f_open: "Aperte",
    f_unlocked: "Sbloccate",
    f_alert: "Avvisi",
    read_only: "sola lettura",
    nothing: "Niente da segnalare",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    not_found: "Entità non trovata: {entity}",
    no_entity: "Scegli un sensore di porta o finestra.",
    none_found: "Nessuna porta o finestra trovata.",
    y_entry: "Porta d'ingresso",
    y_interior: "Porta interna",
    y_french_single: "Portafinestra",
    y_french: "Portafinestra a due ante",
    y_sliding: "Porta scorrevole",
    y_wicket: "Cancelletto",
    y_pet: "Gattaiola",
    y_trapdoor: "Botola",
    y_window: "Finestra",
    y_window_double: "Finestra a due ante",
    y_window_tilt: "Finestra anta ribalta",
    y_window_sliding: "Finestra scorrevole",
    y_hopper: "Vasistas",
    y_electrical_panel: "Quadro elettrico",
    y_garage: "Porta del garage",
    y_gate: "Cancello",
    e_entity: "Sensore di porta o finestra",
    e_entities: "Porte e finestre",
    e_name: "Nome (facoltativo)",
    e_title: "Titolo (facoltativo)",
    e_opening_type: "Tipo di apertura",
    type_auto: "Automatico (classe e nome)",
    e_lock: "Serratura",
    e_doorbell: "Campanello",
    e_battery: "Batteria",
    e_handle: "Maniglia della finestra",
    e_climate: "Riscaldamento",
    e_power: "Potenza",
    e_pet: "Presenza dell'animale",
    e_open_alert: "Avviso dopo (min)",
    e_show_history: "Mostra la sequenza di oggi",
    e_confirm: "Chiedi prima di sbloccare",
    e_zoom: "Pulsante dettaglio",
    e_include_covers: "Porte del garage e cancelli (sola lettura)",
    e_show_journal: "Scheda Diario",
    e_illustration_theme: "Tema dell'illustrazione",
    theme_auto: "Automatico: notte con un tema scuro, giorno con un tema chiaro",
    theme_day: "Giorno",
    theme_night: "Notte",
    e_language: "Lingua",
    lang_auto: "Automatica",
    h_entities: "Vuoto: tutti i sensori di porta, finestra e apertura",
    h_open_alert: "Aperto più a lungo diventa rosso; 0 disattiva l'avviso",
    h_battery: "Vuoto: la batteria del dispositivo del sensore",
    h_handle: "Un sensore che indica aperto, a ribalta o chiuso",
    h_zoom: "Pulsante in alto a destra che passa dalla mini scheda alla scheda completa e ritorno",
    h_include_covers: "Coperture delle classi garage e cancello, disegnate senza i loro comandi",
  },
  nl: {
    openings: "Openingen",
    journal: "Logboek",
    tabs: "Weergaven",
    s_open: "Open",
    s_tilted: "Op kiep",
    s_closed: "Dicht",
    s_locked: "Op slot",
    s_unlocked: "Niet op slot",
    s_jammed: "Geblokkeerd",
    s_unavailable: "Niet beschikbaar",
    s_unknown: "Onbekend",
    state_for: "{state} sinds {d}",
    state_now: "{state} sinds zojuist",
    alert: "{state} sinds {d}, boven de grens van {limit}",
    dur_m: "{m} min",
    dur_h: "{h} u",
    dur_hm: "{h} u {m} min",
    dur_d: "{d} d",
    n_open: "{n} open",
    n_alerts: "{n} meldingen",
    one_alert: "1 melding",
    all_closed: "Alles dicht",
    n_tracked: "{n} gevolgd",
    k_contact: "Contact",
    k_handle: "Kruk",
    k_lock: "Slot",
    k_doorbell: "Deurbel",
    k_battery: "Batterij",
    k_heating: "Verwarming",
    k_power: "Vermogen",
    k_breakers: "Groepen",
    k_pet: "Huisdier",
    v_off: "Uit",
    v_on: "Aan",
    v_paused: "Gepauzeerd",
    v_inside: "Binnen",
    v_outside: "Buiten",
    v_armed: "{on}/{n} aan",
    v_tripped: "{n} gesprongen",
    today: "Vandaag",
    n_openings: "{n} keer open · {d} in totaal",
    one_opening: "1 keer open · {d} in totaal",
    no_opening: "Vandaag niet geopend",
    longest: "Langste opening",
    last: "Laatste opening",
    ago: "{d} geleden",
    lock: "Op slot",
    unlock: "Van slot",
    unlatch: "Openen",
    history: "Geschiedenis",
    cancel: "Annuleren",
    confirm_unlock: "{name} van het slot halen?",
    confirm_unlatch: "{name} openen?",
    f_all: "Alle",
    f_open: "Open",
    f_unlocked: "Niet op slot",
    f_alert: "Meldingen",
    read_only: "alleen lezen",
    nothing: "Niets te melden",
    zoom_in: "Volledige kaart tonen",
    zoom_out: "Terug naar de compacte weergave",
    not_found: "Entiteit niet gevonden: {entity}",
    no_entity: "Kies een deur- of raamsensor.",
    none_found: "Geen deur of raam gevonden.",
    y_entry: "Voordeur",
    y_interior: "Binnendeur",
    y_french_single: "Balkondeur",
    y_french: "Dubbele balkondeur",
    y_sliding: "Schuifpui",
    y_wicket: "Tuinhek",
    y_pet: "Kattenluik",
    y_trapdoor: "Luik",
    y_window: "Raam",
    y_window_double: "Dubbel raam",
    y_window_tilt: "Draaikiepraam",
    y_window_sliding: "Schuifraam",
    y_hopper: "Kiepraam",
    y_electrical_panel: "Meterkast",
    y_garage: "Garagedeur",
    y_gate: "Poort",
    e_entity: "Deur- of raamsensor",
    e_entities: "Deuren en ramen",
    e_name: "Naam (optioneel)",
    e_title: "Titel (optioneel)",
    e_opening_type: "Soort opening",
    type_auto: "Automatisch (apparaatklasse en naam)",
    e_lock: "Slot",
    e_doorbell: "Deurbel",
    e_battery: "Batterij",
    e_handle: "Raamkruk",
    e_climate: "Verwarming",
    e_power: "Vermogen",
    e_pet: "Aanwezigheid huisdier",
    e_open_alert: "Melding na (min)",
    e_show_history: "Tijdlijn van vandaag tonen",
    e_confirm: "Vragen voor het ontgrendelen",
    e_zoom: "Detailknop",
    e_include_covers: "Garagedeuren en poorten (alleen lezen)",
    e_show_journal: "Tabblad Logboek",
    e_illustration_theme: "Thema van de illustratie",
    theme_auto: "Automatisch: nacht bij een donker thema, dag bij een licht thema",
    theme_day: "Dag",
    theme_night: "Nacht",
    e_language: "Taal",
    lang_auto: "Automatisch",
    h_entities: "Leeg: alle deur-, raam- en openingsensoren",
    h_open_alert: "Langer open wordt rood; 0 zet de melding uit",
    h_battery: "Leeg: de batterij van het apparaat van de sensor zelf",
    h_handle: "Een sensor die open, op kiep of dicht meldt",
    h_zoom: "Knop rechtsboven die van de minikaart naar de volledige kaart en terug gaat",
    h_include_covers: "Afdekkingen van de klassen garage en poort, getekend zonder bediening",
  },
  pt: {
    openings: "Aberturas",
    journal: "Registo",
    tabs: "Vistas",
    s_open: "Aberto",
    s_tilted: "Basculado",
    s_closed: "Fechado",
    s_locked: "Trancado",
    s_unlocked: "Destrancado",
    s_jammed: "Encravado",
    s_unavailable: "Indisponível",
    s_unknown: "Desconhecido",
    state_for: "{state} há {d}",
    state_now: "{state} agora mesmo",
    alert: "{state} há {d}, acima do limite de {limit}",
    dur_m: "{m} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m} min",
    dur_d: "{d} d",
    n_open: "Abertos: {n}",
    n_alerts: "{n} alertas",
    one_alert: "1 alerta",
    all_closed: "Tudo fechado",
    n_tracked: "{n} vigiados",
    k_contact: "Contacto",
    k_handle: "Puxador",
    k_lock: "Fechadura",
    k_doorbell: "Campainha",
    k_battery: "Bateria",
    k_heating: "Aquecimento",
    k_power: "Potência",
    k_breakers: "Disjuntores",
    k_pet: "Animal",
    v_off: "Desligado",
    v_on: "Ligado",
    v_paused: "Em pausa",
    v_inside: "Dentro",
    v_outside: "Fora",
    v_armed: "{on}/{n} ligados",
    v_tripped: "{n} disparado(s)",
    today: "Hoje",
    n_openings: "{n} aberturas · {d} no total",
    one_opening: "1 abertura · {d} no total",
    no_opening: "Nenhuma abertura hoje",
    longest: "Abertura mais longa",
    last: "Última abertura",
    ago: "há {d}",
    lock: "Trancar",
    unlock: "Destrancar",
    unlatch: "Abrir",
    history: "Histórico",
    cancel: "Cancelar",
    confirm_unlock: "Destrancar {name}?",
    confirm_unlatch: "Abrir {name}?",
    f_all: "Todas",
    f_open: "Abertas",
    f_unlocked: "Destrancadas",
    f_alert: "Alertas",
    read_only: "só leitura",
    nothing: "Nada a assinalar",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    not_found: "Entidade não encontrada: {entity}",
    no_entity: "Escolha um sensor de porta ou janela.",
    none_found: "Nenhuma porta ou janela encontrada.",
    y_entry: "Porta de entrada",
    y_interior: "Porta interior",
    y_french_single: "Porta de sacada",
    y_french: "Porta de sacada de duas folhas",
    y_sliding: "Porta de correr",
    y_wicket: "Portão pedonal",
    y_pet: "Gateira",
    y_trapdoor: "Alçapão",
    y_window: "Janela",
    y_window_double: "Janela de duas folhas",
    y_window_tilt: "Janela oscilobatente",
    y_window_sliding: "Janela de correr",
    y_hopper: "Janela basculante",
    y_electrical_panel: "Quadro elétrico",
    y_garage: "Porta de garagem",
    y_gate: "Portão",
    e_entity: "Sensor de porta ou janela",
    e_entities: "Portas e janelas",
    e_name: "Nome (opcional)",
    e_title: "Título (opcional)",
    e_opening_type: "Tipo de abertura",
    type_auto: "Automático (classe e nome)",
    e_lock: "Fechadura",
    e_doorbell: "Campainha",
    e_battery: "Bateria",
    e_handle: "Puxador da janela",
    e_climate: "Aquecimento",
    e_power: "Potência",
    e_pet: "Presença do animal",
    e_open_alert: "Alerta após (min)",
    e_show_history: "Mostrar a cronologia de hoje",
    e_confirm: "Perguntar antes de destrancar",
    e_zoom: "Botão de detalhe",
    e_include_covers: "Portas de garagem e portões (só leitura)",
    e_show_journal: "Separador Registo",
    e_illustration_theme: "Tema da ilustração",
    theme_auto: "Automático: noite com um tema escuro, dia com um tema claro",
    theme_day: "Dia",
    theme_night: "Noite",
    e_language: "Idioma",
    lang_auto: "Automático",
    h_entities: "Vazio: todos os sensores de porta, janela e abertura",
    h_open_alert: "Aberto mais tempo fica vermelho; 0 desliga o alerta",
    h_battery: "Vazio: a bateria do próprio dispositivo do sensor",
    h_handle: "Um sensor que indica aberto, basculado ou fechado",
    h_zoom: "Botão no canto superior direito que passa do mini cartão ao cartão completo e volta",
    h_include_covers: "Coberturas das classes garagem e portão, desenhadas sem os seus comandos",
  },
  pl: {
    openings: "Otwory",
    journal: "Dziennik",
    tabs: "Widoki",
    s_open: "Otwarte",
    s_tilted: "Uchylone",
    s_closed: "Zamknięte",
    s_locked: "Zaryglowane",
    s_unlocked: "Odryglowane",
    s_jammed: "Zablokowane",
    s_unavailable: "Niedostępne",
    s_unknown: "Nieznane",
    state_for: "{state} od {d}",
    state_now: "{state} przed chwilą",
    alert: "{state} od {d}, powyżej limitu {limit}",
    dur_m: "{m} min",
    dur_h: "{h} godz.",
    dur_hm: "{h} godz. {m} min",
    dur_d: "{d} dni",
    n_open: "Otwarte: {n}",
    n_alerts: "Alerty: {n}",
    one_alert: "1 alert",
    all_closed: "Wszystko zamknięte",
    n_tracked: "Monitorowane: {n}",
    k_contact: "Kontaktron",
    k_handle: "Klamka",
    k_lock: "Zamek",
    k_doorbell: "Dzwonek",
    k_battery: "Bateria",
    k_heating: "Ogrzewanie",
    k_power: "Moc",
    k_breakers: "Bezpieczniki",
    k_pet: "Zwierzę",
    v_off: "Wył.",
    v_on: "Wł.",
    v_paused: "Wstrzymane",
    v_inside: "W domu",
    v_outside: "Na zewnątrz",
    v_armed: "{on}/{n} wł.",
    v_tripped: "Wybite: {n}",
    today: "Dziś",
    n_openings: "Otwarcia: {n} · łącznie {d}",
    one_opening: "1 otwarcie · łącznie {d}",
    no_opening: "Dziś bez otwarć",
    longest: "Najdłuższe otwarcie",
    last: "Ostatnie otwarcie",
    ago: "{d} temu",
    lock: "Zarygluj",
    unlock: "Odrygluj",
    unlatch: "Otwórz",
    history: "Historia",
    cancel: "Anuluj",
    confirm_unlock: "Odryglować {name}?",
    confirm_unlatch: "Otworzyć {name}?",
    f_all: "Wszystkie",
    f_open: "Otwarte",
    f_unlocked: "Odryglowane",
    f_alert: "Alerty",
    read_only: "tylko odczyt",
    nothing: "Nic do zgłoszenia",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Wróć do widoku kompaktowego",
    not_found: "Nie znaleziono encji: {entity}",
    no_entity: "Wybierz czujnik drzwi lub okna.",
    none_found: "Nie znaleziono drzwi ani okien.",
    y_entry: "Drzwi wejściowe",
    y_interior: "Drzwi wewnętrzne",
    y_french_single: "Drzwi balkonowe",
    y_french: "Dwuskrzydłowe drzwi balkonowe",
    y_sliding: "Drzwi przesuwne",
    y_wicket: "Furtka",
    y_pet: "Klapka dla kota",
    y_trapdoor: "Klapa",
    y_window: "Okno",
    y_window_double: "Okno dwuskrzydłowe",
    y_window_tilt: "Okno uchylno-rozwierne",
    y_window_sliding: "Okno przesuwne",
    y_hopper: "Okno uchylne",
    y_electrical_panel: "Rozdzielnica",
    y_garage: "Brama garażowa",
    y_gate: "Brama",
    e_entity: "Czujnik drzwi lub okna",
    e_entities: "Drzwi i okna",
    e_name: "Nazwa (opcjonalnie)",
    e_title: "Tytuł (opcjonalnie)",
    e_opening_type: "Rodzaj otworu",
    type_auto: "Automatycznie (klasa i nazwa)",
    e_lock: "Zamek",
    e_doorbell: "Dzwonek",
    e_battery: "Bateria",
    e_handle: "Klamka okienna",
    e_climate: "Ogrzewanie",
    e_power: "Moc",
    e_pet: "Obecność zwierzęcia",
    e_open_alert: "Alert po (min)",
    e_show_history: "Pokaż dzisiejszą oś czasu",
    e_confirm: "Pytaj przed odryglowaniem",
    e_zoom: "Przycisk szczegółów",
    e_include_covers: "Bramy garażowe i bramy (tylko odczyt)",
    e_show_journal: "Karta Dziennik",
    e_illustration_theme: "Motyw ilustracji",
    theme_auto: "Automatycznie: noc przy ciemnym motywie, dzień przy jasnym",
    theme_day: "Dzień",
    theme_night: "Noc",
    e_language: "Język",
    lang_auto: "Automatycznie",
    h_entities: "Puste: wszystkie czujniki drzwi, okien i otwarcia",
    h_open_alert: "Dłużej otwarte zmienia kolor na czerwony; 0 wyłącza alert",
    h_battery: "Puste: bateria urządzenia samego czujnika",
    h_handle: "Czujnik zgłaszający otwarte, uchylone lub zamknięte",
    h_zoom: "Przycisk w prawym górnym rogu, który przełącza mini kartę na pełną i z powrotem",
    h_include_covers: "Osłony klas brama garażowa i brama, rysowane bez sterowania",
  },
  ro: {
    openings: "Deschideri",
    journal: "Jurnal",
    tabs: "Vizualizări",
    s_open: "Deschis",
    s_tilted: "Rabatat",
    s_closed: "Închis",
    s_locked: "Încuiat",
    s_unlocked: "Descuiat",
    s_jammed: "Blocat",
    s_unavailable: "Indisponibil",
    s_unknown: "Necunoscut",
    state_for: "{state} de {d}",
    state_now: "{state} chiar acum",
    alert: "{state} de {d}, peste limita de {limit}",
    dur_m: "{m} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m} min",
    dur_d: "{d} z",
    n_open: "Deschise: {n}",
    n_alerts: "Alerte: {n}",
    one_alert: "1 alertă",
    all_closed: "Totul închis",
    n_tracked: "Urmărite: {n}",
    k_contact: "Contact",
    k_handle: "Mâner",
    k_lock: "Încuietoare",
    k_doorbell: "Sonerie",
    k_battery: "Baterie",
    k_heating: "Încălzire",
    k_power: "Putere",
    k_breakers: "Siguranțe",
    k_pet: "Animal",
    v_off: "Oprit",
    v_on: "Pornit",
    v_paused: "În pauză",
    v_inside: "Înăuntru",
    v_outside: "Afară",
    v_armed: "{on}/{n} pornite",
    v_tripped: "Declanșate: {n}",
    today: "Azi",
    n_openings: "Deschideri: {n} · {d} în total",
    one_opening: "1 deschidere · {d} în total",
    no_opening: "Nicio deschidere azi",
    longest: "Cea mai lungă deschidere",
    last: "Ultima deschidere",
    ago: "acum {d}",
    lock: "Încuie",
    unlock: "Descuie",
    unlatch: "Deschide",
    history: "Istoric",
    cancel: "Anulează",
    confirm_unlock: "Descui {name}?",
    confirm_unlatch: "Deschizi {name}?",
    f_all: "Toate",
    f_open: "Deschise",
    f_unlocked: "Descuiate",
    f_alert: "Alerte",
    read_only: "doar citire",
    nothing: "Nimic de semnalat",
    zoom_in: "Afișează cardul complet",
    zoom_out: "Înapoi la vizualizarea compactă",
    not_found: "Entitate negăsită: {entity}",
    no_entity: "Alege un senzor de ușă sau de fereastră.",
    none_found: "Nu s-a găsit nicio ușă sau fereastră.",
    y_entry: "Ușă de intrare",
    y_interior: "Ușă interioară",
    y_french_single: "Ușă de balcon",
    y_french: "Ușă de balcon cu două canate",
    y_sliding: "Ușă glisantă",
    y_wicket: "Portiță",
    y_pet: "Ușiță pentru pisici",
    y_trapdoor: "Trapă",
    y_window: "Fereastră",
    y_window_double: "Fereastră cu două canate",
    y_window_tilt: "Fereastră oscilobatantă",
    y_window_sliding: "Fereastră glisantă",
    y_hopper: "Fereastră rabatabilă",
    y_electrical_panel: "Tablou electric",
    y_garage: "Ușă de garaj",
    y_gate: "Poartă",
    e_entity: "Senzor de ușă sau fereastră",
    e_entities: "Uși și ferestre",
    e_name: "Nume (opțional)",
    e_title: "Titlu (opțional)",
    e_opening_type: "Tip de deschidere",
    type_auto: "Automat (clasă și nume)",
    e_lock: "Încuietoare",
    e_doorbell: "Sonerie",
    e_battery: "Baterie",
    e_handle: "Mâner de fereastră",
    e_climate: "Încălzire",
    e_power: "Putere",
    e_pet: "Prezența animalului",
    e_open_alert: "Alertă după (min)",
    e_show_history: "Afișează cronologia de azi",
    e_confirm: "Întreabă înainte de descuiere",
    e_zoom: "Buton de detaliu",
    e_include_covers: "Uși de garaj și porți (doar citire)",
    e_show_journal: "Fila Jurnal",
    e_illustration_theme: "Tema ilustrației",
    theme_auto: "Automat: noapte cu o temă întunecată, zi cu o temă deschisă",
    theme_day: "Zi",
    theme_night: "Noapte",
    e_language: "Limbă",
    lang_auto: "Automat",
    h_entities: "Gol: toți senzorii de ușă, fereastră și deschidere",
    h_open_alert: "Deschis mai mult devine roșu; 0 dezactivează alerta",
    h_battery: "Gol: bateria dispozitivului senzorului",
    h_handle: "Un senzor care raportează deschis, rabatat sau închis",
    h_zoom: "Buton din dreapta sus care trece de la mini card la cardul complet și înapoi",
    h_include_covers: "Acoperiri din clasele garaj și poartă, desenate fără comenzile lor",
  },
  da: {
    openings: "Åbninger",
    journal: "Logbog",
    tabs: "Visninger",
    s_open: "Åben",
    s_tilted: "Vippet",
    s_closed: "Lukket",
    s_locked: "Låst",
    s_unlocked: "Ulåst",
    s_jammed: "Fastlåst",
    s_unavailable: "Utilgængelig",
    s_unknown: "Ukendt",
    state_for: "{state} i {d}",
    state_now: "{state} lige nu",
    alert: "{state} i {d}, over grænsen på {limit}",
    dur_m: "{m} min",
    dur_h: "{h} t",
    dur_hm: "{h} t {m} min",
    dur_d: "{d} d",
    n_open: "{n} åbne",
    n_alerts: "{n} advarsler",
    one_alert: "1 advarsel",
    all_closed: "Alt lukket",
    n_tracked: "{n} overvåget",
    k_contact: "Kontakt",
    k_handle: "Håndtag",
    k_lock: "Lås",
    k_doorbell: "Dørklokke",
    k_battery: "Batteri",
    k_heating: "Varme",
    k_power: "Effekt",
    k_breakers: "Afbrydere",
    k_pet: "Kæledyr",
    v_off: "Slukket",
    v_on: "Tændt",
    v_paused: "På pause",
    v_inside: "Inde",
    v_outside: "Ude",
    v_armed: "{on}/{n} tændt",
    v_tripped: "{n} udløst",
    today: "I dag",
    n_openings: "{n} åbninger · {d} i alt",
    one_opening: "1 åbning · {d} i alt",
    no_opening: "Ingen åbning i dag",
    longest: "Længste åbning",
    last: "Seneste åbning",
    ago: "for {d} siden",
    lock: "Lås",
    unlock: "Lås op",
    unlatch: "Åbn",
    history: "Historik",
    cancel: "Annuller",
    confirm_unlock: "Lås {name} op?",
    confirm_unlatch: "Åbn {name}?",
    f_all: "Alle",
    f_open: "Åbne",
    f_unlocked: "Ulåste",
    f_alert: "Advarsler",
    read_only: "kun visning",
    nothing: "Intet at melde",
    zoom_in: "Vis hele kortet",
    zoom_out: "Tilbage til kompakt visning",
    not_found: "Enhed ikke fundet: {entity}",
    no_entity: "Vælg en dør- eller vinduessensor.",
    none_found: "Ingen døre eller vinduer fundet.",
    y_entry: "Hoveddør",
    y_interior: "Indvendig dør",
    y_french_single: "Altandør",
    y_french: "Dobbelt altandør",
    y_sliding: "Skydedør",
    y_wicket: "Havelåge",
    y_pet: "Kattelem",
    y_trapdoor: "Lem",
    y_window: "Vindue",
    y_window_double: "Dobbelt vindue",
    y_window_tilt: "Dreje-kip-vindue",
    y_window_sliding: "Skydevindue",
    y_hopper: "Vippevindue",
    y_electrical_panel: "Eltavle",
    y_garage: "Garageport",
    y_gate: "Port",
    e_entity: "Dør- eller vinduessensor",
    e_entities: "Døre og vinduer",
    e_name: "Navn (valgfrit)",
    e_title: "Titel (valgfri)",
    e_opening_type: "Type åbning",
    type_auto: "Automatisk (enhedsklasse og navn)",
    e_lock: "Lås",
    e_doorbell: "Dørklokke",
    e_battery: "Batteri",
    e_handle: "Vindueshåndtag",
    e_climate: "Varme",
    e_power: "Effekt",
    e_pet: "Kæledyrets tilstedeværelse",
    e_open_alert: "Advarsel efter (min)",
    e_show_history: "Vis dagens tidslinje",
    e_confirm: "Spørg før oplåsning",
    e_zoom: "Detaljeknap",
    e_include_covers: "Garageporte og porte (kun visning)",
    e_show_journal: "Fanen Logbog",
    e_illustration_theme: "Illustrationens tema",
    theme_auto: "Automatisk: nat med mørkt tema, dag med lyst tema",
    theme_day: "Dag",
    theme_night: "Nat",
    e_language: "Sprog",
    lang_auto: "Automatisk",
    h_entities: "Tom: alle dør-, vindues- og åbningssensorer",
    h_open_alert: "Åben længere bliver rød; 0 slår advarslen fra",
    h_battery: "Tom: batteriet i sensorens egen enhed",
    h_handle: "En sensor, der melder åben, vippet eller lukket",
    h_zoom: "Knap øverst til højre, der skifter fra minikortet til hele kortet og tilbage",
    h_include_covers: "Afdækninger af klasserne garage og port, tegnet uden deres betjening",
  },
  sv: {
    openings: "Öppningar",
    journal: "Logg",
    tabs: "Vyer",
    s_open: "Öppen",
    s_tilted: "Vädringsläge",
    s_closed: "Stängd",
    s_locked: "Låst",
    s_unlocked: "Olåst",
    s_jammed: "Fastnat",
    s_unavailable: "Inte tillgänglig",
    s_unknown: "Okänd",
    state_for: "{state} i {d}",
    state_now: "{state} nyss",
    alert: "{state} i {d}, över gränsen på {limit}",
    dur_m: "{m} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m} min",
    dur_d: "{d} d",
    n_open: "{n} öppna",
    n_alerts: "{n} varningar",
    one_alert: "1 varning",
    all_closed: "Allt stängt",
    n_tracked: "{n} bevakade",
    k_contact: "Kontakt",
    k_handle: "Handtag",
    k_lock: "Lås",
    k_doorbell: "Dörrklocka",
    k_battery: "Batteri",
    k_heating: "Värme",
    k_power: "Effekt",
    k_breakers: "Säkringar",
    k_pet: "Husdjur",
    v_off: "Av",
    v_on: "På",
    v_paused: "Pausad",
    v_inside: "Inne",
    v_outside: "Ute",
    v_armed: "{on}/{n} på",
    v_tripped: "{n} utlösta",
    today: "I dag",
    n_openings: "{n} öppningar · {d} totalt",
    one_opening: "1 öppning · {d} totalt",
    no_opening: "Ingen öppning i dag",
    longest: "Längsta öppning",
    last: "Senaste öppning",
    ago: "för {d} sedan",
    lock: "Lås",
    unlock: "Lås upp",
    unlatch: "Öppna",
    history: "Historik",
    cancel: "Avbryt",
    confirm_unlock: "Lås upp {name}?",
    confirm_unlatch: "Öppna {name}?",
    f_all: "Alla",
    f_open: "Öppna",
    f_unlocked: "Olåsta",
    f_alert: "Varningar",
    read_only: "endast visning",
    nothing: "Inget att rapportera",
    zoom_in: "Visa hela kortet",
    zoom_out: "Tillbaka till kompakt vy",
    not_found: "Entiteten hittades inte: {entity}",
    no_entity: "Välj en dörr- eller fönstersensor.",
    none_found: "Inga dörrar eller fönster hittades.",
    y_entry: "Ytterdörr",
    y_interior: "Innerdörr",
    y_french_single: "Balkongdörr",
    y_french: "Dubbel balkongdörr",
    y_sliding: "Skjutdörr",
    y_wicket: "Grind",
    y_pet: "Kattlucka",
    y_trapdoor: "Lucka",
    y_window: "Fönster",
    y_window_double: "Tvåluftsfönster",
    y_window_tilt: "Vrid-tippfönster",
    y_window_sliding: "Skjutfönster",
    y_hopper: "Vippfönster",
    y_electrical_panel: "Elcentral",
    y_garage: "Garageport",
    y_gate: "Port",
    e_entity: "Dörr- eller fönstersensor",
    e_entities: "Dörrar och fönster",
    e_name: "Namn (valfritt)",
    e_title: "Titel (valfri)",
    e_opening_type: "Typ av öppning",
    type_auto: "Automatisk (enhetsklass och namn)",
    e_lock: "Lås",
    e_doorbell: "Dörrklocka",
    e_battery: "Batteri",
    e_handle: "Fönsterhandtag",
    e_climate: "Värme",
    e_power: "Effekt",
    e_pet: "Husdjurets närvaro",
    e_open_alert: "Varning efter (min)",
    e_show_history: "Visa dagens tidslinje",
    e_confirm: "Fråga innan upplåsning",
    e_zoom: "Detaljknapp",
    e_include_covers: "Garageportar och portar (endast visning)",
    e_show_journal: "Fliken Logg",
    e_illustration_theme: "Illustrationens tema",
    theme_auto: "Automatiskt: natt med mörkt tema, dag med ljust tema",
    theme_day: "Dag",
    theme_night: "Natt",
    e_language: "Språk",
    lang_auto: "Automatiskt",
    h_entities: "Tom: alla dörr-, fönster- och öppningssensorer",
    h_open_alert: "Öppen längre blir röd; 0 stänger av varningen",
    h_battery: "Tom: batteriet i sensorns egen enhet",
    h_handle: "En sensor som rapporterar öppen, vädringsläge eller stängd",
    h_zoom: "Knapp uppe till höger som växlar från minikortet till hela kortet och tillbaka",
    h_include_covers: "Skydd av klasserna garage och port, ritade utan sina reglage",
  },
  bg: {
    openings: "Отвори",
    journal: "Дневник",
    tabs: "Изгледи",
    s_open: "Отворено",
    s_tilted: "Открехнато",
    s_closed: "Затворено",
    s_locked: "Заключено",
    s_unlocked: "Отключено",
    s_jammed: "Заяждане",
    s_unavailable: "Недостъпно",
    s_unknown: "Неизвестно",
    state_for: "{state} от {d}",
    state_now: "{state} току-що",
    alert: "{state} от {d}, над лимита от {limit}",
    dur_m: "{m} мин",
    dur_h: "{h} ч",
    dur_hm: "{h} ч {m} мин",
    dur_d: "{d} д",
    n_open: "Отворени: {n}",
    n_alerts: "Тревоги: {n}",
    one_alert: "1 тревога",
    all_closed: "Всичко е затворено",
    n_tracked: "Наблюдавани: {n}",
    k_contact: "Контакт",
    k_handle: "Дръжка",
    k_lock: "Брава",
    k_doorbell: "Звънец",
    k_battery: "Батерия",
    k_heating: "Отопление",
    k_power: "Мощност",
    k_breakers: "Предпазители",
    k_pet: "Любимец",
    v_off: "Изкл.",
    v_on: "Вкл.",
    v_paused: "На пауза",
    v_inside: "Вътре",
    v_outside: "Навън",
    v_armed: "{on}/{n} вкл.",
    v_tripped: "Паднали: {n}",
    today: "Днес",
    n_openings: "Отваряния: {n} · общо {d}",
    one_opening: "1 отваряне · общо {d}",
    no_opening: "Днес без отваряне",
    longest: "Най-дълго отваряне",
    last: "Последно отваряне",
    ago: "преди {d}",
    lock: "Заключи",
    unlock: "Отключи",
    unlatch: "Отвори",
    history: "История",
    cancel: "Отказ",
    confirm_unlock: "Да се отключи ли {name}?",
    confirm_unlatch: "Да се отвори ли {name}?",
    f_all: "Всички",
    f_open: "Отворени",
    f_unlocked: "Отключени",
    f_alert: "Тревоги",
    read_only: "само четене",
    nothing: "Няма нищо за отбелязване",
    zoom_in: "Покажи цялата карта",
    zoom_out: "Обратно към компактния изглед",
    not_found: "Обектът не е намерен: {entity}",
    no_entity: "Изберете сензор за врата или прозорец.",
    none_found: "Не са намерени врати и прозорци.",
    y_entry: "Входна врата",
    y_interior: "Вътрешна врата",
    y_french_single: "Балконска врата",
    y_french: "Двукрила балконска врата",
    y_sliding: "Плъзгаща врата",
    y_wicket: "Портичка",
    y_pet: "Вратичка за котка",
    y_trapdoor: "Капак",
    y_window: "Прозорец",
    y_window_double: "Двукрил прозорец",
    y_window_tilt: "Прозорец с двойно отваряне",
    y_window_sliding: "Плъзгащ прозорец",
    y_hopper: "Падащ прозорец",
    y_electrical_panel: "Електрическо табло",
    y_garage: "Гаражна врата",
    y_gate: "Порта",
    e_entity: "Сензор за врата или прозорец",
    e_entities: "Врати и прозорци",
    e_name: "Име (по избор)",
    e_title: "Заглавие (по избор)",
    e_opening_type: "Вид отвор",
    type_auto: "Автоматично (клас и име)",
    e_lock: "Брава",
    e_doorbell: "Звънец",
    e_battery: "Батерия",
    e_handle: "Дръжка на прозорец",
    e_climate: "Отопление",
    e_power: "Мощност",
    e_pet: "Присъствие на любимеца",
    e_open_alert: "Тревога след (мин)",
    e_show_history: "Показвай днешната времева линия",
    e_confirm: "Питай преди отключване",
    e_zoom: "Бутон за подробности",
    e_include_covers: "Гаражни врати и порти (само четене)",
    e_show_journal: "Раздел Дневник",
    e_illustration_theme: "Тема на илюстрацията",
    theme_auto: "Автоматично: нощ при тъмна тема, ден при светла",
    theme_day: "Ден",
    theme_night: "Нощ",
    e_language: "Език",
    lang_auto: "Автоматично",
    h_entities: "Празно: всички сензори за врати, прозорци и отваряне",
    h_open_alert: "Отворено по-дълго става червено; 0 изключва тревогата",
    h_battery: "Празно: батерията на устройството на сензора",
    h_handle: "Сензор, който отчита отворено, открехнато или затворено",
    h_zoom: "Бутон горе вдясно, който превключва от мини картата към цялата и обратно",
    h_include_covers: "Щори от класове гараж и порта, нарисувани без управлението им",
  },
  ru: {
    openings: "Проёмы",
    journal: "Журнал",
    tabs: "Виды",
    s_open: "Открыто",
    s_tilted: "Откинуто",
    s_closed: "Закрыто",
    s_locked: "Заперто",
    s_unlocked: "Не заперто",
    s_jammed: "Заклинило",
    s_unavailable: "Недоступно",
    s_unknown: "Неизвестно",
    state_for: "{state} уже {d}",
    state_now: "{state} только что",
    alert: "{state} уже {d}, больше лимита {limit}",
    dur_m: "{m} мин",
    dur_h: "{h} ч",
    dur_hm: "{h} ч {m} мин",
    dur_d: "{d} д",
    n_open: "Открыто: {n}",
    n_alerts: "Тревоги: {n}",
    one_alert: "1 тревога",
    all_closed: "Всё закрыто",
    n_tracked: "Под контролем: {n}",
    k_contact: "Контакт",
    k_handle: "Ручка",
    k_lock: "Замок",
    k_doorbell: "Звонок",
    k_battery: "Батарея",
    k_heating: "Отопление",
    k_power: "Мощность",
    k_breakers: "Автоматы",
    k_pet: "Питомец",
    v_off: "Выкл.",
    v_on: "Вкл.",
    v_paused: "На паузе",
    v_inside: "Дома",
    v_outside: "На улице",
    v_armed: "{on}/{n} вкл.",
    v_tripped: "Выбило: {n}",
    today: "Сегодня",
    n_openings: "Открытий: {n} · всего {d}",
    one_opening: "1 открытие · всего {d}",
    no_opening: "Сегодня не открывали",
    longest: "Самое долгое открытие",
    last: "Последнее открытие",
    ago: "{d} назад",
    lock: "Запереть",
    unlock: "Отпереть",
    unlatch: "Открыть",
    history: "История",
    cancel: "Отмена",
    confirm_unlock: "Отпереть {name}?",
    confirm_unlatch: "Открыть {name}?",
    f_all: "Все",
    f_open: "Открытые",
    f_unlocked: "Не запертые",
    f_alert: "Тревоги",
    read_only: "только чтение",
    nothing: "Ничего особенного",
    zoom_in: "Показать полную карточку",
    zoom_out: "Вернуться к компактному виду",
    not_found: "Объект не найден: {entity}",
    no_entity: "Выберите датчик двери или окна.",
    none_found: "Двери и окна не найдены.",
    y_entry: "Входная дверь",
    y_interior: "Межкомнатная дверь",
    y_french_single: "Балконная дверь",
    y_french: "Двустворчатая балконная дверь",
    y_sliding: "Раздвижная дверь",
    y_wicket: "Калитка",
    y_pet: "Дверца для кошки",
    y_trapdoor: "Люк",
    y_window: "Окно",
    y_window_double: "Двустворчатое окно",
    y_window_tilt: "Поворотно-откидное окно",
    y_window_sliding: "Раздвижное окно",
    y_hopper: "Откидное окно",
    y_electrical_panel: "Электрощит",
    y_garage: "Гаражные ворота",
    y_gate: "Ворота",
    e_entity: "Датчик двери или окна",
    e_entities: "Двери и окна",
    e_name: "Имя (необязательно)",
    e_title: "Заголовок (необязательно)",
    e_opening_type: "Тип проёма",
    type_auto: "Автоматически (класс и имя)",
    e_lock: "Замок",
    e_doorbell: "Звонок",
    e_battery: "Батарея",
    e_handle: "Оконная ручка",
    e_climate: "Отопление",
    e_power: "Мощность",
    e_pet: "Присутствие питомца",
    e_open_alert: "Тревога через (мин)",
    e_show_history: "Показывать сегодняшнюю шкалу",
    e_confirm: "Спрашивать перед отпиранием",
    e_zoom: "Кнопка подробностей",
    e_include_covers: "Гаражные ворота и ворота (только чтение)",
    e_show_journal: "Вкладка Журнал",
    e_illustration_theme: "Тема иллюстрации",
    theme_auto: "Автоматически: ночь при тёмной теме, день при светлой",
    theme_day: "День",
    theme_night: "Ночь",
    e_language: "Язык",
    lang_auto: "Автоматически",
    h_entities: "Пусто: все датчики дверей, окон и открытия",
    h_open_alert: "Открытое дольше становится красным; 0 отключает тревогу",
    h_battery: "Пусто: батарея устройства самого датчика",
    h_handle: "Датчик, сообщающий открыто, откинуто или закрыто",
    h_zoom: "Кнопка вверху справа, переключающая мини-карточку на полную и обратно",
    h_include_covers: "Шторы классов гараж и ворота, нарисованные без управления",
  },
  uk: {
    openings: "Отвори",
    journal: "Журнал",
    tabs: "Подання",
    s_open: "Відчинено",
    s_tilted: "Відкинуто",
    s_closed: "Зачинено",
    s_locked: "Замкнено",
    s_unlocked: "Незамкнено",
    s_jammed: "Заклинило",
    s_unavailable: "Недоступно",
    s_unknown: "Невідомо",
    state_for: "{state} вже {d}",
    state_now: "{state} щойно",
    alert: "{state} вже {d}, понад ліміт {limit}",
    dur_m: "{m} хв",
    dur_h: "{h} год",
    dur_hm: "{h} год {m} хв",
    dur_d: "{d} д",
    n_open: "Відчинено: {n}",
    n_alerts: "Тривоги: {n}",
    one_alert: "1 тривога",
    all_closed: "Усе зачинено",
    n_tracked: "Під наглядом: {n}",
    k_contact: "Контакт",
    k_handle: "Ручка",
    k_lock: "Замок",
    k_doorbell: "Дзвінок",
    k_battery: "Батарея",
    k_heating: "Опалення",
    k_power: "Потужність",
    k_breakers: "Автомати",
    k_pet: "Улюбленець",
    v_off: "Вимк.",
    v_on: "Увімк.",
    v_paused: "На паузі",
    v_inside: "Вдома",
    v_outside: "Надворі",
    v_armed: "{on}/{n} увімк.",
    v_tripped: "Вибило: {n}",
    today: "Сьогодні",
    n_openings: "Відчинень: {n} · разом {d}",
    one_opening: "1 відчинення · разом {d}",
    no_opening: "Сьогодні не відчиняли",
    longest: "Найдовше відчинення",
    last: "Останнє відчинення",
    ago: "{d} тому",
    lock: "Замкнути",
    unlock: "Відімкнути",
    unlatch: "Відчинити",
    history: "Історія",
    cancel: "Скасувати",
    confirm_unlock: "Відімкнути {name}?",
    confirm_unlatch: "Відчинити {name}?",
    f_all: "Усі",
    f_open: "Відчинені",
    f_unlocked: "Незамкнені",
    f_alert: "Тривоги",
    read_only: "лише перегляд",
    nothing: "Нічого повідомляти",
    zoom_in: "Показати повну картку",
    zoom_out: "Повернутися до компактного вигляду",
    not_found: "Сутність не знайдено: {entity}",
    no_entity: "Виберіть датчик дверей або вікна.",
    none_found: "Дверей і вікон не знайдено.",
    y_entry: "Вхідні двері",
    y_interior: "Міжкімнатні двері",
    y_french_single: "Балконні двері",
    y_french: "Двостулкові балконні двері",
    y_sliding: "Розсувні двері",
    y_wicket: "Хвіртка",
    y_pet: "Дверцята для кішки",
    y_trapdoor: "Люк",
    y_window: "Вікно",
    y_window_double: "Двостулкове вікно",
    y_window_tilt: "Поворотно-відкидне вікно",
    y_window_sliding: "Розсувне вікно",
    y_hopper: "Відкидне вікно",
    y_electrical_panel: "Електрощит",
    y_garage: "Гаражні ворота",
    y_gate: "Ворота",
    e_entity: "Датчик дверей або вікна",
    e_entities: "Двері та вікна",
    e_name: "Назва (необов'язково)",
    e_title: "Заголовок (необов'язково)",
    e_opening_type: "Тип отвору",
    type_auto: "Автоматично (клас і назва)",
    e_lock: "Замок",
    e_doorbell: "Дзвінок",
    e_battery: "Батарея",
    e_handle: "Віконна ручка",
    e_climate: "Опалення",
    e_power: "Потужність",
    e_pet: "Присутність улюбленця",
    e_open_alert: "Тривога через (хв)",
    e_show_history: "Показувати сьогоднішню шкалу",
    e_confirm: "Питати перед відмиканням",
    e_zoom: "Кнопка подробиць",
    e_include_covers: "Гаражні ворота та ворота (лише перегляд)",
    e_show_journal: "Вкладка Журнал",
    e_illustration_theme: "Тема ілюстрації",
    theme_auto: "Автоматично: ніч із темною темою, день зі світлою",
    theme_day: "День",
    theme_night: "Ніч",
    e_language: "Мова",
    lang_auto: "Автоматично",
    h_entities: "Порожньо: усі датчики дверей, вікон і відчинення",
    h_open_alert: "Відчинене довше стає червоним; 0 вимикає тривогу",
    h_battery: "Порожньо: батарея пристрою самого датчика",
    h_handle: "Датчик, що повідомляє відчинено, відкинуто чи зачинено",
    h_zoom: "Кнопка вгорі праворуч, що перемикає міні-картку на повну й назад",
    h_include_covers: "Штори класів гараж і ворота, намальовані без керування",
  },
  hu: {
    openings: "Nyílászárók",
    journal: "Napló",
    tabs: "Nézetek",
    s_open: "Nyitva",
    s_tilted: "Bukóban",
    s_closed: "Zárva",
    s_locked: "Bezárva",
    s_unlocked: "Kinyitva",
    s_jammed: "Beragadt",
    s_unavailable: "Nem elérhető",
    s_unknown: "Ismeretlen",
    state_for: "{state} {d} óta",
    state_now: "{state} épp most",
    alert: "{state} {d} óta, a(z) {limit} határ felett",
    dur_m: "{m} perc",
    dur_h: "{h} óra",
    dur_hm: "{h} óra {m} perc",
    dur_d: "{d} nap",
    n_open: "Nyitva: {n}",
    n_alerts: "Riasztás: {n}",
    one_alert: "1 riasztás",
    all_closed: "Minden zárva",
    n_tracked: "Figyelt: {n}",
    k_contact: "Érintkező",
    k_handle: "Kilincs",
    k_lock: "Zár",
    k_doorbell: "Csengő",
    k_battery: "Akkumulátor",
    k_heating: "Fűtés",
    k_power: "Teljesítmény",
    k_breakers: "Kismegszakítók",
    k_pet: "Háziállat",
    v_off: "Ki",
    v_on: "Be",
    v_paused: "Szüneteltetve",
    v_inside: "Bent",
    v_outside: "Kint",
    v_armed: "{on}/{n} be",
    v_tripped: "Leoldott: {n}",
    today: "Ma",
    n_openings: "Nyitás: {n} · összesen {d}",
    one_opening: "1 nyitás · összesen {d}",
    no_opening: "Ma nem volt nyitás",
    longest: "Leghosszabb nyitás",
    last: "Utolsó nyitás",
    ago: "{d} ezelőtt",
    lock: "Bezár",
    unlock: "Kinyit",
    unlatch: "Nyitás",
    history: "Előzmények",
    cancel: "Mégse",
    confirm_unlock: "Kinyitod: {name}?",
    confirm_unlatch: "Megnyitod: {name}?",
    f_all: "Mind",
    f_open: "Nyitott",
    f_unlocked: "Kinyitott",
    f_alert: "Riasztások",
    read_only: "csak olvasható",
    nothing: "Nincs jelentenivaló",
    zoom_in: "Teljes kártya megjelenítése",
    zoom_out: "Vissza a kompakt nézethez",
    not_found: "Az entitás nem található: {entity}",
    no_entity: "Válassz ajtó- vagy ablakérzékelőt.",
    none_found: "Nem található ajtó vagy ablak.",
    y_entry: "Bejárati ajtó",
    y_interior: "Beltéri ajtó",
    y_french_single: "Erkélyajtó",
    y_french: "Kétszárnyú erkélyajtó",
    y_sliding: "Tolóajtó",
    y_wicket: "Kiskapu",
    y_pet: "Macskaajtó",
    y_trapdoor: "Csapóajtó",
    y_window: "Ablak",
    y_window_double: "Kétszárnyú ablak",
    y_window_tilt: "Bukó-nyíló ablak",
    y_window_sliding: "Tolóablak",
    y_hopper: "Bukóablak",
    y_electrical_panel: "Villanyszekrény",
    y_garage: "Garázskapu",
    y_gate: "Kapu",
    e_entity: "Ajtó- vagy ablakérzékelő",
    e_entities: "Ajtók és ablakok",
    e_name: "Név (nem kötelező)",
    e_title: "Cím (nem kötelező)",
    e_opening_type: "Nyílászáró típusa",
    type_auto: "Automatikus (eszközosztály és név)",
    e_lock: "Zár",
    e_doorbell: "Csengő",
    e_battery: "Akkumulátor",
    e_handle: "Ablakkilincs",
    e_climate: "Fűtés",
    e_power: "Teljesítmény",
    e_pet: "Háziállat jelenléte",
    e_open_alert: "Riasztás ennyi után (perc)",
    e_show_history: "A mai idővonal megjelenítése",
    e_confirm: "Kérdezzen kinyitás előtt",
    e_zoom: "Részletek gomb",
    e_include_covers: "Garázskapuk és kapuk (csak olvasható)",
    e_show_journal: "Napló fül",
    e_illustration_theme: "Illusztráció témája",
    theme_auto: "Automatikus: éjszaka sötét témával, nappal világos témával",
    theme_day: "Nappal",
    theme_night: "Éjszaka",
    e_language: "Nyelv",
    lang_auto: "Automatikus",
    h_entities: "Üres: minden ajtó-, ablak- és nyitásérzékelő",
    h_open_alert: "Ennél tovább nyitva pirosra vált; a 0 kikapcsolja",
    h_battery: "Üres: az érzékelő saját eszközének akkumulátora",
    h_handle: "Nyitva, bukóban vagy zárva állapotot jelző érzékelő",
    h_zoom: "Jobb felső gomb, amely a mini kártyáról a teljesre vált és vissza",
    h_include_covers: "Garázs és kapu osztályú árnyékolók, vezérlők nélkül rajzolva",
  },
  sk: {
    openings: "Otvory",
    journal: "Denník",
    tabs: "Zobrazenia",
    s_open: "Otvorené",
    s_tilted: "Vyklopené",
    s_closed: "Zatvorené",
    s_locked: "Zamknuté",
    s_unlocked: "Odomknuté",
    s_jammed: "Zaseknuté",
    s_unavailable: "Nedostupné",
    s_unknown: "Neznáme",
    state_for: "{state} už {d}",
    state_now: "{state} práve teraz",
    alert: "{state} už {d}, nad limitom {limit}",
    dur_m: "{m} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m} min",
    dur_d: "{d} d",
    n_open: "Otvorené: {n}",
    n_alerts: "Upozornenia: {n}",
    one_alert: "1 upozornenie",
    all_closed: "Všetko zatvorené",
    n_tracked: "Sledované: {n}",
    k_contact: "Kontakt",
    k_handle: "Kľučka",
    k_lock: "Zámok",
    k_doorbell: "Zvonček",
    k_battery: "Batéria",
    k_heating: "Kúrenie",
    k_power: "Príkon",
    k_breakers: "Ističe",
    k_pet: "Zviera",
    v_off: "Vyp.",
    v_on: "Zap.",
    v_paused: "Pozastavené",
    v_inside: "Vnútri",
    v_outside: "Vonku",
    v_armed: "{on}/{n} zap.",
    v_tripped: "Vypadnuté: {n}",
    today: "Dnes",
    n_openings: "Otvorenia: {n} · spolu {d}",
    one_opening: "1 otvorenie · spolu {d}",
    no_opening: "Dnes bez otvorenia",
    longest: "Najdlhšie otvorenie",
    last: "Posledné otvorenie",
    ago: "pred {d}",
    lock: "Zamknúť",
    unlock: "Odomknúť",
    unlatch: "Otvoriť",
    history: "História",
    cancel: "Zrušiť",
    confirm_unlock: "Odomknúť {name}?",
    confirm_unlatch: "Otvoriť {name}?",
    f_all: "Všetky",
    f_open: "Otvorené",
    f_unlocked: "Odomknuté",
    f_alert: "Upozornenia",
    read_only: "len čítanie",
    nothing: "Nič na hlásenie",
    zoom_in: "Zobraziť celú kartu",
    zoom_out: "Späť na kompaktné zobrazenie",
    not_found: "Entita sa nenašla: {entity}",
    no_entity: "Vyberte senzor dverí alebo okna.",
    none_found: "Nenašli sa žiadne dvere ani okná.",
    y_entry: "Vchodové dvere",
    y_interior: "Vnútorné dvere",
    y_french_single: "Balkónové dvere",
    y_french: "Dvojkrídlové balkónové dvere",
    y_sliding: "Posuvné dvere",
    y_wicket: "Bránka",
    y_pet: "Dvierka pre mačku",
    y_trapdoor: "Poklop",
    y_window: "Okno",
    y_window_double: "Dvojkrídlové okno",
    y_window_tilt: "Sklopno-otváravé okno",
    y_window_sliding: "Posuvné okno",
    y_hopper: "Sklopné okno",
    y_electrical_panel: "Rozvádzač",
    y_garage: "Garážová brána",
    y_gate: "Brána",
    e_entity: "Senzor dverí alebo okna",
    e_entities: "Dvere a okná",
    e_name: "Názov (voliteľný)",
    e_title: "Nadpis (voliteľný)",
    e_opening_type: "Typ otvoru",
    type_auto: "Automaticky (trieda a názov)",
    e_lock: "Zámok",
    e_doorbell: "Zvonček",
    e_battery: "Batéria",
    e_handle: "Okenná kľučka",
    e_climate: "Kúrenie",
    e_power: "Príkon",
    e_pet: "Prítomnosť zvieraťa",
    e_open_alert: "Upozornenie po (min)",
    e_show_history: "Zobraziť dnešnú časovú os",
    e_confirm: "Pýtať sa pred odomknutím",
    e_zoom: "Tlačidlo podrobností",
    e_include_covers: "Garážové brány a brány (len čítanie)",
    e_show_journal: "Karta Denník",
    e_illustration_theme: "Motív ilustrácie",
    theme_auto: "Automaticky: noc s tmavým motívom, deň so svetlým",
    theme_day: "Deň",
    theme_night: "Noc",
    e_language: "Jazyk",
    lang_auto: "Automaticky",
    h_entities: "Prázdne: všetky senzory dverí, okien a otvorenia",
    h_open_alert: "Dlhšie otvorené sčervenie; 0 upozornenie vypne",
    h_battery: "Prázdne: batéria zariadenia samotného senzora",
    h_handle: "Senzor hlásiaci otvorené, vyklopené alebo zatvorené",
    h_zoom: "Tlačidlo vpravo hore, ktoré prepína z mini karty na celú kartu a späť",
    h_include_covers: "Clony tried garáž a brána, kreslené bez ovládania",
  },
  cs: {
    openings: "Otvory",
    journal: "Deník",
    tabs: "Zobrazení",
    s_open: "Otevřeno",
    s_tilted: "Vyklopeno",
    s_closed: "Zavřeno",
    s_locked: "Zamčeno",
    s_unlocked: "Odemčeno",
    s_jammed: "Zaseknuto",
    s_unavailable: "Nedostupné",
    s_unknown: "Neznámé",
    state_for: "{state} už {d}",
    state_now: "{state} právě teď",
    alert: "{state} už {d}, nad limitem {limit}",
    dur_m: "{m} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m} min",
    dur_d: "{d} d",
    n_open: "Otevřeno: {n}",
    n_alerts: "Upozornění: {n}",
    one_alert: "1 upozornění",
    all_closed: "Vše zavřeno",
    n_tracked: "Sledováno: {n}",
    k_contact: "Kontakt",
    k_handle: "Klika",
    k_lock: "Zámek",
    k_doorbell: "Zvonek",
    k_battery: "Baterie",
    k_heating: "Topení",
    k_power: "Příkon",
    k_breakers: "Jističe",
    k_pet: "Zvíře",
    v_off: "Vyp.",
    v_on: "Zap.",
    v_paused: "Pozastaveno",
    v_inside: "Uvnitř",
    v_outside: "Venku",
    v_armed: "{on}/{n} zap.",
    v_tripped: "Vypadlo: {n}",
    today: "Dnes",
    n_openings: "Otevření: {n} · celkem {d}",
    one_opening: "1 otevření · celkem {d}",
    no_opening: "Dnes bez otevření",
    longest: "Nejdelší otevření",
    last: "Poslední otevření",
    ago: "před {d}",
    lock: "Zamknout",
    unlock: "Odemknout",
    unlatch: "Otevřít",
    history: "Historie",
    cancel: "Zrušit",
    confirm_unlock: "Odemknout {name}?",
    confirm_unlatch: "Otevřít {name}?",
    f_all: "Vše",
    f_open: "Otevřené",
    f_unlocked: "Odemčené",
    f_alert: "Upozornění",
    read_only: "jen čtení",
    nothing: "Nic k hlášení",
    zoom_in: "Zobrazit celou kartu",
    zoom_out: "Zpět na kompaktní zobrazení",
    not_found: "Entita nenalezena: {entity}",
    no_entity: "Vyberte senzor dveří nebo okna.",
    none_found: "Nenalezeny žádné dveře ani okna.",
    y_entry: "Vchodové dveře",
    y_interior: "Vnitřní dveře",
    y_french_single: "Balkonové dveře",
    y_french: "Dvoukřídlé balkonové dveře",
    y_sliding: "Posuvné dveře",
    y_wicket: "Branka",
    y_pet: "Dvířka pro kočku",
    y_trapdoor: "Poklop",
    y_window: "Okno",
    y_window_double: "Dvoukřídlé okno",
    y_window_tilt: "Okno sklopně-otočné",
    y_window_sliding: "Posuvné okno",
    y_hopper: "Sklopné okno",
    y_electrical_panel: "Rozvaděč",
    y_garage: "Garážová vrata",
    y_gate: "Brána",
    e_entity: "Senzor dveří nebo okna",
    e_entities: "Dveře a okna",
    e_name: "Název (volitelný)",
    e_title: "Nadpis (volitelný)",
    e_opening_type: "Typ otvoru",
    type_auto: "Automaticky (třída a název)",
    e_lock: "Zámek",
    e_doorbell: "Zvonek",
    e_battery: "Baterie",
    e_handle: "Okenní klika",
    e_climate: "Topení",
    e_power: "Příkon",
    e_pet: "Přítomnost zvířete",
    e_open_alert: "Upozornění po (min)",
    e_show_history: "Zobrazit dnešní časovou osu",
    e_confirm: "Ptát se před odemčením",
    e_zoom: "Tlačítko podrobností",
    e_include_covers: "Garážová vrata a brány (jen čtení)",
    e_show_journal: "Karta Deník",
    e_illustration_theme: "Motiv ilustrace",
    theme_auto: "Automaticky: noc s tmavým motivem, den se světlým",
    theme_day: "Den",
    theme_night: "Noc",
    e_language: "Jazyk",
    lang_auto: "Automaticky",
    h_entities: "Prázdné: všechny senzory dveří, oken a otevření",
    h_open_alert: "Déle otevřené zčervená; 0 upozornění vypne",
    h_battery: "Prázdné: baterie zařízení samotného senzoru",
    h_handle: "Senzor hlásící otevřeno, vyklopeno nebo zavřeno",
    h_zoom: "Tlačítko vpravo nahoře, které přepíná z mini karty na celou kartu a zpět",
    h_include_covers: "Clony tříd garáž a brána, kreslené bez ovládání",
  },
  sl: {
    openings: "Odprtine",
    journal: "Dnevnik",
    tabs: "Pogledi",
    s_open: "Odprto",
    s_tilted: "Nagnjeno",
    s_closed: "Zaprto",
    s_locked: "Zaklenjeno",
    s_unlocked: "Odklenjeno",
    s_jammed: "Zagozdeno",
    s_unavailable: "Ni na voljo",
    s_unknown: "Neznano",
    state_for: "{state} že {d}",
    state_now: "{state} pravkar",
    alert: "{state} že {d}, nad mejo {limit}",
    dur_m: "{m} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m} min",
    dur_d: "{d} d",
    n_open: "Odprto: {n}",
    n_alerts: "Opozorila: {n}",
    one_alert: "1 opozorilo",
    all_closed: "Vse zaprto",
    n_tracked: "Spremljano: {n}",
    k_contact: "Kontakt",
    k_handle: "Kljuka",
    k_lock: "Ključavnica",
    k_doorbell: "Zvonec",
    k_battery: "Baterija",
    k_heating: "Ogrevanje",
    k_power: "Moč",
    k_breakers: "Varovalke",
    k_pet: "Žival",
    v_off: "Izklop.",
    v_on: "Vklop.",
    v_paused: "Zaustavljeno",
    v_inside: "Notri",
    v_outside: "Zunaj",
    v_armed: "{on}/{n} vklop.",
    v_tripped: "Izpadlo: {n}",
    today: "Danes",
    n_openings: "Odprtja: {n} · skupaj {d}",
    one_opening: "1 odprtje · skupaj {d}",
    no_opening: "Danes brez odprtja",
    longest: "Najdaljše odprtje",
    last: "Zadnje odprtje",
    ago: "pred {d}",
    lock: "Zakleni",
    unlock: "Odkleni",
    unlatch: "Odpri",
    history: "Zgodovina",
    cancel: "Prekliči",
    confirm_unlock: "Odkleniti {name}?",
    confirm_unlatch: "Odpreti {name}?",
    f_all: "Vse",
    f_open: "Odprte",
    f_unlocked: "Odklenjene",
    f_alert: "Opozorila",
    read_only: "samo branje",
    nothing: "Nič za poročati",
    zoom_in: "Prikaži celotno kartico",
    zoom_out: "Nazaj na strnjen pogled",
    not_found: "Entitete ni mogoče najti: {entity}",
    no_entity: "Izberite senzor vrat ali okna.",
    none_found: "Ni najdenih vrat ali oken.",
    y_entry: "Vhodna vrata",
    y_interior: "Notranja vrata",
    y_french_single: "Balkonska vrata",
    y_french: "Dvokrilna balkonska vrata",
    y_sliding: "Drsna vrata",
    y_wicket: "Vrtna vrata",
    y_pet: "Mačja loputa",
    y_trapdoor: "Loputa",
    y_window: "Okno",
    y_window_double: "Dvokrilno okno",
    y_window_tilt: "Okno na kip",
    y_window_sliding: "Drsno okno",
    y_hopper: "Nagibno okno",
    y_electrical_panel: "Električna omarica",
    y_garage: "Garažna vrata",
    y_gate: "Vrata dvorišča",
    e_entity: "Senzor vrat ali okna",
    e_entities: "Vrata in okna",
    e_name: "Ime (neobvezno)",
    e_title: "Naslov (neobvezno)",
    e_opening_type: "Vrsta odprtine",
    type_auto: "Samodejno (razred in ime)",
    e_lock: "Ključavnica",
    e_doorbell: "Zvonec",
    e_battery: "Baterija",
    e_handle: "Okenska kljuka",
    e_climate: "Ogrevanje",
    e_power: "Moč",
    e_pet: "Prisotnost živali",
    e_open_alert: "Opozorilo po (min)",
    e_show_history: "Prikaži današnjo časovnico",
    e_confirm: "Vprašaj pred odklepanjem",
    e_zoom: "Gumb za podrobnosti",
    e_include_covers: "Garažna in dvoriščna vrata (samo branje)",
    e_show_journal: "Zavihek Dnevnik",
    e_illustration_theme: "Tema ilustracije",
    theme_auto: "Samodejno: noč s temno temo, dan s svetlo",
    theme_day: "Dan",
    theme_night: "Noč",
    e_language: "Jezik",
    lang_auto: "Samodejno",
    h_entities: "Prazno: vsi senzorji vrat, oken in odprtja",
    h_open_alert: "Dlje odprto postane rdeče; 0 izklopi opozorilo",
    h_battery: "Prazno: baterija naprave senzorja",
    h_handle: "Senzor, ki javlja odprto, nagnjeno ali zaprto",
    h_zoom: "Gumb zgoraj desno, ki preklopi z mini kartice na celotno in nazaj",
    h_include_covers: "Senčila razredov garaža in vrata dvorišča, narisana brez upravljanja",
  },
  lv: {
    openings: "Atveres",
    journal: "Žurnāls",
    tabs: "Skati",
    s_open: "Atvērts",
    s_tilted: "Atgāzts",
    s_closed: "Aizvērts",
    s_locked: "Aizslēgts",
    s_unlocked: "Atslēgts",
    s_jammed: "Iestrēdzis",
    s_unavailable: "Nav pieejams",
    s_unknown: "Nezināms",
    state_for: "{state} jau {d}",
    state_now: "{state} tikko",
    alert: "{state} jau {d}, virs {limit} robežas",
    dur_m: "{m} min",
    dur_h: "{h} h",
    dur_hm: "{h} h {m} min",
    dur_d: "{d} d",
    n_open: "Atvērti: {n}",
    n_alerts: "Brīdinājumi: {n}",
    one_alert: "1 brīdinājums",
    all_closed: "Viss aizvērts",
    n_tracked: "Uzraudzīti: {n}",
    k_contact: "Kontakts",
    k_handle: "Rokturis",
    k_lock: "Slēdzene",
    k_doorbell: "Durvju zvans",
    k_battery: "Baterija",
    k_heating: "Apkure",
    k_power: "Jauda",
    k_breakers: "Drošinātāji",
    k_pet: "Mājdzīvnieks",
    v_off: "Izsl.",
    v_on: "Iesl.",
    v_paused: "Pauzēts",
    v_inside: "Iekšā",
    v_outside: "Ārā",
    v_armed: "{on}/{n} iesl.",
    v_tripped: "Nostrādājuši: {n}",
    today: "Šodien",
    n_openings: "Atvēršanas: {n} · kopā {d}",
    one_opening: "1 atvēršana · kopā {d}",
    no_opening: "Šodien nav atvērts",
    longest: "Garākā atvēršana",
    last: "Pēdējā atvēršana",
    ago: "pirms {d}",
    lock: "Aizslēgt",
    unlock: "Atslēgt",
    unlatch: "Atvērt",
    history: "Vēsture",
    cancel: "Atcelt",
    confirm_unlock: "Atslēgt {name}?",
    confirm_unlatch: "Atvērt {name}?",
    f_all: "Visas",
    f_open: "Atvērtās",
    f_unlocked: "Atslēgtās",
    f_alert: "Brīdinājumi",
    read_only: "tikai lasīšana",
    nothing: "Nav ko ziņot",
    zoom_in: "Rādīt pilno karti",
    zoom_out: "Atpakaļ uz kompakto skatu",
    not_found: "Entītija nav atrasta: {entity}",
    no_entity: "Izvēlieties durvju vai loga sensoru.",
    none_found: "Nav atrastas durvis vai logi.",
    y_entry: "Ārdurvis",
    y_interior: "Iekšdurvis",
    y_french_single: "Balkona durvis",
    y_french: "Divviru balkona durvis",
    y_sliding: "Bīdāmās durvis",
    y_wicket: "Vārtiņi",
    y_pet: "Kaķu durtiņas",
    y_trapdoor: "Lūka",
    y_window: "Logs",
    y_window_double: "Divviru logs",
    y_window_tilt: "Grozāmi atgāžams logs",
    y_window_sliding: "Bīdāmais logs",
    y_hopper: "Atgāžams logs",
    y_electrical_panel: "Elektrības sadalne",
    y_garage: "Garāžas vārti",
    y_gate: "Vārti",
    e_entity: "Durvju vai loga sensors",
    e_entities: "Durvis un logi",
    e_name: "Nosaukums (neobligāts)",
    e_title: "Virsraksts (neobligāts)",
    e_opening_type: "Atveres veids",
    type_auto: "Automātiski (klase un nosaukums)",
    e_lock: "Slēdzene",
    e_doorbell: "Durvju zvans",
    e_battery: "Baterija",
    e_handle: "Loga rokturis",
    e_climate: "Apkure",
    e_power: "Jauda",
    e_pet: "Mājdzīvnieka klātbūtne",
    e_open_alert: "Brīdinājums pēc (min)",
    e_show_history: "Rādīt šodienas laika joslu",
    e_confirm: "Jautāt pirms atslēgšanas",
    e_zoom: "Detaļu poga",
    e_include_covers: "Garāžas vārti un vārti (tikai lasīšana)",
    e_show_journal: "Cilne Žurnāls",
    e_illustration_theme: "Ilustrācijas tēma",
    theme_auto: "Automātiski: nakts ar tumšu tēmu, diena ar gaišu",
    theme_day: "Diena",
    theme_night: "Nakts",
    e_language: "Valoda",
    lang_auto: "Automātiski",
    h_entities: "Tukšs: visi durvju, logu un atveres sensori",
    h_open_alert: "Ilgāk atvērts kļūst sarkans; 0 izslēdz brīdinājumu",
    h_battery: "Tukšs: sensora ierīces baterija",
    h_handle: "Sensors, kas ziņo atvērts, atgāzts vai aizvērts",
    h_zoom: "Poga augšējā labajā stūrī, kas pārslēdz no mini kartes uz pilno un atpakaļ",
    h_include_covers: "Garāžas un vārtu klases pārsegi, zīmēti bez vadības",
  },
  el: {
    openings: "Ανοίγματα",
    journal: "Ημερολόγιο",
    tabs: "Προβολές",
    s_open: "Ανοιχτό",
    s_tilted: "Σε ανάκλιση",
    s_closed: "Κλειστό",
    s_locked: "Κλειδωμένο",
    s_unlocked: "Ξεκλείδωτο",
    s_jammed: "Μπλοκαρισμένο",
    s_unavailable: "Μη διαθέσιμο",
    s_unknown: "Άγνωστο",
    state_for: "{state} εδώ και {d}",
    state_now: "{state} μόλις τώρα",
    alert: "{state} εδώ και {d}, πάνω από το όριο των {limit}",
    dur_m: "{m} λ",
    dur_h: "{h} ώ",
    dur_hm: "{h} ώ {m} λ",
    dur_d: "{d} ημ",
    n_open: "Ανοιχτά: {n}",
    n_alerts: "Ειδοποιήσεις: {n}",
    one_alert: "1 ειδοποίηση",
    all_closed: "Όλα κλειστά",
    n_tracked: "Παρακολουθούνται: {n}",
    k_contact: "Επαφή",
    k_handle: "Χερούλι",
    k_lock: "Κλειδαριά",
    k_doorbell: "Κουδούνι",
    k_battery: "Μπαταρία",
    k_heating: "Θέρμανση",
    k_power: "Ισχύς",
    k_breakers: "Ασφάλειες",
    k_pet: "Κατοικίδιο",
    v_off: "Σβηστό",
    v_on: "Αναμμένο",
    v_paused: "Σε παύση",
    v_inside: "Μέσα",
    v_outside: "Έξω",
    v_armed: "{on}/{n} οπλισμένες",
    v_tripped: "Έπεσαν: {n}",
    today: "Σήμερα",
    n_openings: "Ανοίγματα: {n} · σύνολο {d}",
    one_opening: "1 άνοιγμα · σύνολο {d}",
    no_opening: "Κανένα άνοιγμα σήμερα",
    longest: "Μεγαλύτερο άνοιγμα",
    last: "Τελευταίο άνοιγμα",
    ago: "πριν από {d}",
    lock: "Κλείδωμα",
    unlock: "Ξεκλείδωμα",
    unlatch: "Άνοιγμα",
    history: "Ιστορικό",
    cancel: "Ακύρωση",
    confirm_unlock: "Ξεκλείδωμα: {name};",
    confirm_unlatch: "Άνοιγμα: {name};",
    f_all: "Όλα",
    f_open: "Ανοιχτά",
    f_unlocked: "Ξεκλείδωτα",
    f_alert: "Ειδοποιήσεις",
    read_only: "μόνο ανάγνωση",
    nothing: "Τίποτα προς αναφορά",
    zoom_in: "Εμφάνιση πλήρους κάρτας",
    zoom_out: "Επιστροφή στη συμπαγή προβολή",
    not_found: "Η οντότητα δεν βρέθηκε: {entity}",
    no_entity: "Επιλέξτε αισθητήρα πόρτας ή παραθύρου.",
    none_found: "Δεν βρέθηκε πόρτα ή παράθυρο.",
    y_entry: "Εξώπορτα",
    y_interior: "Εσωτερική πόρτα",
    y_french_single: "Μπαλκονόπορτα",
    y_french: "Δίφυλλη μπαλκονόπορτα",
    y_sliding: "Συρόμενη πόρτα",
    y_wicket: "Πορτάκι κήπου",
    y_pet: "Πορτάκι γάτας",
    y_trapdoor: "Καταπακτή",
    y_window: "Παράθυρο",
    y_window_double: "Δίφυλλο παράθυρο",
    y_window_tilt: "Ανοιγοανακλινόμενο παράθυρο",
    y_window_sliding: "Συρόμενο παράθυρο",
    y_hopper: "Ανακλινόμενο παράθυρο",
    y_electrical_panel: "Ηλεκτρικός πίνακας",
    y_garage: "Γκαραζόπορτα",
    y_gate: "Αυλόπορτα",
    e_entity: "Αισθητήρας πόρτας ή παραθύρου",
    e_entities: "Πόρτες και παράθυρα",
    e_name: "Όνομα (προαιρετικό)",
    e_title: "Τίτλος (προαιρετικός)",
    e_opening_type: "Τύπος ανοίγματος",
    type_auto: "Αυτόματα (κλάση και όνομα)",
    e_lock: "Κλειδαριά",
    e_doorbell: "Κουδούνι",
    e_battery: "Μπαταρία",
    e_handle: "Χερούλι παραθύρου",
    e_climate: "Θέρμανση",
    e_power: "Ισχύς",
    e_pet: "Παρουσία κατοικιδίου",
    e_open_alert: "Ειδοποίηση μετά από (λ)",
    e_show_history: "Εμφάνιση της σημερινής χρονογραμμής",
    e_confirm: "Ερώτηση πριν το ξεκλείδωμα",
    e_zoom: "Κουμπί λεπτομερειών",
    e_include_covers: "Γκαραζόπορτες και αυλόπορτες (μόνο ανάγνωση)",
    e_show_journal: "Καρτέλα Ημερολόγιο",
    e_illustration_theme: "Θέμα εικόνας",
    theme_auto: "Αυτόματα: νύχτα με σκοτεινό θέμα, μέρα με φωτεινό",
    theme_day: "Μέρα",
    theme_night: "Νύχτα",
    e_language: "Γλώσσα",
    lang_auto: "Αυτόματα",
    h_entities: "Κενό: όλοι οι αισθητήρες πόρτας, παραθύρου και ανοίγματος",
    h_open_alert: "Ανοιχτό περισσότερο γίνεται κόκκινο· το 0 απενεργοποιεί την ειδοποίηση",
    h_battery: "Κενό: η μπαταρία της συσκευής του αισθητήρα",
    h_handle: "Αισθητήρας που αναφέρει ανοιχτό, σε ανάκλιση ή κλειστό",
    h_zoom: "Κουμπί πάνω δεξιά που περνά από τη μίνι κάρτα στην πλήρη και πίσω",
    h_include_covers: "Καλύμματα των κλάσεων γκαράζ και αυλόπορτα, σχεδιασμένα χωρίς τα χειριστήριά τους",
  },
};

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl: the card's language option, else Home Assistant's full locale when its base matches.
const intlLocale = (hass, config) => {
  const l = lang(hass, config);
  const src = config?.language || (hass && (hass.locale?.language || hass.language)) || "";
  const out = src && src.split("-")[0] === l.split("-")[0] ? src : l;
  return out === "pt" ? "pt-PT" : out;
};

const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

// Words a window handle (a sensor) reports for a tilted window, and for open and closed.
const TILT_WORDS = new Set(["tilt", "tilted", "kipp", "gekippt", "ajar", "vent", "incliné", "basculé", "bascule"]);
const OPEN_WORDS = new Set(["on", "open", "opened", "opening", "closing", "offen", "ouvert", "home_open"]);
const CLOSED_WORDS = new Set(["off", "closed", "close", "geschlossen", "fermé", "ferme"]);

// Where an opening stands: open, tilt, closed, unavailable, unknown, or missing (no such entity).
const posOf = (s) => {
  if (!s) return "missing";
  const st = String(s.state).toLowerCase();
  if (st === "unavailable") return "unavailable";
  if (TILT_WORDS.has(st)) return "tilt";
  if (OPEN_WORDS.has(st)) return "open";
  if (CLOSED_WORDS.has(st)) return "closed";
  return "unknown";
};
const isAjar = (pos) => pos === "open" || pos === "tilt";

// A lock as the card shows it: locked, unlocked, jammed or unavailable.
const lockOf = (ls) => {
  if (!ls) return null;
  if (ls.state === "unavailable" || ls.state === "unknown") return "unavailable";
  if (ls.state === "jammed") return "jammed";
  return ls.state === "locked" || ls.state === "locking" ? "locked" : "unlocked";
};
// lock.open (unlatch) is in supported_features bit 1.
const canUnlatch = (ls) => ((Number(ls?.attributes?.supported_features) || 0) & 1) === 1;

const minutesSince = (iso, now) => {
  const at = Date.parse(iso);
  return Number.isFinite(at) ? Math.max(0, (now - at) / 60000) : 0;
};

// Entities of the sensor's own device that the card uses on their own: its battery and its lock (a smart lock's
// door sensor, a window with a locking handle). The registry is indexed once per registry object; whether a sensor
// is a battery is read from its current state at each lookup, so a sensor whose state comes in late is still found.
const _related = new WeakMap();
const relatedOf = (hass, id, kind) => {
  const reg = hass?.entities;
  if (!reg) return null;
  let map = _related.get(reg);
  if (!map) {
    map = { sensors: {}, lock: {} };
    for (const e of Object.values(reg)) {
      if (!e.device_id) continue;
      if (e.entity_id.startsWith("sensor.")) (map.sensors[e.device_id] ||= []).push(e.entity_id);
      if (e.entity_id.startsWith("lock.")) map.lock[e.device_id] ??= e.entity_id;
    }
    _related.set(reg, map);
  }
  const dev = reg[id]?.device_id;
  if (!dev) return null;
  if (kind === "lock") return map.lock[dev] || null;
  return (map.sensors[dev] || []).find((s) => hass.states[s]?.attributes?.device_class === "battery") || null;
};

const OPTION_KEYS = ["lock", "doorbell", "battery", "handle", "climate", "power", "pet", "breakers", "open_alert"];

// One opening as the cards show it, from its entry in the config (a string or an object) and the card's options.
const itemOf = (hass, entry, card = {}) => {
  const conf = typeof entry === "string" ? { entity: entry } : entry || {};
  const o = { ...Object.fromEntries(OPTION_KEYS.map((k) => [k, card[k]])), ...conf };
  const id = conf.entity;
  const s = hass?.states?.[id];
  const hs = o.handle ? hass.states[o.handle] : null;
  let pos = posOf(s);
  // A handle tells a tilted window from an open one; the contact still tells closed from open.
  if (hs && pos !== "unavailable" && pos !== "missing" && posOf(hs) === "tilt") pos = "tilt";
  // An option set to false turns the device's own entity off; unset, the device's own one is used.
  const own = (k) => (o[k] === false ? null : o[k] || relatedOf(hass, id, k));
  const lockId = own("lock");
  const ls = lockId ? hass.states[lockId] : null;
  const alert = Number(o.open_alert ?? 10);
  return {
    id,
    s,
    type: typeOf(id, s, conf.opening_type ?? card.opening_type),
    pos,
    name: conf.name || s?.attributes?.friendly_name || id,
    since: pos === "tilt" && hs ? hs.last_changed : s?.last_changed,
    lock: lockId,
    ls,
    lockState: lockOf(ls),
    lockSince: ls?.last_changed,
    handle: o.handle || null,
    doorbell: o.doorbell || null,
    battery: own("battery"),
    climate: o.climate || null,
    power: o.power || null,
    pet: o.pet || null,
    breakers: Array.isArray(o.breakers) ? o.breakers : [],
    alertMin: Number.isFinite(alert) ? alert : 10,
    readOnly: String(id).startsWith("cover."),
  };
};

// The status of an opening: its color class, its state word, whether it is an alert and since when.
const statusOf = (it, now = Date.now()) => {
  if (it.pos === "missing" || it.pos === "unavailable") return { cls: "crit", key: "s_unavailable", min: 0 };
  if (it.lockState === "jammed") return { cls: "crit", key: "s_jammed", min: 0 };
  const min = minutesSince(it.since, now);
  if (isAjar(it.pos)) {
    const alert = it.alertMin > 0 && min >= it.alertMin;
    return { cls: alert ? "crit" : "active", key: it.pos === "tilt" ? "s_tilted" : "s_open", alert, min };
  }
  if (it.pos === "closed") {
    // Locked or unlocked: since the lock changed, not the contact (a door closed at 8:00 and locked at 11:58).
    const lmin = it.lockSince ? minutesSince(it.lockSince, now) : min;
    if (it.lockState === "unlocked") return { cls: "warn", key: "s_unlocked", min: lmin };
    if (it.lockState === "locked") return { cls: "ok", key: "s_locked", min: lmin };
    return { cls: "ok", key: "s_closed", min };
  }
  return { cls: "idle", key: "s_unknown", min: 0 };
};

// Overview order: alerts first, then what is open, unlocked, and the rest, by name.
const RANK = { crit: 0, active: 1, warn: 2, idle: 3, ok: 4 };
const byStatus = (a, b) => RANK[a.st.cls] - RANK[b.st.cls] || a.name.localeCompare(b.name);

// Every door, window and opening sensor (and the garage doors and gates, read only), hidden ones aside.
const OPENING_CLASSES = new Set(["door", "window", "opening", "garage_door"]);
const autoEntities = (hass, includeCovers = true) =>
  Object.values(hass?.states || {})
    .filter((s) => {
      const [domain] = s.entity_id.split(".");
      const reg = hass.entities?.[s.entity_id];
      if (reg?.hidden || reg?.disabled_by || reg?.entity_category) return false;
      const dc = s.attributes?.device_class;
      if (domain === "binary_sensor") return OPENING_CLASSES.has(dc);
      return includeCovers && domain === "cover" && (dc === "garage" || dc === "gate");
    })
    .map((s) => s.entity_id)
    .sort();

// ---------------------------------------------------------------------------
// Durations, times and today's history
// ---------------------------------------------------------------------------

const startOfDay = (now) => new Date(now).setHours(0, 0, 0, 0);

const TIME_FMT = {};
const fmtTime = (ms, locale) => {
  TIME_FMT[locale] ??= new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" });
  return TIME_FMT[locale].format(new Date(ms));
};
// The state changes of an entity, from Home Assistant's history (compressed or full rows), as { s, t } in ms.
const changesOf = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((r) => {
      const at = r.lc ?? r.lu;
      return { s: r.s ?? r.state, t: at != null ? at * 1000 : Date.parse(r.last_changed ?? r.last_updated) };
    })
    .filter((c) => Number.isFinite(c.t));

// The spans of a day (start → end) where `on(state)` held, from the history rows plus the current state.
const spansOf = (rows, current, start, end, on) => {
  const list = changesOf(rows);
  const cur = current && Date.parse(current.last_changed);
  if (current && Number.isFinite(cur) && (!list.length || cur > list.at(-1).t)) list.push({ s: current.state, t: cur });
  const out = [];
  let from = null;
  for (const c of list) {
    const at = Math.max(start, Math.min(end, c.t));
    if (on(c.s)) from ??= at;
    else if (from !== null) {
      out.push([from, at]);
      from = null;
    }
  }
  if (from !== null) out.push([from, end]);
  return out.filter(([a, b]) => b > a);
};
const contactOn = (state) => isAjar(posOf({ state }));
const lockOn = (state) => lockOf({ state }) === "unlocked";

// Count (openings started today), total open time and the spans, for one opening.
const dayOf = (hist, it, start, now) => {
  const spans = hist ? spansOf(hist[it.id], it.s, start, now, contactOn) : [];
  const unlocked = hist && it.lock ? spansOf(hist[it.lock], it.ls, start, now, lockOn) : [];
  return {
    spans,
    unlocked,
    count: spans.filter(([a]) => a > start).length,
    total: spans.reduce((sum, [a, b]) => sum + (b - a), 0) / 60000,
  };
};

// ---------------------------------------------------------------------------
// Illustrations: one SVG per opening type, 120 × 84, standing on the ground line (y 84)
// ---------------------------------------------------------------------------

// Parts that move: a leaf swinging on a hinge (scaleX from its edge), a panel sliding (translateX), a flap or a
// door lifting (scaleY). Their pivot and travel are CSS variables, so the open state is a class on the picture.
const sx = (x, s, inner, cls = "") => `<g class="sx ${cls}" style="--o:${x}px 50px;--s:${s}">${inner}</g>`;
const sy = (y, s, inner, cls = "") => `<g class="sy ${cls}" style="--o:60px ${y}px;--s:${s}">${inner}</g>`;
const tx = (d, inner) => `<g class="tx" style="--d:${d}px">${inner}</g>`;
const r = (cls, x, y, w, h, extra = "") => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}"${extra}/>`;
const bars = (xs, y1, y2) => xs.map((x) => `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/>`).join("");

// A door leaf of wood with its two panels and knob, a glazed leaf, a window sash.
const woodLeaf = (x, w) =>
  `${r("wd", x, 20, w, 64)}${r("wdl", x + 5, 26, w - 10, 22)}${r("wdl", x + 5, 54, w - 10, 24)}<circle class="knob" cx="${x + w - 6}" cy="54" r="2"/>`;
const glassLeaf = (x, w, handle) =>
  `${r("lt", x, 18, w, 66)}${r("gl", x + 4, 22, w - 8, 56)}<line class="bar" x1="${x + 4}" y1="50" x2="${x + w - 4}" y2="50"/>${handle ? r("hdl", handle, 46, 2, 8) : ""}`;
const sash = (x, y, w, h, handle) => `${r("gl sf", x, y, w, h)}${handle ? r("hdl", handle, y + h / 2 - 4, 2, 8, ' rx="1"') : ""}`;
const wall = (x = 14, w = 92) => r("wl", x, 8, w, 76);
const sill = (x, y, w) => r("sill", x, y, w, 3);
const panelLeds = (rows) =>
  rows
    .map(([y, n]) =>
      Array.from({ length: n }, (_, i) => `${r("brk", 41 + i * 6, y + 1.5, 5, 10)}${r(`led${i === n - 1 && y > 50 ? " last" : ""}`, 42.5 + i * 6, y + 3, 2, 3)}`).join(""),
    )
    .join("");

const SCENES = {
  entry: () =>
    `${wall(20, 80)}${r("trim", 38, 14, 44, 6)}${r("in", 42, 20, 36, 64)}${sx(42, 0.22, woodLeaf(42, 36))}${r("mt", 84, 46, 6, 10, ' rx="1.5"')}${r("trim", 36, 82, 48, 2)}`,
  interior: () =>
    `${wall(20, 80)}${r("fr", 39, 17, 42, 67)}${r("in", 42, 20, 36, 64)}${sx(42, 0.22, `${r("lt", 42, 20, 36, 64)}${r("hdl", 69, 51, 7, 2.5, ' rx="1"')}`)}`,
  french_single: () => `${wall(20, 80)}${r("in", 42, 18, 36, 66)}${sx(42, 0.22, glassLeaf(42, 36, 75))}`,
  french: () => `${wall()}${r("in", 34, 18, 52, 66)}${sx(34, 0.25, glassLeaf(34, 26))}${sx(86, 0.25, glassLeaf(60, 26, 61.5))}`,
  sliding: () =>
    `${wall(8, 104)}${r("al", 20, 20, 80, 64)}${r("in", 23, 23, 74, 61)}${r("gl2", 60, 23, 37, 61)}${tx(33, `${r("gl alf", 23, 23, 37, 61)}${r("al", 54, 48, 2.5, 11)}`)}`,
  wicket: () =>
    `${r("hg", 0, 48, 38, 36, ' rx="10"')}${r("hg", 82, 48, 38, 36, ' rx="10"')}${r("post", 38, 42, 6, 42)}${r("post", 76, 42, 6, 42)}${sx(44, 0.25, `<g class="iron">${r("", 45, 50, 30, 30)}${bars([52, 60, 68], 50, 80)}</g>`, "sw")}`,
  pet: () =>
    `${wall(20, 80)}${r("wd", 42, 20, 36, 64)}${r("wdl", 47, 26, 26, 26)}<circle class="knob" cx="72" cy="52" r="2"/>${r("wdd", 51, 63, 18, 16, ' rx="3"')}${r("in", 52, 64, 16, 14, ' rx="2"')}${sy(64, 0.2, r("flap", 52, 64, 16, 14, ' rx="2"'), "sw")}`,
  trapdoor: () => `${r("slab", 10, 76, 100, 8)}${r("in", 34, 76, 52, 8)}${sy(76, -3.6, `${r("wd wdo", 34, 76, 52, 8)}${r("knobr", 56, 78.5, 8, 2, ' rx="1"')}`)}`,
  window: () => `${wall()}${r("wf", 40, 22, 40, 44)}${r("gin", 43, 25, 34, 38)}${sx(43, 0.22, sash(43, 25, 34, 38, 72))}${sill(37, 66, 46)}`,
  window_double: () =>
    `${wall()}${r("wf", 33, 21, 54, 46)}${r("gin", 36, 24, 48, 40)}${sx(36, 0.25, sash(36, 24, 24, 40))}${sx(84, 0.25, sash(60, 24, 24, 40, 62))}${sill(30, 67, 60)}`,
  window_tilt: () =>
    `${wall()}${r("wf", 40, 22, 40, 44)}${r("gin", 43, 25, 34, 38)}${sx(43, 0.22, `<g class="tl" style="--o:60px 63px">${sash(43, 25, 34, 38)}<rect class="hdl hd" x="72" y="36" width="2" height="8" rx="1"/></g>`)}${sill(37, 66, 46)}`,
  window_sliding: () =>
    `${wall()}${r("al", 27, 24, 66, 42)}${r("gin", 30, 27, 60, 36)}${r("gl2", 60, 27, 30, 36)}${tx(29, `${r("gl alf", 30, 27, 30, 36)}${r("al", 55, 41, 2, 8)}`)}${sill(24, 66, 72)}`,
  hopper: () => `${wall()}${r("wf", 42, 18, 36, 26)}${r("gin", 45, 21, 30, 20)}${sy(41, 0.55, `${r("gl sf", 45, 21, 30, 20)}${r("hdl", 56, 23, 8, 2, ' rx="1"')}`)}${sill(39, 44, 42)}`,
  electrical_panel: () =>
    `${wall()}${r("pbox", 33, 13, 54, 62, ' rx="3"')}${r("pin", 36, 16, 48, 56, ' rx="2"')}${r("prow", 39, 20, 42, 13, ' rx="1"')}${r("prow", 39, 37, 42, 13, ' rx="1"')}${r("prow", 39, 54, 42, 13, ' rx="1"')}${panelLeds(
      [
        [20, 6],
        [37, 6],
        [54, 4],
      ],
    )}${sx(36, 0.16, `${r("pdoor", 36, 16, 48, 56, ' rx="2"')}${r("pdoor2", 42, 22, 36, 44, ' rx="2"')}<path class="bolt" d="M62 30l-8 11h5l-2 9 8-12h-5z"/>${r("hdl", 79, 40, 2.5, 8, ' rx="1"')}`)}`,
  garage: () =>
    `${r("wl", 6, 14, 108, 70)}${r("trim", 14, 25, 92, 5)}${r("gdark", 18, 30, 84, 54)}${sy(30, 0.1, `${r("gp", 18, 30, 84, 54)}<g class="gpl">${[43, 57, 70].map((y) => `<line x1="18" y1="${y}" x2="102" y2="${y}"/>`).join("")}</g>`, "lift")}`,
  gate: () =>
    `${r("post", 10, 34, 8, 50)}${r("post", 102, 34, 8, 50)}${sx(18, 0.18, `<g class="iron">${r("", 19, 44, 41, 36)}${bars([26, 33, 40, 47, 54], 44, 80)}</g>`)}${sx(102, 0.18, `<g class="iron">${r("", 60, 44, 41, 36)}${bars([66, 73, 80, 87, 94], 44, 80)}</g>`)}`,
};

// The picture of an opening: its type, its position as a class (open, tilt, closed) and, when it is open, a slow
// sway of the leaf. `tripped` lights a breaker red on an electrical panel.
// `crop` frames the opening itself (a thumbnail), without the facade around it.
const openingSvg = (type, pos, { tripped = false, crop = false } = {}) =>
  `<svg class="op op-${type} ${pos}${isAjar(pos) ? " sway" : ""}${tripped ? " tripped" : ""}" viewBox="${crop ? "12 10 96 74" : "0 0 120 84"}" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">${(SCENES[type] || SCENES.entry)()}</svg>`;

// Colors of the pictures, day and night (the `.night` class on an ancestor).
const SCENE_STYLE = `
  .op { --wall: #e9dccb; --trim: #cfc4b4; --wood: #9a6a3a; --wood-d: #7d5430; --in-off: #2b2118; --in-on: #f2cf86;
        --glass: #bcd6ea; --glass2: #cfe2f1; --light: #f4f1ea; --light-d: #c9c1b3; --alu: #4a5260; --metal: #8a8f99;
        --iron: #3d4450; --hedge: #5f9e58; --slab: #c9bfae; --garage: #d5d9df; --garage-d: #b3b9c2; --gdark: #2b2f36;
        display: block; width: 100%; height: 100%; overflow: visible; }
  .night .op { --wall: #3a3640; --trim: #4a4550; --wood: #6f4c2a; --wood-d: #57391f; --in-off: #121016; --in-on: #ffc95a;
               --glass: #3b5068; --glass2: #4a6380; --light: #b8b2a8; --light-d: #6d685f; --alu: #2a3039; --metal: #6b7079;
               --iron: #1d2128; --hedge: #335a3a; --slab: #5a544b; --garage: #8b9098; --garage-d: #6b7079; --gdark: #15181d; }
  .op .wl { fill: none; } .op .trim, .op .sill { fill: var(--trim); } .op .fr { fill: color-mix(in srgb, var(--light-d) 55%, var(--wall)); }
  .op .in { fill: var(--in-off); transition: fill .6s ease; } .op.open .in, .op.tilt .in { fill: var(--in-on); }
  .op .gin { fill: var(--glass); transition: fill .6s ease; } .op.open .gin, .op.tilt .gin { fill: var(--in-on); }
  .op .wd { fill: var(--wood); } .op .wdl { fill: none; stroke: var(--wood-d); stroke-width: 1.5; } .op .wdd { fill: var(--wood-d); }
  .op .wdo { stroke: var(--wood-d); stroke-width: 1; }
  .op .knob, .op .knobr { fill: #e2c07a; } .op .mt, .op .hdl { fill: var(--metal); }
  .op .lt { fill: var(--light); stroke: var(--light-d); stroke-width: 1; } .op .gl { fill: var(--glass); } .op .bar { stroke: var(--light); stroke-width: 2; }
  .op .gl2 { fill: var(--glass); stroke: var(--alu); stroke-width: 2; } .op .alf { fill: var(--glass2); stroke: var(--alu); stroke-width: 2; }
  .op .al { fill: var(--alu); } .op .sf { stroke: var(--light-d); stroke-width: 2; fill: var(--glass2); }
  .op .wf { fill: var(--light); }
  .op .hg { fill: var(--hedge); } .op .post { fill: var(--metal); }
  .op .iron { fill: none; stroke: var(--iron); stroke-width: 2; }
  .op .flap { fill: #c9b79b; stroke: #6e4b2a; stroke-width: 1; } .op .slab { fill: var(--slab); }
  .op .pbox { fill: var(--light); stroke: var(--light-d); stroke-width: 1.5; } .op .pin { fill: #3b4250; } .op .prow { fill: #d9dce1; }
  .op .brk { fill: #fff; stroke: #9aa1ab; stroke-width: .6; } .op .led { fill: #15803d; } .op.tripped .led.last { fill: #dc2626; }
  .op .pdoor { fill: #e9ebee; stroke: #c9ccd2; stroke-width: 1; } .op .pdoor2 { fill: #dfe2e6; } .op .bolt { fill: #b45309; }
  .night .op .pdoor { fill: #9a9ea6; } .night .op .pdoor2 { fill: #8e939b; }
  .op .gdark { fill: var(--gdark); } .op .gp { fill: var(--garage); } .op .gpl { stroke: var(--garage-d); stroke-width: 1.5; }
  .op .sx, .op .sy, .op .tx, .op .tl, .op .hd { transform-box: view-box; transform-origin: var(--o, 50% 50%);
        transition: transform .7s cubic-bezier(.4, 0, .2, 1); }
  .op.open .sx { transform: scaleX(var(--s)); } .op.open .sy { transform: scaleY(var(--s)); } .op.open .tx { transform: translateX(var(--d)); }
  .op.tilt .tl { transform: scaleY(.8); }
  .op .hd { --o: 73px 40px; } .op.open .hd { transform: rotate(90deg); } .op.tilt .hd { transform: rotate(180deg); }
  /* An open leaf stirs in the draught; a tilted sash and a pet flap too. A garage door stays still. The stirring
     starts once the opening transition is over (.7 s), so that the leaf is first seen swinging open. */
  .op.sway .sx:not(.lift), .op.sway .sw { animation: op-sway 3.2s ease-in-out .7s infinite alternate; }
  .op.tilt .tl { animation: op-tilt 3.2s ease-in-out .7s infinite alternate; }
  .op.sway .sy.sw { animation-name: op-flap; animation-duration: 1.6s; }
  @keyframes op-sway { from { transform: scaleX(var(--s)); } to { transform: scaleX(calc(var(--s) + .07)); } }
  @keyframes op-flap { from { transform: scaleY(var(--s)); } to { transform: scaleY(calc(var(--s) + .5)); } }
  @keyframes op-tilt { from { transform: scaleY(.8); } to { transform: scaleY(.84); } }
`;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { --oc-ok: var(--success-color, #43a047); --oc-warn: var(--warning-color, #ffa600); --oc-crit: var(--error-color, #db4437);
          --oc-idle: var(--disabled-text-color, #9e9e9e); --oc-active: var(--info-color, #039be5); --oc-accent: #9a6a3a;
          display: grid; grid-template-columns: minmax(0, 1fr); min-width: 0; --oc-natural-width: 360px; }
  /* The card is the container of its width queries: a zero-height row keeps a preferred width in a parent sized by
     its content (layout-card, an auto grid column). */
  :host::before { content: ""; width: var(--oc-natural-width); max-width: 100%; height: 0; }
  ha-card { overflow: hidden; container: oc-card / inline-size; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .ok { --c: var(--oc-ok); } .warn { --c: var(--oc-warn); } .crit { --c: var(--oc-crit); } .idle { --c: var(--oc-idle); } .active { --c: var(--oc-active); }
  /* Texts in a state color are mixed with the text color: tinted, and readable in both themes. */
  .ok, .warn, .crit, .idle, .active { --ink: color-mix(in srgb, var(--c) 45%, var(--primary-text-color, #212121)); }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c, var(--oc-ok)); flex: none; display: inline-block; }
  .crit .dot, .dot.crit { animation: oc-blink 1s ease-in-out infinite alternate; }
  @keyframes oc-blink { from { opacity: 1; } to { opacity: .3; } }
  .chip { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 12px; font-size: 12px; font-weight: 500; white-space: nowrap;
          background: color-mix(in srgb, var(--c, var(--oc-ok)) 15%, transparent); color: var(--ink, var(--c)); flex: none; line-height: 16px; }
  .warning { padding: 16px; color: color-mix(in srgb, var(--oc-warn) 45%, var(--primary-text-color, #212121)); }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid var(--divider-color, rgba(127,127,127,.2));
         cursor: pointer; font: inherit; font-size: 13px; font-weight: 500; padding: 0 12px; min-height: 40px; border-radius: 12px;
         background: var(--secondary-background-color, rgba(127,127,127,.08)); color: var(--primary-text-color); min-width: 0; }
  .btn span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .btn .icon { color: var(--oc-accent); }
  .btn:hover { background: color-mix(in srgb, var(--oc-accent) 10%, var(--secondary-background-color, rgba(127,127,127,.08))); }
  .btn.primary { background: color-mix(in srgb, var(--oc-accent) 14%, transparent); }
  .btn:focus-visible, [role="button"]:focus-visible, [role="tab"]:focus-visible { outline: 2px solid var(--oc-accent); outline-offset: 2px; }
  [role="button"] { cursor: pointer; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
`;

// The illustrated banner, 90 px, as on the other ha-* cards: a facade, the opening's own picture on the right
// standing on a 10 px pavement strip, the round state icon and the titles on the left.
const BANNER_STYLE = `
  .banner { --bh: 90px; --g: 10px; --wall: #e9dccb; --siding: #dccab2; --ink-b: #3a2f24; --muted-b: #6e5c49; --pave: #9aa1a9; --pave-top: #b5bbc2;
            position: relative; height: var(--bh); overflow: hidden; display: flex; align-items: stretch; background: var(--wall); color: var(--ink-b); }
  .banner.night { --wall: #3a3640; --siding: #433e4a; --ink-b: #fff; --muted-b: rgba(255,255,255,.76); --pave: #2c323b; --pave-top: #3a414b; }
  .siding { position: absolute; inset: 0 0 var(--g) 0; pointer-events: none;
            background: repeating-linear-gradient(180deg, transparent 0 7px, var(--siding) 7px 8px);
            -webkit-mask-image: linear-gradient(90deg, transparent 35%, #000 60%); mask-image: linear-gradient(90deg, transparent 35%, #000 60%); }
  .ground { position: absolute; left: 0; right: 0; bottom: 0; height: var(--g); background: var(--pave); box-shadow: inset 0 2px 0 var(--pave-top); }
  .htext { position: relative; z-index: 1; flex: 1 1 auto; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 0 8px var(--g) 14px; }
  .titles { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 3px; }
  /* The pill follows the title on its row while both fit, else it wraps under it (the title then keeps the row). */
  .trow { display: flex; flex-wrap: wrap; align-items: center; gap: 3px 8px; min-width: 0; max-width: 100%; }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; max-width: 100%; }
  .bsub { font-size: 12px; line-height: 1.3; color: var(--muted-b); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .banner .chip { background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.8)); color: color-mix(in srgb, var(--c) 50%, #1d1a16); }
  .banner.night .chip { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #fff); }
  /* The round icon: the state's color, day and night; it pulses during an alert. */
  .badge { width: 40px; height: 40px; border-radius: 50%; flex: none; display: grid; place-items: center; position: relative;
           color: color-mix(in srgb, var(--c) 82%, #000); background: rgba(255,255,255,.66); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 30%, transparent); }
  .badge .icon { width: 24px; height: 24px; }
  .banner.night .badge { color: color-mix(in srgb, var(--c) 78%, #fff); background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
  .badge.crit::after { content: ""; position: absolute; inset: -3px; border-radius: 50%; border: 2px solid var(--c); animation: oc-ring 1.4s ease-out infinite; }
  @keyframes oc-ring { from { transform: scale(.9); opacity: .9; } to { transform: scale(1.35); opacity: 0; } }
  .bscene { position: relative; flex: none; display: flex; align-items: flex-end; gap: 6px; padding: 0 14px 0 4px; margin-bottom: var(--g); }
  .zoomable .bscene { padding-right: 36px; }
  .bv { width: 114px; height: 80px; flex: none; }
  .bv.small { width: 86px; height: 60px; }
  .bv .op { filter: drop-shadow(0 2px 3px rgba(0,0,0,.18)); }
  .night .bv .op { filter: drop-shadow(0 2px 3px rgba(0,0,0,.45)); }
  .banner .zoom { all: unset; position: absolute; z-index: 2; top: 6px; right: 6px; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
                  cursor: pointer; color: #3a2f24; background: rgba(255,255,255,.6); box-shadow: inset 0 0 0 1px rgba(255,255,255,.75); backdrop-filter: blur(4px); }
  .banner .zoom .icon { width: 16px; height: 16px; }
  .banner .zoom:hover { background: rgba(255,255,255,.8); }
  .banner .zoom:focus-visible { outline: 2px solid var(--oc-accent); outline-offset: 1px; }
  .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .bclick { cursor: pointer; }
  /* Narrower card: fewer pictures, then none. */
  @container oc-card (max-width: 379px) { .bv:nth-of-type(n + 2) { display: none; } }
  @container oc-card (max-width: 299px) { .bv { width: 86px; height: 60px; } }
  @container oc-card (max-width: 219px) { .bscene { display: none; } .zoomable .htext { padding-right: 38px; } }
`;

const DIALOG_STYLE = `
  ha-card.dialog-open { position: relative; min-height: 160px; }
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center;
              padding-top: 12px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
  .modal { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(92%, 340px); box-sizing: border-box;
           border-radius: 14px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.4); display: flex; flex-direction: column; gap: 12px; }
  .modal .msg { font-size: 14px; line-height: 1.4; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
`;

const BODY_STYLE = `
  .content { padding: 14px 14px 16px; display: flex; flex-direction: column; gap: 14px; }
  .alertline { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; font-size: 13px; font-weight: 500;
               background: color-mix(in srgb, var(--oc-crit) 12%, transparent); color: var(--ink); }
  .alertline .icon { color: var(--oc-crit); }
  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(88px, 1fr)); gap: 8px; }
  .tile { position: relative; min-width: 0; border-radius: 14px; padding: 10px; display: flex; flex-direction: column; gap: 8px;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .tile .dot { position: absolute; top: 10px; right: 10px; }
  .tile .ti { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .tile .k { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tile .v { font-size: 12px; font-weight: 500; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .day { display: flex; flex-direction: column; gap: 6px; }
  .dayhead { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; }
  .dayhead b { font-weight: 600; } .dayhead span { color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bar { position: relative; height: 12px; border-radius: 6px; overflow: hidden; background: color-mix(in srgb, var(--primary-text-color, #212121) 10%, transparent); }
  .bar.thin { height: 10px; }
  .bar .seg { position: absolute; top: 0; bottom: 0; border-radius: 3px; background: var(--oc-active); min-width: 2px; }
  .bar .seg.crit { background: var(--oc-crit); }
  .bar .seg.unl { background: color-mix(in srgb, var(--oc-warn) 45%, transparent); }
  .bar .now { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--primary-text-color, #212121); opacity: .55; }
  .axis { display: flex; justify-content: space-between; font-size: 11px; color: var(--secondary-text-color); }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .actions .btn { flex: 1 1 0; }
  @container oc-card (max-width: 300px) { .actions .btn span { display: none; } }
`;

const LIST_STYLE = `
  .tabs { display: flex; gap: 6px; padding: 12px 14px 0; }
  .tab { all: unset; cursor: pointer; padding: 6px 14px; border-radius: 16px; font-size: 13px; font-weight: 500; color: var(--secondary-text-color);
         border: 1px solid var(--divider-color, rgba(127,127,127,.2)); }
  .tab[aria-selected="true"] { color: var(--primary-text-color); background: color-mix(in srgb, var(--oc-accent) 14%, transparent); border-color: color-mix(in srgb, var(--oc-accent) 50%, transparent); }
  .filters { display: flex; flex-wrap: wrap; gap: 6px; }
  .filter { all: unset; cursor: pointer; padding: 6px 12px; border-radius: 16px; font-size: 13px; font-weight: 500; border: 1px solid var(--divider-color, rgba(127,127,127,.2)); }
  .filter[aria-pressed="true"] { background: color-mix(in srgb, var(--c, var(--oc-accent)) 14%, transparent); border-color: var(--c, var(--oc-accent)); color: var(--ink, var(--primary-text-color)); }
  .filter:focus-visible { outline: 2px solid var(--oc-accent); outline-offset: 2px; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  @container oc-card (max-width: 340px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  .door { position: relative; display: flex; align-items: center; gap: 10px; padding: 8px 18px 8px 8px; border-radius: 14px; min-width: 0;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .door .dot { position: absolute; top: 8px; right: 8px; }
  .thumb { width: 56px; height: 44px; flex: none; border-radius: 10px; overflow: hidden; position: relative; background: #e9dccb; }
  .night .thumb, .thumb.night { background: #3a3640; }
  .thumb::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: #9aa1a9; }
  .night .thumb::after, .thumb.night::after { background: #2c323b; }
  .thumb .op { position: absolute; left: 3px; right: 3px; bottom: 4px; width: auto; height: calc(100% - 8px); }
  .thumb.sm { width: 44px; height: 34px; border-radius: 8px; }
  .dtxt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .dname { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dstate { font-size: 12px; font-weight: 500; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ro { align-self: flex-start; font-size: 10px; color: var(--secondary-text-color); background: color-mix(in srgb, var(--primary-text-color, #212121) 8%, transparent);
        border-radius: 5px; padding: 1px 5px; }
  .empty { font-size: 13px; color: var(--secondary-text-color); }
  .sums { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .sum { border-radius: 14px; padding: 10px 12px; background: var(--secondary-background-color, rgba(127,127,127,.08)); display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .sum .k { font-size: 12px; color: var(--secondary-text-color); }
  .sum b { font-size: 18px; font-weight: 600; }
  .sum .v { font-size: 12px; font-weight: 500; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rows { display: flex; flex-direction: column; gap: 10px; }
  .row { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .rbody { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
  .rhead { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; min-width: 0; }
  .rhead .dname { flex: 1 1 auto; }
  .rhead .rv { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; }
  .rhead .rv b { font-weight: 500; color: var(--ink); }
  .axis.indent { padding-left: 54px; }
`;

// ---------------------------------------------------------------------------
// Clicks elsewhere
// ---------------------------------------------------------------------------

const DIALOG_TAGS = new Set(["HA-MORE-INFO-DIALOG", "HA-DIALOG", "DIALOG"]);
const isOutside = (card, ev) => {
  const path = ev.composedPath();
  return !path.includes(card) && !path.some((n) => DIALOG_TAGS.has(n.tagName));
};
// A press and a release both outside the card count as a click elsewhere (iOS sends no click for a tap on nothing);
// keyboard clicks still go through the click event.
const watchOutside = (isOut, handler) => {
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
const morphAttrs = (cur, next) => {
  for (const a of [...cur.attributes]) if (!next.hasAttribute(a.name)) cur.removeAttribute(a.name);
  for (const a of [...next.attributes]) if (cur.getAttribute(a.name) !== a.value) cur.setAttribute(a.name, a.value);
};
// Children are matched by their entity (data-entity) when they have one, by position otherwise: a tile that moves
// in the overview (an opening turning into an alert goes first) keeps its element, its picture and its focus.
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-entity") : null);
const morphChildren = (cur, next) => {
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
const focusSpot = (el) => {
  const d = el?.dataset;
  if (!d) return null;
  // Its kind (first class: tile, door, row…, not the state ones), entity, action and value.
  const kind = String(el.className?.baseVal ?? el.className ?? "").split(" ")[0];
  return d.entity || d.action ? `${kind}|${d.entity || ""}|${d.action || ""}|${d.value || ""}` : null;
};

// Patches `root` to `html`; false when it cannot (first render, or no DOM template, as in the tests).
const morph = (root, html) => {
  if (!root.firstChild || typeof document === "undefined") return false;
  const tpl = document.createElement("template");
  if (!tpl.content) return false;
  tpl.innerHTML = html;
  morphChildren(root, tpl.content);
  return true;
};

const isNight = (hass, config) => {
  if (config?.illustration_theme === "night") return true;
  if (config?.illustration_theme === "day") return false;
  return Boolean(hass?.themes?.darkMode);
};

// How long a history fetch is kept before it is asked again. A state change asks again too, at most once a minute:
// the current states are added to the fetched history meanwhile, so the bars stay up to date between fetches.
const HISTORY_TTL = 5 * 60000;
const HISTORY_MIN_MS = 60000;
// While something is open (its "open for" and alert), and for the timeline's "now", the card redraws this often.
const TICK_MS = 30000;
// After the popup closes, clicks are ignored for this long (the second click of a double click on OK).
const CONFIRM_GUARD_MS = 400;

// ---------------------------------------------------------------------------
// Base card
// ---------------------------------------------------------------------------

class OpeningBase extends HTMLElement {
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

// ---------------------------------------------------------------------------
// opening-card: one door or window
// ---------------------------------------------------------------------------

class OpeningCard extends OpeningBase {
  static getConfigElement() {
    return document.createElement("opening-card-editor");
  }

  static getStubConfig(hass) {
    const [first] = autoEntities(hass, false);
    return first ? { entity: first } : {};
  }

  setConfig(config) {
    if (config?.entity !== undefined && typeof config.entity !== "string") throw new Error("entity must be an entity id");
    super.setConfig(config);
  }

  getGridOptions() {
    return { columns: 6, min_columns: 4, rows: "auto" };
  }

  _entries() {
    return this._config.entity ? [this._config.entity] : [];
  }

  _zoom() {
    return "";
  }

  _subtitle(it) {
    return isAjar(it.pos) || it.pos === "closed" ? this._since(it.st) : this._t(`y_${it.type}`);
  }

  _header(it) {
    return this._banner({
      title: it.name,
      sub: this._subtitle(it),
      cls: it.st.cls,
      icon: typeIcon(it.type, isAjar(it.pos)),
      pill: this._t(it.st.key),
      scenes: this._scene(it),
      zoom: this._zoom(),
      entity: it.id,
    });
  }

  _render() {
    const c = this._config;
    if (!c.entity) return this._error(this._t("no_entity"));
    const [it] = this._items();
    if (!it.s) return this._error(this._t("not_found", { entity: c.entity }));
    this._syncClock(isAjar(it.pos) || c.show_history !== false);
    return `<style>${BASE_STYLE}${SCENE_STYLE}${BANNER_STYLE}${BODY_STYLE}${DIALOG_STYLE}</style>
      <ha-card>${this._header(it)}${this._body(it)}</ha-card>`;
  }

  _body(it) {
    const alert = it.st.alert
      ? `<div class="alertline crit" role="status">${svgIcon(ICONS.alert)}<span>${esc(this._t("alert", { state: this._t(it.st.key), d: this._dur(it.st.min), limit: this._dur(it.alertMin) }))}</span></div>`
      : "";
    return `<div class="content">${alert}<div class="tiles">${this._tiles(it).join("")}</div>${this._day(it)}${this._actions(it)}</div>`;
  }

  // ---- Tiles ------------------------------------------------------------------

  _tile(key, value, cls, icon, entity) {
    return `<div class="tile ${cls}" role="button" tabindex="0" data-entity="${esc(entity)}" aria-label="${esc(`${this._t(key)}: ${value}`)}">
      <span class="dot"></span><div class="ti">${svgIcon(icon)}</div>
      <div><div class="k">${esc(this._t(key))}</div><div class="v">${esc(value)}</div></div></div>`;
  }

  _tiles(it) {
    const h = this._hass;
    const out = [];
    const ajar = isAjar(it.pos);
    const contactCls = it.st.cls === "warn" ? "ok" : it.st.alert ? "crit" : ajar ? "active" : it.st.cls === "crit" ? "crit" : "ok";
    const contactKey = it.pos === "tilt" ? "s_tilted" : ajar ? "s_open" : it.pos === "closed" ? "s_closed" : it.st.key;
    out.push(this._tile(it.handle ? "k_handle" : "k_contact", this._t(contactKey), contactCls, typeIcon(it.type, ajar), it.handle || it.id));
    if (it.ls) {
      const ls = it.lockState;
      const cls = ls === "locked" ? "ok" : ls === "unlocked" ? "warn" : "crit";
      const key = ls === "locked" ? "s_locked" : ls === "unlocked" ? "s_unlocked" : ls === "jammed" ? "s_jammed" : "s_unavailable";
      out.push(this._tile("k_lock", this._t(key), cls, ls === "locked" ? ICONS.lock : ls === "jammed" ? ICONS.jammed : ICONS.unlock, it.lock));
    }
    const pet = it.pet && h.states[it.pet];
    if (pet) {
      const inside = ["on", "home"].includes(pet.state);
      out.push(this._tile("k_pet", `${this._t(inside ? "v_inside" : "v_outside")} · ${fmtTime(Date.parse(pet.last_changed), this._locale())}`, "idle", ICONS.pet, it.pet));
    }
    const bell = it.doorbell && h.states[it.doorbell];
    if (bell) out.push(this._tile("k_doorbell", this._when(bell), "idle", ICONS.bell, it.doorbell));
    const clim = it.climate && h.states[it.climate];
    if (clim) out.push(this._heating(it, clim));
    if (it.breakers.length) {
      const n = this._breakersKnown(it);
      const off = this._tripped(it);
      out.push(this._tile("k_breakers", off ? this._t("v_tripped", { n: off }) : this._t("v_armed", { on: n - off, n }), off ? "crit" : "ok", ICONS.breakers, it.breakers[0]));
    }
    const pw = it.power && h.states[it.power];
    if (pw) out.push(this._tile("k_power", this._power(pw), "idle", ICONS.power, it.power));
    const bat = it.battery && h.states[it.battery];
    if (bat) {
      const pct = Number(bat.state);
      const cls = !Number.isFinite(pct) ? "idle" : pct < 20 ? "crit" : pct < 35 ? "warn" : "ok";
      out.push(this._tile("k_battery", Number.isFinite(pct) ? `${Math.round(pct)} %` : this._t("s_unknown"), cls, ICONS.battery, it.battery));
    }
    return out;
  }

  // The time of the last ring: an event entity's state is its time, a binary sensor's last change.
  _when(s) {
    const at = Date.parse(s.entity_id?.startsWith("event.") ? s.state : s.last_changed);
    if (!Number.isFinite(at)) return "—";
    const day = startOfDay(Date.now());
    if (at >= day) return fmtTime(at, this._locale());
    return new Intl.DateTimeFormat(this._locale(), { day: "numeric", month: "short" }).format(new Date(at));
  }

  // Heating: paused (amber) when it went off after the window opened (a minute's leeway for the automation), else
  // off (turned off for the season, say) or on with its target.
  _heating(it, s) {
    const off = s.state === "off";
    const paused = off && isAjar(it.pos) && Date.parse(s.last_changed) >= Date.parse(it.since) - 60000;
    const target = Number(s.attributes?.temperature);
    const value = paused ? this._t("v_paused") : off ? this._t("v_off") : Number.isFinite(target) ? `${this._t("v_on")} · ${target} °` : this._t("v_on");
    return this._tile("k_heating", value, paused ? "warn" : off ? "idle" : "ok", ICONS.heating, it.climate);
  }

  _power(s) {
    const v = Number(s.state);
    const unit = s.attributes?.unit_of_measurement || "";
    if (!Number.isFinite(v)) return this._t("s_unknown");
    const nf = (n, d) => new Intl.NumberFormat(this._locale(), { maximumFractionDigits: d }).format(n);
    return unit === "W" && Math.abs(v) >= 1000 ? `${nf(v / 1000, 1)} kW` : `${nf(v, 1)} ${unit}`.trim();
  }

  // ---- Today's timeline ---------------------------------------------------------

  _day(it) {
    if (this._config.show_history === false) return "";
    const hist = this._history(this._historyIds([it]));
    if (!hist) return "";
    const now = Date.now();
    const start = startOfDay(now);
    const d = dayOf(hist, it, start, now);
    const head =
      d.count === 0 && !d.spans.length
        ? this._t("no_opening")
        : this._t(d.count === 1 ? "one_opening" : "n_openings", { n: d.count, d: this._dur(Math.max(1, d.total)) });
    return `<div class="day"><div class="dayhead"><b>${esc(this._t("today"))}</b><span>${esc(head)}</span></div>
      ${dayBar(d, start, now, it.st.alert)}${this._axis()}</div>`;
  }

  // ---- Buttons --------------------------------------------------------------------

  _actions(it) {
    const out = [];
    if (it.ls && !it.readOnly && it.lockState !== "unavailable") {
      const locked = it.lockState === "locked";
      // No Lock button while the door stands open: the bolt would be thrown into the void.
      if (locked) out.push(this._button("unlock", ICONS.unlock, "unlock"));
      else if (!isAjar(it.pos)) out.push(this._button("lock", ICONS.lock, "lock"));
      if (canUnlatch(it.ls) && !isAjar(it.pos)) out.push(this._button("unlatch", ICONS.door_open, "unlatch"));
    }
    out.push(this._button("history", ICONS.history, "history"));
    return `<div class="actions">${out.join("")}</div>`;
  }

  _button(action, icon, key) {
    return `<button class="btn" data-action="${action}" aria-label="${esc(this._t(key))}">${svgIcon(icon)}<span>${esc(this._t(key))}</span></button>`;
  }

  _action(action, _value, ev) {
    const it = this._items()[0];
    if (!it) return;
    if (action === "history") return this._moreInfo(it.id);
    if (action === "lock") return this._call("lock", "lock", { entity_id: it.lock });
    if (action === "unlock" || action === "unlatch") {
      const service = action === "unlock" ? "unlock" : "open";
      const run = () => this._call("lock", service, { entity_id: it.lock });
      if (this._config.confirm === false) return run();
      return this._ask(this._t(`confirm_${action}`, { name: it.name }), this._t(action), run);
    }
    if (action === "zoom") return this._toggleZoom(ev);
  }
}

// The day bar: open spans in blue (the ongoing one red during an alert), unlocked spans in amber, the time now.
const dayBar = (d, start, now, alert, thin = false) => {
  const span = 86400000;
  const pct = (ms) => (((ms - start) / span) * 100).toFixed(2);
  const seg = ([a, b], cls) => `<span class="seg ${cls}" style="left:${pct(a)}%;width:${(((b - a) / span) * 100).toFixed(2)}%"></span>`;
  const open = d.spans.map((s, i) => seg(s, alert && i === d.spans.length - 1 && s[1] >= now ? "crit" : ""));
  return `<div class="bar${thin ? " thin" : ""}" aria-hidden="true">${d.unlocked.map((s) => seg(s, "unl")).join("")}${open.join("")}<span class="now" style="left:${pct(now)}%"></span></div>`;
};

// ---------------------------------------------------------------------------
// opening-mini-card: the banner, unfolding into the full card
// ---------------------------------------------------------------------------

class OpeningMiniCard extends OpeningCard {
  static getConfigElement() {
    return document.createElement("opening-mini-card-editor");
  }

  _resetView() {
    this._zoomed = false;
  }

  _onOutside() {
    if (this._confirm) return this._closeConfirm();
    if (this._zoomed) this._setZoom(false);
  }

  getCardSize() {
    return this._zoomed ? 5 : 2;
  }

  _zoom() {
    if (this._config.zoom === false) return "";
    const label = esc(this._t(this._zoomed ? "zoom_out" : "zoom_in"));
    return `<button class="zoom" data-action="zoom" title="${label}" aria-label="${label}" aria-expanded="${this._zoomed ? "true" : "false"}">${svgIcon(this._zoomed ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _setZoom(on) {
    this._zoomed = on;
    this._update();
    this.dispatchEvent(new CustomEvent("iron-resize", { bubbles: true, composed: true }));
  }

  _toggleZoom(ev) {
    this._setZoom(!this._zoomed);
    if (ev?.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus?.({ preventScroll: true });
  }

  // Folded, the card ends on the banner's ground strip.
  _body(it) {
    return this._zoomed ? super._body(it) : "";
  }
}

// ---------------------------------------------------------------------------
// opening-overview-card and opening-journal-card: every door and window
// ---------------------------------------------------------------------------

const FILTERS = ["all", "open", "unlocked", "alert"];
const FILTER_CLS = { all: "", open: "active", unlocked: "warn", alert: "crit" };
const matches = (it, f) =>
  f === "all" || (f === "open" && isAjar(it.pos)) || (f === "unlocked" && it.lockState === "unlocked") || (f === "alert" && (it.st.alert || it.st.cls === "crit"));

class OpeningListBase extends OpeningBase {
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

class OpeningOverviewCard extends OpeningListBase {
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

class OpeningJournalCard extends OpeningListBase {
  static getConfigElement() {
    return document.createElement("opening-journal-card-editor");
  }

  _render() {
    const items = this._items();
    if (!items.length) return this._error(this._t("none_found"));
    return this._shell(items, this._journal(items));
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

const LANGUAGES = [
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

const entityField = (name, domain) => ({ name, selector: { entity: { domain } } });

// Options of each editor, by field: the single cards (with the mini card's detail button), the lists.
const SINGLE_FIELDS = (tr, mini) => [
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
const LIST_FIELDS = (overview) => [
  { name: "title", selector: { text: {} } },
  { name: "entities", selector: { entity: { domain: ["binary_sensor", "sensor", "cover"], multiple: true } } },
  { name: "open_alert", selector: { number: { min: 0, max: 1440, mode: "box", unit_of_measurement: "min" } } },
  { type: "grid", name: "", schema: [...(overview ? ["show_journal"] : []), "include_covers"].map((name) => ({ name, selector: { boolean: {} } })) },
];
const COMMON_FIELDS = (tr) => [
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
const DEFAULTS = { zoom: true, show_history: true, confirm: true, show_journal: true, include_covers: true, open_alert: 10 };

const toForm = (config) => {
  const data = { ...DEFAULTS, ...config };
  data.opening_type ??= "auto";
  data.illustration_theme ??= "auto";
  data.entities = (Array.isArray(config.entities) ? config.entities : []).map((e) => (typeof e === "string" ? e : e?.entity)).filter(Boolean);
  return data;
};

const fromForm = (value, previous) => {
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

class OpeningEditorBase extends HTMLElement {
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

class OpeningCardEditor extends OpeningEditorBase {
  _fields(tr) {
    return SINGLE_FIELDS(tr, false);
  }
}
class OpeningMiniCardEditor extends OpeningEditorBase {
  _fields(tr) {
    return SINGLE_FIELDS(tr, true);
  }
}
class OpeningOverviewCardEditor extends OpeningEditorBase {
  _fields() {
    return LIST_FIELDS(true);
  }
}
class OpeningJournalCardEditor extends OpeningEditorBase {
  _fields() {
    return LIST_FIELDS(false);
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
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
    window.customCards.push({ ...card, preview: false, documentationURL: "https://github.com/juju35/ha-opening-card" });
}

console.info(
  `%c OPENING-CARD %c v${VERSION} `,
  "color: white; background: #9a6a3a; font-weight: 700;",
  "color: #9a6a3a; background: white; font-weight: 700;",
);
