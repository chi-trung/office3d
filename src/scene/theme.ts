// Day/night theme: background, light intensities and screen glow.

import * as THREE from 'three';
import type { ThemeMode } from '@/types';

export interface ThemeSpec {
  background: number;
  hemiIntensity: number;
  dirIntensity: number;
  dirColor: number;
  screenEmissive: number;
}

const DAY: ThemeSpec = {
  background: 0xe8f1f8,
  hemiIntensity: 0.9,
  dirIntensity: 1.6,
  dirColor: 0xffe9cc, // warm white
  screenEmissive: 0.6,
};

const NIGHT: ThemeSpec = {
  background: 0x0b1026,
  hemiIntensity: 0.25,
  dirIntensity: 0.5,
  dirColor: 0x9dbbff, // cool blue
  screenEmissive: 1.0,
};

const SCREEN_OFF = 0.05; // base glow of a non-working screen
const ON_THRESHOLD = 0.3; // emissiveIntensity at or above counts as "on"

export function themeSpec(mode: ThemeMode): ThemeSpec {
  // Copy so a caller cannot mutate the shared presets.
  return { ...(mode === 'night' ? NIGHT : DAY) };
}

export function applyTheme(
  scene: THREE.Scene,
  hemi: THREE.HemisphereLight,
  dir: THREE.DirectionalLight,
  screens: Map<string, THREE.MeshStandardMaterial>,
  mode: ThemeMode,
): void {
  const spec = themeSpec(mode);
  scene.background = new THREE.Color(spec.background);
  hemi.intensity = spec.hemiIntensity;
  dir.intensity = spec.dirIntensity;
  dir.color.setHex(spec.dirColor);

  // Keep each person's screen on/off (set from status), scaled by the theme.
  const factor = spec.screenEmissive / DAY.screenEmissive;
  for (const mat of screens.values()) {
    const on = mat.emissiveIntensity >= ON_THRESHOLD;
    mat.emissiveIntensity = on ? spec.screenEmissive : SCREEN_OFF * factor;
  }
}
