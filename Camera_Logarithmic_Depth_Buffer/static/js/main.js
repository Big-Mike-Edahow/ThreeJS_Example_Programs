// main.js

import * as THREE from "three";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import Stats from "three/addons/libs/stats.module.js";
import { labeldata } from "./imports/labeldata.js";

// Global variables.
let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;
let screensplit = 0.25;
let screensplit_right = 0;
let zoompos = -100;
let minzoomspeed = 0.015;
let zoomspeed = minzoomspeed;
let container, border, stats;

// Global constants.
const NEAR = 1e-6;
const FAR = 1e27;
const mouse = [0.5, 0.5];
const objects = {};

function main() {
  // Font loader.
  const loader = new FontLoader();
  loader.load("static/fonts/helvetiker_regular.typeface.json", function (font) {
    const scene = initScene(font);
    // Scene with normal z-buffer.
    objects.normal = initView(scene, "normal", false);
    // Scene with logarithmic z-buffer.
    objects.logzbuf = initView(scene, "logzbuf", true);
    animate();
  });

  // Stats.
  stats = new Stats();
  container = document.getElementById("container");
  container.appendChild(stats.dom);

  // Resize border.
  border = document.getElementById("renderer_border");
  border.addEventListener("pointerdown", onBorderPointerDown);

  // Window event listeners.
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("resize", onWindowResize);
  window.addEventListener("wheel", onMouseWheel);
}

// Initialize the view.
function initView(scene, name, logDepthBuf) {
  // Frame container.
  const framecontainer = document.getElementById("container_" + name);
  // Camera.
  const camera = new THREE.PerspectiveCamera(
    50,
    (screensplit * SCREEN_WIDTH) / SCREEN_HEIGHT,
    NEAR,
    FAR,
  );
  scene.add(camera);
  // Renderer.
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: logDepthBuf,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(SCREEN_WIDTH / 2, SCREEN_HEIGHT);
  renderer.domElement.style.position = "relative";
  renderer.domElement.id = "renderer_" + name;
  framecontainer.appendChild(renderer.domElement);
  return {
    container: framecontainer,
    renderer: renderer,
    scene: scene,
    camera: camera,
  };
}

// Initialize the scene.
function initScene(font) {
  // Scene.
  const scene = new THREE.Scene();
  // Ambient ligting.
  scene.add(new THREE.AmbientLight(0x777777));
  // Directional lighting.
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(100, 100, 100);
  scene.add(light);
  // Material args.
  const materialargs = {
    color: 0xffffff,
    specular: 0x050505,
    shininess: 50,
    emissive: 0x000000,
  };
  // Geometry.
  const geometry = new THREE.SphereGeometry(0.5, 24, 12);
  for (let i = 0; i < labeldata.length; i++) {
    const scale = labeldata[i].scale || 1;
    const labelgeo = new TextGeometry(labeldata[i].label, {
      font: font,
      size: labeldata[i].size,
      depth: labeldata[i].size / 2,
    });
    labelgeo.computeBoundingSphere();
    labelgeo.translate(-labelgeo.boundingSphere.radius, 0, 0); // Center text.
    materialargs.color = new THREE.Color().setHSL(Math.random(), 0.5, 0.5);
    const material = new THREE.MeshPhongMaterial(materialargs);
    const group = new THREE.Group();
    group.position.z = -labeldata[i].size * scale;
    scene.add(group);
    // Text mesh.
    const textmesh = new THREE.Mesh(labelgeo, material);
    textmesh.scale.set(scale, scale, scale);
    textmesh.position.z = -labeldata[i].size * scale;
    textmesh.position.y = (labeldata[i].size / 4) * scale;
    group.add(textmesh);
    // Dot mesh.
    const dotmesh = new THREE.Mesh(geometry, material);
    dotmesh.position.y = (-labeldata[i].size / 4) * scale;
    dotmesh.scale.multiplyScalar(labeldata[i].size * scale);
    group.add(dotmesh);
  }
  return scene;
}

// Update renderer sizes.
function updateRendererSizes() {
  // Recalculate size for both renderers.
  SCREEN_WIDTH = window.innerWidth;
  SCREEN_HEIGHT = window.innerHeight;
  screensplit_right = 1 - screensplit;
  objects.normal.renderer.setSize(screensplit * SCREEN_WIDTH, SCREEN_HEIGHT);
  objects.normal.camera.aspect = (screensplit * SCREEN_WIDTH) / SCREEN_HEIGHT;
  objects.normal.camera.updateProjectionMatrix();
  objects.normal.camera.setViewOffset(
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    0,
    0,
    SCREEN_WIDTH * screensplit,
    SCREEN_HEIGHT,
  );
  objects.normal.container.style.width = screensplit * 100 + "%";
  objects.logzbuf.renderer.setSize(
    screensplit_right * SCREEN_WIDTH,
    SCREEN_HEIGHT,
  );
  objects.logzbuf.camera.aspect =
    (screensplit_right * SCREEN_WIDTH) / SCREEN_HEIGHT;
  objects.logzbuf.camera.updateProjectionMatrix();
  objects.logzbuf.camera.setViewOffset(
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    SCREEN_WIDTH * screensplit,
    0,
    SCREEN_WIDTH * screensplit_right,
    SCREEN_HEIGHT,
  );
  objects.logzbuf.container.style.width = screensplit_right * 100 + "%";
  border.style.left = screensplit * 100 + "%";
}

// Main animation loop.
function animate() {
  requestAnimationFrame(animate);
  render();
}

// Render.
function render() {
  // Put some limits on zooming.
  const minzoom = labeldata[0].size * labeldata[0].scale * 1;
  const maxzoom =
    labeldata[labeldata.length - 1].size *
    labeldata[labeldata.length - 1].scale *
    100;
  let damping = Math.abs(zoomspeed) > minzoomspeed ? 0.95 : 1.0;
  // Zoom out faster the further out you go.
  const zoom = THREE.MathUtils.clamp(
    Math.pow(Math.E, zoompos),
    minzoom,
    maxzoom,
  );
  zoompos = Math.log(zoom);
  // Slow down quickly at the zoom limits.
  if (
    (zoom == minzoom && zoomspeed < 0) ||
    (zoom == maxzoom && zoomspeed > 0)
  ) {
    damping = 0.85;
  }
  zoompos += zoomspeed;
  zoomspeed *= damping;
  objects.normal.camera.position.x =
    Math.sin(0.5 * Math.PI * (mouse[0] - 0.5)) * zoom;
  objects.normal.camera.position.y =
    Math.sin(0.25 * Math.PI * (mouse[1] - 0.5)) * zoom;
  objects.normal.camera.position.z =
    Math.cos(0.5 * Math.PI * (mouse[0] - 0.5)) * zoom;
  objects.normal.camera.lookAt(objects.normal.scene.position);
  // Clone camera settings across both scenes
  objects.logzbuf.camera.position.copy(objects.normal.camera.position);
  objects.logzbuf.camera.quaternion.copy(objects.normal.camera.quaternion);
  // Update renderer sizes if the split has changed
  if (screensplit_right != 1 - screensplit) {
    updateRendererSizes();
  }
  objects.normal.renderer.render(objects.normal.scene, objects.normal.camera);
  objects.logzbuf.renderer.render(
    objects.logzbuf.scene,
    objects.logzbuf.camera,
  );
  stats.update();
}

// Window resize.
function onWindowResize() {
  updateRendererSizes();
}

// Border pointer down.
function onBorderPointerDown() {
  // Activate draggable window resizing bar
  window.addEventListener("pointermove", onBorderPointerMove);
  window.addEventListener("pointerup", onBorderPointerUp);
}

// Border pointer move.
function onBorderPointerMove(ev) {
  screensplit = Math.max(0, Math.min(1, ev.clientX / window.innerWidth));
}

// Border pointer up.
function onBorderPointerUp() {
  window.removeEventListener("pointermove", onBorderPointerMove);
  window.removeEventListener("pointerup", onBorderPointerUp);
}

// Mouse move.
function onMouseMove(ev) {
  mouse[0] = ev.clientX / window.innerWidth;
  mouse[1] = ev.clientY / window.innerHeight;
}

// Mouse wheel.
function onMouseWheel(ev) {
  const amount = ev.deltaY;
  if (amount === 0) return;
  const dir = amount / Math.abs(amount);
  zoomspeed = dir / 10;

  // Slow down default zoom speed after user starts zooming.
  minzoomspeed = 0.001;
}

main();
