// main.js

import * as THREE from "three";

let width = window.innerWidth;
let height = window.innerHeight;

function main() {
  // Scene.
  const scene = new THREE.Scene();

  // Camera.
  const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 100);
  camera.position.z = 2;

  // Renderer.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Cube.
  const texture = new THREE.TextureLoader().load("static/textures/crate.gif");
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Window resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Main animation loop.
  function animate() {
    cube.rotation.x += 0.005;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
  }
}

main();
