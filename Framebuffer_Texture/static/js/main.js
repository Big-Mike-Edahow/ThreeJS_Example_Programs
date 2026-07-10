// main.js

import * as THREE from "three";
import * as GeometryUtils from "three/addons/utils/GeometryUtils.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { dpr, textureSize, vector, color } from "./utils/utilities.js";

let offset = 0;
let width = window.innerWidth;
let height = window.innerHeight;

function main() {
  // Scene.
  const scene = new THREE.Scene();
  const sceneOrtho = new THREE.Scene();

  // Camera.
  const camera = new THREE.PerspectiveCamera(70, width / height, 1, 1000);
  camera.position.z = 20;

  // Ortho camera.
  const cameraOrtho = new THREE.OrthographicCamera(
    -width / 2,
    width / 2,
    height / 2,
    -height / 2,
    1,
    10,
  );
  cameraOrtho.position.z = 10;

  // Renderer.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.autoClear = false;
  document.body.appendChild(renderer.domElement);

  // Selection.
  const selection = document.getElementById("selection");

  // Orbit controls.
  const controls = new OrbitControls(camera, selection);
  controls.enablePan = false;

  // Generate a procedural Gosper curve, center it, prepare it for
  // dynamic coloring, and add it as a scaled line to the scene.
  const points = GeometryUtils.gosper(8);
  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.Float32BufferAttribute(points, 3);
  geometry.setAttribute("position", positionAttribute);
  geometry.center();
  const colorAttribute = new THREE.BufferAttribute(
    new Float32Array(positionAttribute.array.length),
    3,
  );
  colorAttribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("color", colorAttribute);
  const material = new THREE.LineBasicMaterial({ vertexColors: true });
  const line = new THREE.Line(geometry, material);
  line.scale.setScalar(0.05);
  scene.add(line);

  // Sprite.
  const texture = new THREE.FramebufferTexture(textureSize, textureSize);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(textureSize, textureSize, 1);
  sceneOrtho.add(sprite);
  updateSpritePosition();

  // Centers the sprite horizontally and vertically on
  // the screen, adjusted for image dimensions.
  function updateSpritePosition() {
    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;
    const halfImageWidth = textureSize / 2;
    const halfImageHeight = textureSize / 2;
    sprite.position.set(
      -halfWidth + halfImageWidth,
      halfHeight - halfImageHeight,
      1,
    );
  }

  // Shifts vertex/point colors using a cycling HSL hue over time,
  // and updates the buffer attribute to animate the color gradient.
  function updateColors(colorAttribute) {
    const l = colorAttribute.count;
    for (let i = 0; i < l; i++) {
      const h = ((offset + i) % l) / l;
      color.setHSL(h, 1, 0.5);
      colorAttribute.setX(i, color.r);
      colorAttribute.setY(i, color.g);
      colorAttribute.setZ(i, color.b);
    }
    colorAttribute.needsUpdate = true;
    offset -= 25;
  }

  // Window resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    cameraOrtho.left = -width / 2;
    cameraOrtho.right = width / 2;
    cameraOrtho.top = height / 2;
    cameraOrtho.bottom = -height / 2;
    cameraOrtho.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateSpritePosition();
  }

  // Main animation loop.
  function animate() {
    const colorAttribute = line.geometry.getAttribute("color");
    updateColors(colorAttribute);
    renderer.clear();
    renderer.render(scene, camera);
    vector.x = (window.innerWidth * dpr) / 2 - textureSize / 2;
    vector.y = (window.innerHeight * dpr) / 2 - textureSize / 2;
    renderer.copyFramebufferToTexture(texture, vector);
    renderer.clearDepth();
    renderer.render(sceneOrtho, cameraOrtho);
  }
}

main();
