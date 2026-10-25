import type { Container, FederatedPointerEvent } from "pixi.js";
import type { Pos } from "./common";

/** Show `text` near the pointer (client coords), or hide the tooltip when `text` is null */
export type Hover = (text: string | null, at: Pos) => void;

/**
 * Which of several parts of a view (keyed by `K`, e.g. a stack's SKU) is under the pointer.
 * The tooltip's text is re-made on every `refresh`, so it stays live while hovered:
 *
 *   tracker.attach(box, sku)              # on drawing each box
 *   tracker.refresh((sku) => `${sku}…`)   # every frame
 */
export class HoverTracker<K> {
  private hovered: { key: K; at: Pos } | null = null;

  constructor(private readonly onHover?: Hover) {}

  public attach(target: Container, key: K): void {
    if (this.onHover === undefined) return;
    target.eventMode = "static";
    const track = (e: FederatedPointerEvent) => {
      this.hovered = { key, at: { x: e.clientX, y: e.clientY } };
    };
    target.on("pointerover", track);
    target.on("pointermove", track);
    target.on("pointerout", (e: FederatedPointerEvent) => {
      this.hovered = null;
      this.onHover?.(null, { x: e.clientX, y: e.clientY });
    });
  }

  public refresh(describe: (key: K) => string): void {
    if (this.hovered !== null)
      this.onHover?.(describe(this.hovered.key), this.hovered.at);
  }
}
