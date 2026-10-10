// Shared material palette for the 3D office scene.
// createMaterials() must be called only once from OfficeScene.

import * as THREE from 'three';

export interface MaterialPalette {
  deskWood: THREE.Material;
  deskDark: THREE.Material;
  chairBlack: THREE.Material;
  screenOn: THREE.MeshStandardMaterial;
  screenOff: THREE.MeshStandardMaterial;
  faceBlack: THREE.Material;
  [key: string]: THREE.Material;
}

export function createMaterials(): MaterialPalette {
  return {
    // Wood and fabric: high roughness.
    deskWood: new THREE.MeshStandardMaterial({ color: '#b08968', roughness: 0.8 }),
    deskDark: new THREE.MeshStandardMaterial({ color: '#3f3f46', roughness: 0.8 }),
    // Black metal: lower roughness, slight metalness.
    chairBlack: new THREE.MeshStandardMaterial({
      color: '#1c1c1e',
      roughness: 0.4,
      metalness: 0.3,
    }),
    // Screens: black base with cyan glow.
    screenOn: new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: '#7dd3fc',
      emissiveIntensity: 0.6,
    }),
    screenOff: new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: '#7dd3fc',
      emissiveIntensity: 0.05,
    }),
    faceBlack: new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.85 }),
  };
}

// Transparent overlay material for team/zone highlights.
export function zoneMaterial(color: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity: 0.25,
    roughness: 0.9,
  });
}
