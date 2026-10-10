// Click picking: raycast the pointer, then climb parents to the staff marker.

import * as THREE from 'three';

// Returned when the vacant hire desk is picked.
export const EMPTY_SLOT_ID = '__empty__';

const raycaster = new THREE.Raycaster();

export function pickStaff(
  e: PointerEvent,
  canvas: HTMLCanvasElement,
  camera: THREE.Camera,
  pickables: THREE.Object3D[],
): string | null {
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;

  // Pointer -> normalized device coordinates inside the canvas.
  const ndc = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(ndc, camera);

  const hits = raycaster.intersectObjects(pickables, true);
  const first = hits[0];
  if (!first) return null;

  // Walk up: desks and characters carry staffId, the hire desk carries emptySlot.
  let obj: THREE.Object3D | null = first.object;
  while (obj) {
    const id: unknown = obj.userData.staffId;
    if (typeof id === 'string') return id;
    if (obj.userData.emptySlot === true) return EMPTY_SLOT_ID;
    obj = obj.parent;
  }
  return null;
}
