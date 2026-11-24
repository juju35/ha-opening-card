// ---------------------------------------------------------------------------
// Illustrations: one SVG per opening type, 120 × 84, standing on the ground line (y 84)
// ---------------------------------------------------------------------------
import { isAjar } from "./states.js";

// Parts that move: a leaf swinging on a hinge (scaleX from its edge), a panel sliding (translateX), a flap or a
// door lifting (scaleY). Their pivot and travel are CSS variables, so the open state is a class on the picture.
export const sx = (x, s, inner, cls = "") => `<g class="sx ${cls}" style="--o:${x}px 50px;--s:${s}">${inner}</g>`;
export const sy = (y, s, inner, cls = "") => `<g class="sy ${cls}" style="--o:60px ${y}px;--s:${s}">${inner}</g>`;
export const tx = (d, inner) => `<g class="tx" style="--d:${d}px">${inner}</g>`;
export const r = (cls, x, y, w, h, extra = "") => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}"${extra}/>`;
export const bars = (xs, y1, y2) => xs.map((x) => `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/>`).join("");

// A door leaf of wood with its two panels and knob, a glazed leaf, a window sash.
export const woodLeaf = (x, w) =>
  `${r("wd", x, 20, w, 64)}${r("wdl", x + 5, 26, w - 10, 22)}${r("wdl", x + 5, 54, w - 10, 24)}<circle class="knob" cx="${x + w - 6}" cy="54" r="2"/>`;
export const glassLeaf = (x, w, handle) =>
  `${r("lt", x, 18, w, 66)}${r("gl", x + 4, 22, w - 8, 56)}<line class="bar" x1="${x + 4}" y1="50" x2="${x + w - 4}" y2="50"/>${handle ? r("hdl", handle, 46, 2, 8) : ""}`;
export const sash = (x, y, w, h, handle) => `${r("gl sf", x, y, w, h)}${handle ? r("hdl", handle, y + h / 2 - 4, 2, 8, ' rx="1"') : ""}`;
export const wall = (x = 14, w = 92) => r("wl", x, 8, w, 76);
export const sill = (x, y, w) => r("sill", x, y, w, 3);
export const panelLeds = (rows) =>
  rows
    .map(([y, n]) =>
      Array.from({ length: n }, (_, i) => `${r("brk", 41 + i * 6, y + 1.5, 5, 10)}${r(`led${i === n - 1 && y > 50 ? " last" : ""}`, 42.5 + i * 6, y + 3, 2, 3)}`).join(""),
    )
    .join("");

export const SCENES = {
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
export const openingSvg = (type, pos, { tripped = false, crop = false } = {}) =>
  `<svg class="op op-${type} ${pos}${isAjar(pos) ? " sway" : ""}${tripped ? " tripped" : ""}" viewBox="${crop ? "12 10 96 74" : "0 0 120 84"}" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">${(SCENES[type] || SCENES.entry)()}</svg>`;

// Colors of the pictures, day and night (the `.night` class on an ancestor).
export const SCENE_STYLE = `
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
