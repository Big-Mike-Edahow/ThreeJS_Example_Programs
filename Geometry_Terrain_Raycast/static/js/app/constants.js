// constants.js

import * as THREE from "three";

export const raycaster = new THREE.Raycaster();
export const pointer = new THREE.Vector2();

export const worldWidth = 256;
export const worldDepth = 256;
export const worldHalfWidth = worldWidth / 2;
export const worldHalfDepth = worldDepth / 2;
