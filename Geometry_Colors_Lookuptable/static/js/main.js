// main.js

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { Lut } from "three/addons/math/Lut.js";
import { params } from "./utils/constants.js";

let width = window.innerWidth;
let height = window.innerHeight;

function main() {
  // Scene.
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // Camera.
  const camera = new THREE.PerspectiveCamera(60, width / height, 1, 100);
  camera.position.set(0, 0, 10);
  scene.add(camera);

  // Ortho camera.
  const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 2);
  orthoCamera.position.set(0.5, 0, 1);

  // Point lighting.
  const pointLight = new THREE.PointLight(0xffffff, 3, 0, 0);
  camera.add(pointLight);

  // Renderer.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.autoClear = false;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Orbit controls.
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener("change", render);

  // GUI.
  const gui = new GUI();
  gui
    .add(params, "colorMap", [
      "rainbow",
      "cooltowarm",
      "blackbody",
      "grayscale",
    ])
    .onChange(function () {
      updateColors();
      render();
    });

  // UI Scene.
  const uiScene = new THREE.Scene();

  // LUT (Lookup Table).
  const lut = new Lut();

  // Initialize a 2D color legend sprite from an LUT (Lookup Table),
  // and prepare a base geometry mesh for displaying data.
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(lut.createCanvas()),
    }),
  );
  sprite.material.map.colorSpace = THREE.SRGBColorSpace;
  sprite.scale.x = 0.125;
  uiScene.add(sprite);
  const mesh = new THREE.Mesh(
    undefined,
    new THREE.MeshLambertMaterial({
      side: THREE.DoubleSide,
      color: 0xf5f5f5,
      vertexColors: true,
    }),
  );
  scene.add(mesh);

  // Loads a JSON model, initializes default white vertex colors, and refreshes the mesh.
  function loadModel() {
    const loader = new THREE.BufferGeometryLoader();
    loader.load("static/models/pressure.json", function (geometry) {
      geometry.center();
      geometry.computeVertexNormals();
      // Default color attribute.
      const colors = [];
      for (let i = 0, n = geometry.attributes.position.count; i < n; ++i) {
        colors.push(1, 1, 1);
      }
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3),
      );
      mesh.geometry = geometry;
      updateColors();
      render();
    });
  }

  // Updates the mesh vertex colors and the 2D legend texture,
  // based on the current pressure data and LUT parameters.
  function updateColors() {
    lut.setColorMap(params.colorMap);
    lut.setMax(2000);
    lut.setMin(0);
    const geometry = mesh.geometry;
    const pressures = geometry.attributes.pressure;
    const colors = geometry.attributes.color;
    const color = new THREE.Color();
    for (let i = 0; i < pressures.array.length; i++) {
      const colorValue = pressures.array[i];
      color.copy(lut.getColor(colorValue)).convertSRGBToLinear();
      colors.setXYZ(i, color.r, color.g, color.b);
    }
    colors.needsUpdate = true;
    const map = sprite.material.map;
    lut.updateCanvas(map.image);
    map.needsUpdate = true;
  }

  // Window resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    render();
  }

  // Clear the color and depth buffers, render the primary 3D environment,
  // and overlay a 2D user interface without overwriting the 3D depth.
  function render() {
    renderer.clear();
    renderer.render(scene, camera);
    renderer.render(uiScene, orthoCamera);
  }

  loadModel();
}

main();
