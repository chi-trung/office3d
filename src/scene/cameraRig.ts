// Camera rig: perspective + orthographic pair, orbit controls, zoom %, center lerp.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { ViewMode } from '@/types';
import { mapZoomToPercent, mapPercentToDistance } from '@/lib/zoom';

// Same view direction as the spec's (26, 19.5, 26), scaled ×1.0956 so the
// distance to CAM_TARGET is exactly 45 → 51% on page load (see R15:
// verbatim 26/19.5/26 gives only 41.07 → 57%).
export const DEFAULT_CAM_POS = new THREE.Vector3(28.4867, 21.2503, 28.4867);
export const CAM_TARGET = new THREE.Vector3(0, 1.2, 0);

// Top-down ortho half-height in world units; half-width follows the aspect.
export const ORTHO_HALF_H = 10;

const FOV = 35;
const MIN_DISTANCE = 12;
const MAX_DISTANCE = 45;
const MAX_POLAR_ANGLE = (72 * Math.PI) / 180; // never look from under the floor
const CENTER_DURATION_MS = 600; // center() lerp length
const NEAR = 0.1;
const FAR = 200;

// Ease-in-out quad (same shape as animation.ts).
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function createRig(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
): {
  persp: THREE.PerspectiveCamera;
  ortho: THREE.OrthographicCamera;
  controls: OrbitControls;
  setViewMode(m: ViewMode): void;
  center(): void;
  getPercent(): number;
  setPercent(p: number): void;
  update(): void;
} {
  const size = new THREE.Vector2();
  renderer.getSize(size);
  const aspect = size.x / Math.max(1, size.y);

  const persp = new THREE.PerspectiveCamera(FOV, aspect, NEAR, FAR);
  persp.position.copy(DEFAULT_CAM_POS);

  // Straight-down view; the 0.001 offset avoids a degenerate lookAt.
  const ortho = new THREE.OrthographicCamera(
    -ORTHO_HALF_H * aspect,
    ORTHO_HALF_H * aspect,
    ORTHO_HALF_H,
    -ORTHO_HALF_H,
    NEAR,
    FAR,
  );
  ortho.position.set(0.001, 30, 0.001);
  ortho.lookAt(0, 0, 0);

  scene.add(persp, ortho);

  const controls = new OrbitControls(persp, renderer.domElement);
  controls.target.copy(CAM_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = MAX_POLAR_ANGLE;
  controls.minDistance = MIN_DISTANCE;
  controls.maxDistance = MAX_DISTANCE;
  controls.update(); // settle initial orientation

  let mode: ViewMode = '3d';
  let animStart = 0; // center() start time in ms, 0 when idle
  const animFromPos = new THREE.Vector3();
  const animFromTarget = new THREE.Vector3();

  // The 2D view zooms by scaling the ortho frustum from the same distance,
  // so one zoom percent stays consistent across both modes.
  function syncOrthoZoom(): void {
    const dist = controls.getDistance();
    ortho.zoom = MAX_DISTANCE / Math.max(dist, MIN_DISTANCE);
    ortho.updateProjectionMatrix();
  }
  syncOrthoZoom();

  function setViewMode(m: ViewMode): void {
    mode = m;
    controls.enabled = m === '3d' && animStart === 0; // 2D: fixed top view
  }

  function center(): void {
    animFromPos.copy(persp.position);
    animFromTarget.copy(controls.target);
    animStart = performance.now();
    controls.enabled = false; // lock input while lerping
  }

  function getPercent(): number {
    return mapZoomToPercent(controls.getDistance());
  }

  function setPercent(p: number): void {
    const dist = mapPercentToDistance(p);
    const offset = persp.position.clone().sub(controls.target);
    const len = offset.length();
    if (len > 1e-6) {
      persp.position.copy(controls.target).addScaledVector(offset, dist / len);
    }
    controls.update();
    syncOrthoZoom();
  }

  function update(): void {
    if (animStart !== 0) {
      const t = Math.min(1, (performance.now() - animStart) / CENTER_DURATION_MS);
      const e = easeInOut(t);
      persp.position.lerpVectors(animFromPos, DEFAULT_CAM_POS, e);
      controls.target.lerpVectors(animFromTarget, CAM_TARGET, e);
      persp.lookAt(controls.target);
      if (t >= 1) {
        animStart = 0;
        controls.enabled = mode === '3d';
        syncOrthoZoom();
      }
      return; // controls stay off for the whole lerp
    }
    controls.update();
  }

  return { persp, ortho, controls, setViewMode, center, getPercent, setPercent, update };
}
