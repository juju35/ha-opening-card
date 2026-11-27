// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

export const BASE_STYLE = `
  :host { --oc-ok: var(--success-color, #43a047); --oc-warn: var(--warning-color, #ffa600); --oc-crit: var(--error-color, #db4437);
          --oc-idle: var(--secondary-text-color, #9e9e9e); --oc-active: var(--info-color, #039be5); --oc-accent: #9a6a3a;
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
export const BANNER_STYLE = `
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

export const DIALOG_STYLE = `
  ha-card.dialog-open { position: relative; min-height: 160px; }
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center;
              padding-top: 12px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
  .modal { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(92%, 340px); box-sizing: border-box;
           border-radius: 14px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.4); display: flex; flex-direction: column; gap: 12px; }
  .modal .msg { font-size: 14px; line-height: 1.4; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
`;

export const BODY_STYLE = `
  .content { padding: 14px 14px 16px; display: flex; flex-direction: column; gap: 14px; }
  .alertline { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; font-size: 13px; font-weight: 500;
               background: color-mix(in srgb, var(--oc-crit) 12%, transparent); color: var(--ink); }
  .alertline .icon { color: var(--oc-crit); }
  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(88px, 1fr)); gap: 8px; }
  .tile { position: relative; min-width: 0; border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px;
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

export const LIST_STYLE = `
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
