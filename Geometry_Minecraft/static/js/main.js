// main.js

import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { FirstPersonControls } from "three/addons/controls/FirstPersonControls.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import { worldWidth, worldDepth, worldHalfWidth } from "./utils/constants.js";
import { worldHalfDepth, getY } from "./utils/constants.js";

let width = window.innerWidth;
let height = window.innerHeight;
const timer = new THREE.Timer();
timer.connect(document);

function main() {
  // Scene.
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);

  // Camera.
  const camera = new THREE.PerspectiveCamera(60, width / height, 1, 20000);
  camera.position.y = getY(worldHalfWidth, worldHalfDepth) * 100 + 100;

  // Ambient lighting.
  const ambientLight = new THREE.AmbientLight(0xeeeeee, 3);
  scene.add(ambientLight);

  // Directional lighting.
  const directionalLight = new THREE.DirectionalLight(0xffffff, 12);
  directionalLight.position.set(1, 1, 0.5).normalize();
  scene.add(directionalLight);

  // Renderer.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // First person controls.
  const controls = new FirstPersonControls(camera, renderer.domElement);
  controls.movementSpeed = 1000;
  controls.lookSpeed = 0.125;
  controls.lookVertical = true;

  // Stats.
  const stats = new Stats();
  container.appendChild(stats.dom);

  // Setup the square faces of the 100x100 3D cubes for the Minecraft voxel world.
  const matrix = new THREE.Matrix4();

  const pxGeometry = new THREE.PlaneGeometry(100, 100);
  pxGeometry.attributes.uv.array[1] = 0.5;
  pxGeometry.attributes.uv.array[3] = 0.5;
  pxGeometry.rotateY(Math.PI / 2);
  pxGeometry.translate(50, 0, 0);

  const nxGeometry = new THREE.PlaneGeometry(100, 100);
  nxGeometry.attributes.uv.array[1] = 0.5;
  nxGeometry.attributes.uv.array[3] = 0.5;
  nxGeometry.rotateY(-Math.PI / 2);
  nxGeometry.translate(-50, 0, 0);

  const pyGeometry = new THREE.PlaneGeometry(100, 100);
  pyGeometry.attributes.uv.array[5] = 0.5;
  pyGeometry.attributes.uv.array[7] = 0.5;
  pyGeometry.rotateX(-Math.PI / 2);
  pyGeometry.translate(0, 50, 0);

  const pzGeometry = new THREE.PlaneGeometry(100, 100);
  pzGeometry.attributes.uv.array[1] = 0.5;
  pzGeometry.attributes.uv.array[3] = 0.5;
  pzGeometry.translate(0, 0, 50);

  const nzGeometry = new THREE.PlaneGeometry(100, 100);
  nzGeometry.attributes.uv.array[1] = 0.5;
  nzGeometry.attributes.uv.array[3] = 0.5;
  nzGeometry.rotateY(Math.PI);
  nzGeometry.translate(0, 0, -50);

  //  Generates a 3D grid of blocks for the Minecraft terrain.
  const geometries = [];
  for (let z = 0; z < worldDepth; z++) {
    for (let x = 0; x < worldWidth; x++) {
      const h = getY(x, z);
      matrix.makeTranslation(
        x * 100 - worldHalfWidth * 100,
        h * 100,
        z * 100 - worldHalfDepth * 100,
      );
      const px = getY(x + 1, z);
      const nx = getY(x - 1, z);
      const pz = getY(x, z + 1);
      const nz = getY(x, z - 1);
      geometries.push(pyGeometry.clone().applyMatrix4(matrix));
      if ((px !== h && px !== h + 1) || x === 0) {
        geometries.push(pxGeometry.clone().applyMatrix4(matrix));
      }
      if ((nx !== h && nx !== h + 1) || x === worldWidth - 1) {
        geometries.push(nxGeometry.clone().applyMatrix4(matrix));
      }
      if ((pz !== h && pz !== h + 1) || z === worldDepth - 1) {
        geometries.push(pzGeometry.clone().applyMatrix4(matrix));
      }
      if ((nz !== h && nz != h + 1) || z === 0) {
        geometries.push(nzGeometry.clone().applyMatrix4(matrix));
      }
    }
  }

  // Load a texture atlas to be mapped onto the 3D surface.
  const geometry = BufferGeometryUtils.mergeGeometries(geometries);
  geometry.computeBoundingSphere();
  const texture = new THREE.TextureLoader().load("static/textures/atlas.png");
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide }),
  );
  scene.add(mesh);

  // Window resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Main animation loop.
  function animate() {
    timer.update();
    controls.update(timer.getDelta());
    renderer.render(scene, camera);
    stats.update();
  }
}

main();
