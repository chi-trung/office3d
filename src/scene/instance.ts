// Module singleton for the live OfficeScene so overlay controls
// (BottomBar) can reach it without prop-drilling. Viewport wires it
// via setScene; getScene() may be null (tests / pre-mount).

import type { OfficeScene } from '@/scene/OfficeScene';

let scene: OfficeScene | null = null;

export function setScene(next: OfficeScene | null): void {
  scene = next;
}

export function getScene(): OfficeScene | null {
  return scene;
}
