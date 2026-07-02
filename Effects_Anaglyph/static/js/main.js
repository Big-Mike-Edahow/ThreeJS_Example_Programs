// main.js

import * as THREE from "three";
import { AnaglyphEffect } from "three/addons/effects/AnaglyphEffect.js";
import { urls, spheres } from "./utils/utilities.js";

// Variables.
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let width = window.innerWidth;
let height = window.innerHeight;
let mouseX = 0;
let mouseY = 0;

function main() {
  // Scene.
  const scene = new THREE.Scene();
  const textureCube = new THREE.CubeTextureLoader().load(urls);
  scene.background = textureCube;

  // Camera.
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 100);
  camera.position.z = 3;

  // Renderer.
  const renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setAnimationLoop(animate);
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Geometry.
  const geometry = new THREE.SphereGeometry(0.1, 32, 16);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    envMap: textureCube,
  });
  for (let i = 0; i < 500; i++) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = Math.random() * 10 - 5;
    mesh.position.y = Math.random() * 10 - 5;
    mesh.position.z = Math.random() * 10 - 5;
    mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 3 + 1;
    scene.add(mesh);
    spheres.push(mesh);
  }

  // Effect.
  const effect = new AnaglyphEffect(renderer);
  effect.setSize(width, height);
  effect.eyeSep = 0.064;
  effect.planeDistance = 3;

  // Window resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    effect.setSize(window.innerWidth, window.innerHeight);
  }

  // On mouse move.
  document.addEventListener("mousemove", onDocumentMouseMove);
  function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) / 100;
    mouseY = (event.clientY - windowHalfY) / 100;
  }

  // Main animation loop.
  function animate() {
    const timer = 0.0001 * Date.now();
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    for (let i = 0, il = spheres.length; i < il; i++) {
      const sphere = spheres[i];
      sphere.position.x = 5 * Math.cos(timer + i);
      sphere.position.y = 5 * Math.sin(timer + i * 1.1);
    }

    effect.render(scene, camera);
  }
}

main();
