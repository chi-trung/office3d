// Free-standing props: four plants, a trophy shelf and the aisle carpet.

import * as THREE from 'three';
import type { MaterialPalette } from './materials';

// Plant spots: two at the back wall, two near the front corners.
const PLANT_SPOTS: readonly [number, number][] = [
  [-7.0, -6.0],
  [7.0, -6.0],
  [-6.6, 5.2],
  [6.6, 5.2],
];

function makeBox(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function standard(color: string, roughness = 0.85, metalness = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

// Pot + three stacked leaf boxes.
function buildPlant(): THREE.Group {
  const plant = new THREE.Group();

  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.36, 14), standard('#b5651d'));
  pot.position.y = 0.18;
  pot.castShadow = true;
  plant.add(pot);

  const leafA = makeBox(0.3, 0.5, 0.3, standard('#3f9e4d', 0.9));
  leafA.position.set(0, 0.6, 0);
  const leafB = makeBox(0.24, 0.4, 0.24, standard('#57b85f', 0.9));
  leafB.position.set(0.16, 0.72, 0.1);
  leafB.rotation.y = 0.5;
  const leafC = makeBox(0.2, 0.34, 0.2, standard('#2f8f3f', 0.9));
  leafC.position.set(-0.14, 0.68, -0.08);
  leafC.rotation.y = -0.4;
  plant.add(leafA, leafB, leafC);

  return plant;
}

// Wall shelf with three simple gold trophies (cylinder + box).
function buildTrophyShelf(mats: MaterialPalette): THREE.Group {
  const shelf = new THREE.Group();

  const board = makeBox(2.4, 0.08, 0.4, mats.deskWood);
  board.position.set(0, 1.0, 0);
  const legL = makeBox(0.08, 1.0, 0.36, mats.deskDark);
  legL.position.set(-1.1, 0.5, 0);
  const legR = makeBox(0.08, 1.0, 0.36, mats.deskDark);
  legR.position.set(1.1, 0.5, 0);
  shelf.add(board, legL, legR);

  const gold = new THREE.MeshStandardMaterial({
    color: '#e6b84a',
    metalness: 0.7,
    roughness: 0.3,
  });
  for (let i = 0; i < 3; i += 1) {
    const x = -0.7 + i * 0.7;
    const base = makeBox(0.18, 0.06, 0.18, mats.deskDark);
    base.position.set(x, 1.07, 0);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 12), gold);
    stem.position.set(x, 1.17, 0);
    stem.castShadow = true;
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.06, 0.16, 12), gold);
    cup.position.set(x, 1.32, 0);
    cup.castShadow = true;
    shelf.add(base, stem, cup);
  }

  return shelf;
}

export function buildDecor(mats: MaterialPalette): THREE.Group {
  const decor = new THREE.Group();

  for (const [x, z] of PLANT_SPOTS) {
    const plant = buildPlant();
    plant.position.set(x, 0, z);
    decor.add(plant);
  }

  // Shelf against the left wall (clear of the back-wall windows).
  const shelf = buildTrophyShelf(mats);
  shelf.rotation.y = Math.PI / 2;
  shelf.position.set(-7.7, 0, 0);
  decor.add(shelf);

  // Aisle carpet runs down the middle between the two workstation columns.
  const carpet = makeBox(0.9, 0.02, 13, standard('#7f8ea3', 1));
  carpet.position.set(0, 0.012, 0);
  decor.add(carpet);

  return decor;
}
