// core.js

import * as THREE from "three";

let width = window.innerWidth;
let height = window.innerHeight;

// Initialize the three.js core: scene, camera, and renderer.
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, width / height, 10, 20000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

export { scene, camera, renderer };
