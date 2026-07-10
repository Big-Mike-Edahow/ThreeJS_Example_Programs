// utilities.js

import * as THREE from "three";

// Device pixel ratio, accounting for high-DPI (Retina) displays.
export const dpr = window.devicePixelRatio;

// Scaled texture size based on the device pixel ratio.
export const textureSize = 128 * dpr;

// Reusable 2D vector for temporary math operations.
export const vector = new THREE.Vector2();

// Reusable color instance for temporary color operations.
export const color = new THREE.Color();
