// main.js

import * as THREE from "three";
import { StereoEffect } from "three/addons/effects/StereoEffect.js";

const spheres = [];
let mouseX = 0;
let mouseY = 0;
let width = window.innerWidth;
let height = window.innerHeight;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

function main() {
  // Scene.
  const scene = new THREE.Scene();
  scene.background = new THREE.CubeTextureLoader()
    .setPath("static/textures/")
    .load(["px.jpg", "nx.jpg", "py.jpg", "ny.jpg", "pz.jpg", "nz.jpg"]);

  // Camera.
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
  camera.position.z = 3;

  // Renderer.
  const renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setAnimationLoop(animate);
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Stereo effect.
  const effect = new StereoEffect(renderer);
  effect.setSize(width, height);

  // Spheres.
  const geometry = new THREE.SphereGeometry(0.1, 32, 16);
  const textureCube = new THREE.CubeTextureLoader()
    .setPath("static/textures/")
    .load(["px.jpg", "nx.jpg", "py.jpg", "ny.jpg", "pz.jpg", "nz.jpg"]);
  textureCube.mapping = THREE.CubeRefractionMapping;
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    envMap: textureCube,
    refractionRatio: 0.95,
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
    mouseX = (event.clientX - windowHalfX) * 0.01;
    mouseY = (event.clientY - windowHalfY) * 0.01;
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
