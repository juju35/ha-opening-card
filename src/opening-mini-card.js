// ---------------------------------------------------------------------------
// opening-mini-card: the banner, unfolding into the full card
// ---------------------------------------------------------------------------
import { ICONS, svgIcon } from "./icons.js";
import { esc } from "./strings.js";
import { OpeningCard } from "./opening-card-2.js";

export class OpeningMiniCard extends OpeningCard {
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
