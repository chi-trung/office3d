// Per-status character animation: typing, breathing + glances, freeze.

import type { StaffStatus } from '@/types';
import type { CharacterRefs } from './character';

const DEG = Math.PI / 180;
const ARM_PERIOD = 0.22; // seconds per typing cycle
const ARM_SWING = 22 * DEG;
const HEAD_PITCH = -0.08; // working: slight look-down at the screen
const BREATH_PERIOD = 3.2; // idle torso breathing cycle, seconds
const GLANCE_DURATION = 1.1; // seconds per head turn
const GLANCE_ANGLE = 0.35; // radians left/right
const GLANCE_GAP_BASE = 4; // nextGlance = time + 4 + seed*3 (4-7s apart)
const GLANCE_GAP_SPAN = 3;
const GLANCE_IDLE = -1; // glanceT sentinel: no glance in progress

export interface AnimState {
  seed: number;
  nextGlance: number;
  glanceT: number;
}

export function createAnimState(seed: number): AnimState {
  // Stagger the first glance per character (seed expected in [0, 1)).
  return { seed, nextGlance: seed * GLANCE_GAP_BASE, glanceT: GLANCE_IDLE };
}

// Standard ease-in-out quad.
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function updateCharacter(
  refs: CharacterRefs,
  status: StaffStatus,
  state: AnimState,
  time: number,
  // All motion is driven by absolute `time`; delta kept for signature parity.
  _delta: number,
): void {
  // Offline freezes in place — no pose writes at all.
  if (status === 'offline') return;

  if (status === 'working') {
    // Typing: arms swing in opposite phases; clear idle leftovers.
    const omega = (2 * Math.PI) / ARM_PERIOD;
    refs.armL.rotation.x = Math.sin(time * omega) * ARM_SWING;
    refs.armR.rotation.x = Math.sin(time * omega + Math.PI) * ARM_SWING;
    refs.head.rotation.x = HEAD_PITCH;
    refs.head.rotation.y = 0;
    refs.torso.scale.y = 1;
    return;
  }

  // Idle: breathing torso, arms at rest, occasional head glance.
  refs.armL.rotation.x = 0;
  refs.armR.rotation.x = 0;
  refs.head.rotation.x = 0;
  refs.torso.scale.y =
    1 + 0.015 * (1 + Math.sin((2 * Math.PI * time) / BREATH_PERIOD));

  if (state.glanceT === GLANCE_IDLE && time > state.nextGlance) {
    state.glanceT = time;
    state.nextGlance = time + GLANCE_GAP_BASE + state.seed * GLANCE_GAP_SPAN;
  }

  if (state.glanceT === GLANCE_IDLE) {
    refs.head.rotation.y = 0;
    return;
  }

  const p = (time - state.glanceT) / GLANCE_DURATION;
  if (p >= 1) {
    state.glanceT = GLANCE_IDLE;
    refs.head.rotation.y = 0;
    return;
  }
  // Ease out to ±0.35 at the midpoint, ease back to center at the end.
  const shaped = p < 0.5 ? easeInOut(p * 2) : easeInOut((1 - p) * 2);
  const direction = state.seed >= 0.5 ? 1 : -1;
  refs.head.rotation.y = direction * GLANCE_ANGLE * shaped;
}
