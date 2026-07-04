// main.js

import * as THREE from "three";
import { AsciiEffect } from "three/addons/effects/AsciiEffect.js";
import { TrackballControls } from "three/addons/controls/TrackballControls.js";

const start = Date.now();
let width = window.innerWidth;
let height = window.innerHeight;

function main() {
  // Scene.
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0, 0, 0);

  // Camera.
  const camera = new THREE.PerspectiveCamera(70, width / height, 1, 1000);
  camera.position.y = 150;
  camera.position.z = 500;

  // Point lighting.
  const pointLight1 = new THREE.PointLight(0xffffff, 3, 0, 0);
  pointLight1.position.set(500, 500, 500);
  scene.add(pointLight1);
  const pointLight2 = new THREE.PointLight(0xffffff, 1, 0, 0);
  pointLight2.position.set(-500, -500, -500);
  scene.add(pointLight2);

  // Sphere.
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(200, 20, 10),
    new THREE.MeshPhongMaterial({ flatShading: true }),
  );
  scene.add(sphere);

  // Plane.
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshBasicMaterial({ color: 0xe0e0e0 }),
  );
  plane.position.y = -200;
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  // Renderer.
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);

  // ASCII effect.
  const effect = new AsciiEffect(renderer, " .:-+*=%@#", { invert: true });
  effect.setSize(window.innerWidth, window.innerHeight);
  effect.domElement.style.color = "white";
  effect.domElement.style.backgroundColor = "black";

  // Append effect.domElement, instead of renderer.domElement.
  // AsciiEffect creates a custom domElement (a div container),
  // where the ASCII elements are placed.
  document.body.appendChild(effect.domElement);

  // Trackball controls.
  const controls = new TrackballControls(camera, effect.domElement);

  // Window resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    effect.setSize(window.innerWidth, window.innerHeight);
  }

  // Main animation loop.
  function animate() {
    const timer = Date.now() - start;
    sphere.position.y = Math.abs(Math.sin(timer * 0.002)) * 150;
    sphere.rotation.x = timer * 0.0003;
    sphere.rotation.z = timer * 0.0002;

    controls.update();
    effect.render(scene, camera);
  }
}

main();
