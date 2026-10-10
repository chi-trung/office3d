// Blocky seated character built from boxes.

import * as THREE from 'three';
import type { CharacterSpec, Staff, StaffStatus } from '@/types';

export interface CharacterRefs {
  group: THREE.Group;
  head: THREE.Mesh;
  armL: THREE.Group;
  armR: THREE.Group;
  torso: THREE.Mesh;
  labelAnchor: THREE.Object3D;
}

function makeBox(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function standard(color: string, roughness = 0.8, metalness = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

// Eyes and mouth are thin boxes on the head front (+z).
function addFace(head: THREE.Mesh, faceMat: THREE.Material, hasGlasses: boolean): void {
  // With glasses the eyes sit in front of the frames so they stay visible.
  const eyeZ = hasGlasses ? 0.3 : 0.285;
  const eyeL = makeBox(0.08, 0.1, 0.02, faceMat);
  eyeL.position.set(-0.13, 0.06, eyeZ);
  const eyeR = makeBox(0.08, 0.1, 0.02, faceMat);
  eyeR.position.set(0.13, 0.06, eyeZ);
  const mouth = makeBox(0.18, 0.04, 0.02, faceMat);
  mouth.position.set(0, -0.12, 0.285);
  head.add(eyeL, eyeR, mouth);
}

function addHair(head: THREE.Mesh, style: CharacterSpec['hairStyle'], hairMat: THREE.Material): void {
  if (style === 'bald') return;
  if (style === 'short' || style === 'long') {
    // Thin slab on top of the head.
    const top = makeBox(0.58, 0.12, 0.58, hairMat);
    top.position.set(0, 0.28, 0);
    head.add(top);
  }
  if (style === 'cap') {
    const crown = makeBox(0.58, 0.14, 0.58, hairMat);
    crown.position.set(0, 0.3, 0);
    const brim = makeBox(0.42, 0.05, 0.24, hairMat);
    brim.position.set(0, 0.245, 0.39);
    head.add(crown, brim);
  }
  if (style === 'long') {
    // Two panels hanging behind the head.
    const left = makeBox(0.2, 0.55, 0.14, hairMat);
    left.position.set(-0.2, -0.1, -0.32);
    const right = makeBox(0.2, 0.55, 0.14, hairMat);
    right.position.set(0.2, -0.1, -0.32);
    head.add(left, right);
  }
}

// Two thin frames in front of the eyes.
function addGlasses(head: THREE.Mesh, frameMat: THREE.Material): void {
  const frameL = makeBox(0.17, 0.13, 0.02, frameMat);
  frameL.position.set(-0.13, 0.06, 0.285);
  const frameR = makeBox(0.17, 0.13, 0.02, frameMat);
  frameR.position.set(0.13, 0.06, 0.285);
  head.add(frameL, frameR);
}

// Arm group pivots at the shoulder so it can swing later.
function makeArm(skinMat: THREE.Material, side: number): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.39, 0.88, 0);
  const arm = makeBox(0.18, 0.45, 0.22, skinMat);
  arm.position.set(0, -0.225, 0);
  pivot.add(arm);
  return pivot;
}

// Leg group pivots at the hip; rotated -90 deg so the thigh lies horizontal.
function makeLeg(pantsMat: THREE.Material, side: number): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.14, 0.45, 0);
  pivot.rotation.x = -Math.PI / 2;
  const leg = makeBox(0.22, 0.5, 0.24, pantsMat);
  leg.position.set(0, -0.25, 0);
  pivot.add(leg);
  return pivot;
}

export function buildCharacter(staff: Staff): CharacterRefs {
  const look = staff.look;
  // Per-character materials so status opacity never leaks between staff.
  const skinMat = standard(look.skinTone, 0.85);
  const hairMat = standard(look.hairColor, 0.8);
  const shirtMat = standard(look.shirtColor, 0.8);
  const pantsMat = standard(look.pantsColor, 0.8);
  const faceMat = standard('#141414', 0.9);
  const chairMat = standard('#1c1c1e', 0.4, 0.3);

  const group = new THREE.Group();
  group.userData.staffId = staff.id;

  // Chair seat under the hips.
  const seat = makeBox(0.45, 0.06, 0.45, chairMat);
  seat.position.set(0, 0.42, 0);
  group.add(seat);

  const torso = makeBox(0.6, 0.5, 0.35, shirtMat);
  torso.position.set(0, 0.7, 0);
  group.add(torso);

  const head = makeBox(0.55, 0.55, 0.55, skinMat);
  head.position.set(0, 1.225, 0);
  addFace(head, faceMat, look.accessory === 'glasses');
  addHair(head, look.hairStyle, hairMat);
  if (look.accessory === 'glasses') {
    addGlasses(head, standard('#2f2f35', 0.5, 0.2));
  }
  group.add(head);

  const armL = makeArm(skinMat, -1);
  const armR = makeArm(skinMat, 1);
  group.add(armL, armR);

  group.add(makeLeg(pantsMat, -1), makeLeg(pantsMat, 1));

  if (look.accessory === 'lanyard') {
    const lanyard = makeBox(0.06, 0.32, 0.02, standard('#1f2a44', 0.7));
    lanyard.position.set(0, 0.8, 0.185);
    group.add(lanyard);
  }

  // Anchor for the HTML name label above the head.
  const labelAnchor = new THREE.Object3D();
  labelAnchor.position.set(0, 1.65, 0);
  group.add(labelAnchor);

  return { group, head, armL, armR, torso, labelAnchor };
}

// Offline staff render faded; other statuses restore full opacity.
export function applyStatusLook(refs: CharacterRefs, status: StaffStatus): void {
  const offline = status === 'offline';
  refs.group.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const list = Array.isArray(obj.material) ? obj.material : [obj.material];
    if (offline && obj.userData.baseOpacity === undefined) {
      obj.userData.baseOpacity = list[0]?.opacity ?? 1;
    }
    for (const material of list) {
      if (offline) {
        material.transparent = true;
        material.opacity = 0.4;
      } else {
        const base = obj.userData.baseOpacity as number | undefined;
        material.opacity = base ?? 1;
        material.transparent = false;
      }
      material.needsUpdate = true;
    }
  });
}
