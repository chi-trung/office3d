// 2D layer: one floor dot + name label per staff. Group starts hidden.

import * as THREE from 'three';
import type { Staff } from '@/types';
import { TEAMS } from '@/data/staff';
import { zoneColorFor } from '@/lib/zone';
import { makeNameLabel } from './nameLabel';

const DOT_RADIUS = 0.5;
const DOT_HEIGHT = 0.04;
const LABEL_Y = 0.3;

// In the top-down view the ortho camera looks straight down with a 0.001 tilt,
// so screen "up" maps to this world direction — use it to clear the dot.
const LABEL_SCREEN_UP = new THREE.Vector3(-Math.SQRT1_2, 0, -Math.SQRT1_2);
const LABEL_CLEARANCE = 0.95; // label center offset, clears radius + half label

export function buildDots(
  staff: Staff[],
  posOf: (i: number) => { x: number; z: number },
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'staffDots';

  // Share one material per team color (at most 4 teams).
  const dotMats = new Map<string, THREE.MeshStandardMaterial>();

  staff.forEach((member, i) => {
    const { x, z } = posOf(i);

    let dotMat = dotMats.get(member.teamId);
    if (!dotMat) {
      dotMat = new THREE.MeshStandardMaterial({
        color: zoneColorFor(member.teamId, TEAMS),
        roughness: 0.85,
      });
      dotMats.set(member.teamId, dotMat);
    }

    // Thin cylinder resting on the floor.
    const dot = new THREE.Mesh(
      new THREE.CylinderGeometry(DOT_RADIUS, DOT_RADIUS, DOT_HEIGHT, 32),
      dotMat,
    );
    dot.position.set(x, DOT_HEIGHT / 2, z);
    dot.userData.staffId = member.id; // pickable in 2D mode too
    group.add(dot);

    const label = makeNameLabel(member.name, member.status);
    label.position.set(x, LABEL_Y, z).addScaledVector(LABEL_SCREEN_UP, LABEL_CLEARANCE);
    label.userData.staffId = member.id; // the label itself is not under the character
    group.add(label);
  });

  group.visible = false; // shown only in 2D view mode
  return group;
}
