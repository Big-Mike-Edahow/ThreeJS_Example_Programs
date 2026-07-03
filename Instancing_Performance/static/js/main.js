// main.js

import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import { Method, api } from "./utils/utilities.js";

let width = window.innerWidth;
let height = window.innerHeight;
let scene, material, guiStatsEl;

function main() {
  // Scene.
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // Camera.
  const camera = new THREE.PerspectiveCamera(70, width / height, 1, 100);
  camera.position.z = 30;

  // Renderer.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.setAnimationLoop(animate);
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Orbit controls.
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;

  // Stats.
  const stats = new Stats();
  container.appendChild(stats.dom);

  // GUI.
  const gui = new GUI();
  gui.add(api, "method", Method).onChange(initMesh);
  gui.add(api, "count", 1, 10000).step(1).onChange(initMesh);

  const perfFolder = gui.addFolder("Performance");
  guiStatsEl = document.createElement("div");
  guiStatsEl.classList.add("gui-stats");
  perfFolder.$children.appendChild(guiStatsEl);
  perfFolder.open();

  // Window resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // Main animation loop.
  function animate() {
    controls.update();
    renderer.render(scene, camera);
    stats.update();
  }

  initMesh();
}

main();

// Calculates the total GPU buffer memory size (in bytes) used by the geometry.
function getGeometryByteLength(geometry) {
  let total = 0;
  if (geometry.index) total += geometry.index.array.byteLength;
  for (const name in geometry.attributes) {
    total += geometry.attributes[name].array.byteLength;
  }
  return total;
}

// Converts a byte count into a human-readable string like KB or MB.
function formatBytes(bytes, decimals) {
  if (bytes === 0) return "0 bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Removes all meshes from the scene and frees up GPU memory.
function clean() {
  const meshes = [];
  scene.traverse(function (object) {
    if (object.isMesh) meshes.push(object);
  });
  for (let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i];
    mesh.material.dispose();
    mesh.geometry.dispose();
    scene.remove(mesh);
  }
}

// Randomizes the given matrix with a random position in a
// 40*40*40 box, with random rotation and random scale.
const randomizeMatrix = (function () {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  return function (matrix) {
    position.x = Math.random() * 40 - 20;
    position.y = Math.random() * 40 - 20;
    position.z = Math.random() * 40 - 20;
    quaternion.random();
    scale.x = scale.y = scale.z = Math.random() * 1;
    matrix.compose(position, quaternion, scale);
  };
})();

// Load the Suzanne mesh geometry and render it using the selected build strategy.
function initMesh() {
  clean();
  // Make instances.
  new THREE.BufferGeometryLoader()
    .setPath("static/models/")
    .load("suzanne_buffergeometry.json", function (geometry) {
      material = new THREE.MeshNormalMaterial();
      geometry.computeVertexNormals();
      console.time(api.method + " (build)");
      switch (api.method) {
        case Method.INSTANCED:
          makeInstanced(geometry);
          break;
        case Method.MERGED:
          makeMerged(geometry);
          break;
        case Method.NAIVE:
          makeNaive(geometry);
          break;
      }
      console.timeEnd(api.method + " (build)");
    });
}

// Generates a highly optimized, single-draw-call mesh by duplicating
// the geometry across random transformations.
function makeInstanced(geometry) {
  const matrix = new THREE.Matrix4();
  const mesh = new THREE.InstancedMesh(geometry, material, api.count);
  for (let i = 0; i < api.count; i++) {
    randomizeMatrix(matrix);
    mesh.setMatrixAt(i, matrix);
  }
  scene.add(mesh);
  const geometryByteLength = getGeometryByteLength(geometry);
  guiStatsEl.innerHTML = [
    "<i>GPU draw calls</i>: 1",
    "<i>GPU memory</i>: " + formatBytes(api.count * 16 + geometryByteLength, 2),
  ].join("<br/>");
}

// Creates, randomizes, and merges geometry clones into a single draw-call mesh.
function makeMerged(geometry) {
  const geometries = [];
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < api.count; i++) {
    randomizeMatrix(matrix);
    const instanceGeometry = geometry.clone();
    instanceGeometry.applyMatrix4(matrix);
    geometries.push(instanceGeometry);
  }
  const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
  scene.add(new THREE.Mesh(mergedGeometry, material));
  guiStatsEl.innerHTML = [
    "<i>GPU draw calls</i>: 1",
    "<i>GPU memory</i>: " +
      formatBytes(getGeometryByteLength(mergedGeometry), 2),
  ].join("<br/>");
}

// Populates the scene with randomized individual meshes and updates performance stats.
function makeNaive(geometry) {
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < api.count; i++) {
    randomizeMatrix(matrix);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.applyMatrix4(matrix);
    scene.add(mesh);
  }
  const geometryByteLength = getGeometryByteLength(geometry);
  guiStatsEl.innerHTML = [
    "<i>GPU draw calls</i>: " + api.count,
    "<i>GPU memory</i>: " + formatBytes(api.count * 16 + geometryByteLength, 2),
  ].join("<br/>");
}
