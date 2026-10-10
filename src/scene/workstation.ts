// One staff seat: desk, monitor, chair, zone panels and floor pad.
// Local origin = seated character position; the desk sits in front (+z).

import * as THREE from 'three';
import type { Staff } from '@/types';
import type { MaterialPalette } from './materials';
import { zoneMaterial } from './materials';
import { buildCharacter, type CharacterRefs } from './character';

// Desk top: 1.8 x 0.08 x 0.75 centered at y 0.72, pushed toward +z.
const DESK_W = 1.8;
const DESK_H = 0.08;
const DESK_D = 0.75;
const DESK_Y = 0.72;
const DESK_Z = 1.0;
const DESK_TOP = DESK_Y + DESK_H / 2; // 0.76: top surface
const DESK_BOTTOM = DESK_Y - DESK_H / 2; // 0.68: leg height

// Monitor sits on the desk; the glowing face looks toward the seat (-z).
const MON_Z = 1.15;
const SCREEN_Y = 1.22;

function makeBox(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function standard(color: string, roughness = 0.8, metalness = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

// Top, four black legs and a lower storage shelf.
function buildDesk(mats: MaterialPalette): THREE.Group {
  const desk = new THREE.Group();

  const top = makeBox(DESK_W, DESK_H, DESK_D, mats.deskWood);
  top.position.set(0, DESK_Y, DESK_Z);
  desk.add(top);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = makeBox(0.06, DESK_BOTTOM, 0.06, mats.deskDark);
      leg.position.set(sx * 0.84, DESK_BOTTOM / 2, DESK_Z + sz * 0.3);
      desk.add(leg);
    }
  }

  const shelf = makeBox(1.5, 0.05, 0.45, mats.deskDark);
  shelf.position.set(0, 0.3, DESK_Z);
  desk.add(shelf);

  return desk;
}

// Bezel + face + stand + back shell. Face material is passed in (per-staff clone).
function buildMonitor(mats: MaterialPalette, screenMat: THREE.MeshStandardMaterial): THREE.Group {
  const monitor = new THREE.Group();

  const base = makeBox(0.32, 0.03, 0.2, mats.deskDark);
  base.position.set(0, DESK_TOP + 0.015, MON_Z);
  const neck = makeBox(0.06, 0.21, 0.06, mats.deskDark);
  neck.position.set(0, 0.88, MON_Z);

  const shell = makeBox(0.8, 0.48, 0.04, mats.faceBlack);
  shell.position.set(0, SCREEN_Y, MON_Z + 0.03);
  const bezel = makeBox(0.8, 0.48, 0.03, mats.deskDark);
  bezel.position.set(0, SCREEN_Y, MON_Z + 0.005);
  // Face sticks out past the bezel toward the seated person (-z).
  const face = makeBox(0.74, 0.42, 0.02, screenMat);
  face.position.set(0, SCREEN_Y, MON_Z - 0.015);

  monitor.add(base, neck, shell, bezel, face);
  return monitor;
}

// Pole + seat + backrest + four caster wheels.
function buildChair(mats: MaterialPalette): THREE.Group {
  const chair = new THREE.Group();

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.24, 12), mats.chairBlack);
  pole.position.set(0, 0.2, 0);
  pole.castShadow = true;

  const seat = makeBox(0.5, 0.08, 0.5, mats.chairBlack);
  seat.position.set(0, 0.36, 0);

  const back = makeBox(0.48, 0.5, 0.07, mats.chairBlack);
  back.position.set(0, 0.72, -0.26);

  const baseA = makeBox(0.56, 0.05, 0.08, mats.chairBlack);
  baseA.position.set(0, 0.07, 0);
  const baseB = makeBox(0.08, 0.05, 0.56, mats.chairBlack);
  baseB.position.set(0, 0.07, 0);

  chair.add(pole, seat, back, baseA, baseB);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.04, 10),
        mats.chairBlack,
      );
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(sx * 0.26, 0.05, sz * 0.26);
      wheel.castShadow = true;
      chair.add(wheel);
    }
  }

  return chair;
}

// Two translucent zone panels: behind the back and along the side.
function buildPanels(zoneColor: string): THREE.Group {
  const panels = new THREE.Group();
  const mat = zoneMaterial(zoneColor);

  const back = makeBox(1.9, 1.2, 0.03, mat);
  back.position.set(0, 0.6, -0.85);
  const side = makeBox(0.03, 1.2, 2.3, mat);
  side.position.set(-0.98, 0.6, 0.25);

  panels.add(back, side);
  return panels;
}

// Thin colored floor pad under the seat, offset against z-fighting.
function buildZonePad(zoneColor: string): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({
    color: zoneColor,
    roughness: 0.95,
    transparent: true,
    opacity: 0.45,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const pad = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.02, 2.2), mat);
  pad.receiveShadow = true;
  pad.position.set(0, 0.01, 0.2);
  return pad;
}

// Desk prop rotating by index % 3: cup / mini plant / paper stack.
function buildAccessory(kind: number, mats: MaterialPalette): THREE.Group {
  const item = new THREE.Group();
  const px = 0.62; // clear of the monitor on the desk top
  const pz = 0.78;

  if (kind === 0) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.11, 14), mats.deskDark);
    cup.position.set(px, DESK_TOP + 0.055, pz);
    cup.castShadow = true;
    item.add(cup);
  } else if (kind === 1) {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.055, 0.1, 12),
      standard('#b5651d', 0.85),
    );
    pot.position.set(px, DESK_TOP + 0.05, pz);
    pot.castShadow = true;
    const leafA = makeBox(0.08, 0.16, 0.08, standard('#4caf50', 0.9));
    leafA.position.set(px, DESK_TOP + 0.18, pz);
    leafA.rotation.y = 0.4;
    const leafB = makeBox(0.07, 0.12, 0.07, standard('#66bb6a', 0.9));
    leafB.position.set(px + 0.05, DESK_TOP + 0.15, pz - 0.04);
    item.add(pot, leafA, leafB);
  } else {
    const paper = standard('#f4f4f0', 0.95);
    for (let i = 0; i < 3; i += 1) {
      const sheet = makeBox(0.22, 0.02, 0.28, paper);
      sheet.position.set(px + (i % 2) * 0.01, DESK_TOP + 0.01 + i * 0.022, pz);
      item.add(sheet);
    }
  }

  return item;
}

// Full seat for one staff member. `index` picks the desk accessory (index % 3);
// omitted it defaults to 0, so the 3-argument plan signature still holds.
export function buildWorkstation(
  staff: Staff,
  zoneColor: string,
  mats: MaterialPalette,
  index = 0,
): { group: THREE.Group; character: CharacterRefs; screenMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  // Task 8 raycaster climbs parents; clicking any desk part selects the staff.
  group.userData.staffId = staff.id;

  // Per-staff screen clone so emissive can follow that person's status/theme.
  const screenMat = (staff.status === 'working' ? mats.screenOn : mats.screenOff).clone();

  group.add(buildZonePad(zoneColor));
  group.add(buildDesk(mats));
  group.add(buildMonitor(mats, screenMat));
  group.add(buildChair(mats));
  group.add(buildPanels(zoneColor));
  group.add(buildAccessory(index % 3, mats));

  const character = buildCharacter(staff);
  group.add(character.group);

  return { group, character, screenMat };
}

// Vacant hire slot: desk + monitor + neutral panels, no chair or person.
export function buildEmptyWorkstation(mats: MaterialPalette): THREE.Group {
  const group = new THREE.Group();
  group.add(buildZonePad('#cccccc'));
  group.add(buildDesk(mats));
  group.add(buildMonitor(mats, mats.screenOff.clone()));
  group.add(buildPanels('#cccccc'));
  return group;
}
