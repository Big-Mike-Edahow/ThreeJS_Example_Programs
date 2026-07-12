// main.js

import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { SUBTRACTION, INTERSECTION, ADDITION } from "three-bvh-csg";
import { Brush, Evaluator } from "three-bvh-csg";
import { params } from "./utils/constants.js";

let result;
let width = window.innerWidth;
let height = window.innerHeight;

function main() {
  // Scene.
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x89797E);

  // Camera.
  const camera = new THREE.PerspectiveCamera(50, width / height, 1, 100);
  camera.position.set(-1, 1, 1).normalize().multiplyScalar(10);

  // Ambient lighting.
  const ambient = new THREE.HemisphereLight(0xffffff, 0xbfd4d2, 3);
  scene.add(ambient);

  // Directional lighting.
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
  directionalLight.position.set(1, 4, 3).multiplyScalar(3);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.setScalar(2048);
  directionalLight.shadow.bias = -1e-4;
  directionalLight.shadow.normalBias = 1e-4;
  scene.add(directionalLight);

  // Renderer.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Orbit controls.
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 5;
  controls.maxDistance = 75;

  // Stats.
  const stats = new Stats();
  container.appendChild(stats.dom);

  // Shadow plane.
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(),
    new THREE.ShadowMaterial({
      color: 0xd81b60,
      transparent: true,
      opacity: 0.075,
      side: THREE.DoubleSide,
    }),
  );
  plane.position.y = -3;
  plane.rotation.x = -Math.PI / 2;
  plane.scale.setScalar(10);
  plane.receiveShadow = true;
  scene.add(plane);

  // Create brushes.
  const evaluator = new Evaluator();
  const baseBrush = new Brush(
    new THREE.IcosahedronGeometry(2, 3),
    new THREE.MeshStandardMaterial({
      flatShading: true,

      polygonOffset: true,
      polygonOffsetUnits: 1,
      polygonOffsetFactor: 1,
    }),
  );
  const brush = new Brush(
    new THREE.CylinderGeometry(1, 1, 5, 45),
    new THREE.MeshStandardMaterial({
      color: 0x80cbc4,

      polygonOffset: true,
      polygonOffsetUnits: 1,
      polygonOffsetFactor: 1,
    }),
  );
  const core = new Brush(
    new THREE.IcosahedronGeometry(0.15, 1),
    new THREE.MeshStandardMaterial({
      flatShading: true,
      color: 0xff9800,
      emissive: 0xff9800,
      emissiveIntensity: 0.35,
      polygonOffset: true,
      polygonOffsetUnits: 1,
      polygonOffsetFactor: 1,
    }),
  );
  core.castShadow = true;
  scene.add(core);

  // Create wireframe.
  const wireframe = new THREE.Mesh(
    undefined,
    new THREE.MeshBasicMaterial({ color: 0x009688, wireframe: true }),
  );
  scene.add(wireframe);

  // Set up GUI.
  const gui = new GUI();
  gui.add(params, "operation", { SUBTRACTION, INTERSECTION, ADDITION });
  gui.add(params, "wireframe");
  gui.add(params, "useGroups");
  function updateCSG() {
    evaluator.useGroups = params.useGroups;
    result = evaluator.evaluate(baseBrush, brush, params.operation, result);
    result.castShadow = true;
    result.receiveShadow = true;
    scene.add(result);
  }

  // Window resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Main animation loop.
  function animate() {
    // Update the transforms.
    const t = window.performance.now() + 9000;
    baseBrush.rotation.x = t * 0.0001;
    baseBrush.rotation.y = t * 0.00025;
    baseBrush.rotation.z = t * 0.0005;
    baseBrush.updateMatrixWorld();

    brush.rotation.x = t * -0.0002;
    brush.rotation.y = t * -0.0005;
    brush.rotation.z = t * -0.001;

    const s = 0.5 + 0.5 * (1 + Math.sin(t * 0.001));
    brush.scale.set(s, 1, s);
    brush.updateMatrixWorld();

    // Update the csg.
    updateCSG();

    wireframe.geometry = result.geometry;
    wireframe.visible = params.wireframe;

    renderer.render(scene, camera);
    stats.update();
  }
  onWindowResize();
}

main();
