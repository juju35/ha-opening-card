// ---------------------------------------------------------------------------
// Opening types
// ---------------------------------------------------------------------------

// Drawn and described: the doors and windows this card is about.
export const TYPES = [
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
export const EXTRA_TYPES = ["garage", "gate"];
export const ALL_TYPES = [...TYPES, ...EXTRA_TYPES];
export const WINDOWS = new Set(["window", "window_double", "window_tilt", "window_sliding", "hopper"]);

// Words of an entity's name that tell its kind of opening, in the card's languages where it matters most.
export const NAME_RE = {
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
export const typeOf = (id, s, override) => {
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
