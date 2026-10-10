// Assembles the workstation world: one seat per staff plus a hire slot.

import * as THREE from 'three';
import type { Staff, Team } from '@/types';
import { workstationPosition } from '@/lib/grid';
import { zoneColorFor } from '@/lib/zone';
import type { MaterialPalette } from './materials';
import type { CharacterRefs } from './character';
import { buildWorkstation, buildEmptyWorkstation } from './workstation';
import { makeNameLabel } from './nameLabel';

export const MAX_STAFF = 8; // grid: 4 columns x 2 rows

// Canvas "+" badge shown above the vacant hire desk.
function makePlusSprite(): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('world: 2D canvas context unavailable');
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#22c55e';
  ctx.stroke();

  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#16a34a';
  ctx.beginPath();
  ctx.moveTo(64, 36);
  ctx.lineTo(64, 92);
  ctx.moveTo(36, 64);
  ctx.lineTo(92, 64);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  sprite.scale.set(0.7, 0.7, 1);
  return sprite;
}

export function buildWorld(
  staff: Staff[],
  teams: Team[],
  mats: MaterialPalette,
): {
  group: THREE.Group;
  characters: Map<string, CharacterRefs>;
  screens: Map<string, THREE.MeshStandardMaterial>;
  labels: Map<string, THREE.Sprite>;
} {
  const group = new THREE.Group();
  const characters = new Map<string, CharacterRefs>();
  const screens = new Map<string, THREE.MeshStandardMaterial>();
  const labels = new Map<string, THREE.Sprite>();

  staff.forEach((member, i) => {
    const { x, z } = workstationPosition(i);
    const zoneColor = zoneColorFor(member.teamId, teams);
    const ws = buildWorkstation(member, zoneColor, mats, i);
    ws.group.position.set(x, 0, z);
    group.add(ws.group);

    characters.set(member.id, ws.character);
    screens.set(member.id, ws.screenMat);

    // Label rides the character anchor so it follows any later character move.
    const label = makeNameLabel(member.name, member.status);
    ws.character.labelAnchor.add(label);
    labels.set(member.id, label);
  });

  // Hire slot right after the last seat while the grid is not full.
  if (staff.length < MAX_STAFF) {
    const { x, z } = workstationPosition(staff.length);
    const empty = buildEmptyWorkstation(mats);
    empty.position.set(x, 0, z);
    empty.userData.emptySlot = true; // Task 8 raycast marker for HireDialog
    const plus = makePlusSprite();
    plus.position.set(0, 1.65, 0.85); // above the empty desk
    empty.add(plus);
    group.add(empty);
  }

  return { group, characters, screens, labels };
}
