// main.js

import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";
import { scene, camera, renderer } from "./app/core.js";
import { raycaster, pointer } from "./app/constants.js";
import { worldWidth, worldDepth } from "./app/constants.js";
import { worldHalfWidth, worldHalfDepth } from "./app/constants.js";

function main() {
  // Scene.
  scene.background = new THREE.Color(0xbfd1e5);

  // Camera.
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);

  // Renderer.
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Orbit controls.
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 1000;
  controls.maxDistance = 10000;
  controls.maxPolarAngle = Math.PI / 2;

  // Stats.
  const stats = new Stats();
  container.appendChild(stats.dom);

  // Controls config.
  const data = generateHeight(worldWidth, worldDepth);
  controls.target.y = data[worldHalfWidth + worldHalfDepth * worldWidth] + 500;
  camera.position.y = controls.target.y + 2000;
  camera.position.x = 2000;
  controls.update();

  // Terrain Geometry
  const geometry = new THREE.PlaneGeometry(
    7500,
    7500,
    worldWidth - 1,
    worldDepth - 1,
  );
  geometry.rotateX(-Math.PI / 2);

  // Terrain texture.
  const vertices = geometry.attributes.position.array;
  for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
    vertices[j + 1] = data[i] * 10;
  }
  const texture = new THREE.CanvasTexture(
    generateTexture(data, worldWidth, worldDepth),
  );
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  // Terrain mesh.
  const terrain = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ map: texture }),
  );
  scene.add(terrain);

  // Geometry helper.
  const geometryHelper = new THREE.ConeGeometry(20, 100, 3);
  geometryHelper.translate(0, 50, 0);
  geometryHelper.rotateX(Math.PI / 2);
  const helper = new THREE.Mesh(geometryHelper, new THREE.MeshNormalMaterial());
  scene.add(helper);

  // Generate a 2D heightmap for a procedural terrain using
  // Fractal Brownian Motion (fBm).
  function generateHeight(width, height) {
    const size = width * height,
      data = new Uint8Array(size),
      perlin = new ImprovedNoise(),
      z = Math.random() * 100;
    let quality = 1;
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < size; i++) {
        const x = i % width,
          y = ~~(i / width);
        data[i] += Math.abs(
          perlin.noise(x / quality, y / quality, z) * quality * 1.75,
        );
      }
      quality *= 5;
    }
    return data;
  }

  // Generate and scale a procedural 2D texture (e.g., for terrain or heightmaps).
  function generateTexture(data, width, height) {
    let context, image, imageData, shade;
    const vector3 = new THREE.Vector3(0, 0, 0);
    const sun = new THREE.Vector3(1, 1, 1);
    sun.normalize();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    context = canvas.getContext("2d");
    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);
    image = context.getImageData(0, 0, canvas.width, canvas.height);
    imageData = image.data;
    for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
      vector3.x = data[j - 2] - data[j + 2];
      vector3.y = 2;
      vector3.z = data[j - width * 2] - data[j + width * 2];
      vector3.normalize();
      shade = vector3.dot(sun);
      imageData[i] = (96 + shade * 128) * (0.5 + data[j] * 0.007);
      imageData[i + 1] = (32 + shade * 96) * (0.5 + data[j] * 0.007);
      imageData[i + 2] = shade * 96 * (0.5 + data[j] * 0.007);
    }
    context.putImageData(image, 0, 0);

    // Scaled 4x.
    const canvasScaled = document.createElement("canvas");
    canvasScaled.width = width * 4;
    canvasScaled.height = height * 4;
    context = canvasScaled.getContext("2d");
    context.scale(4, 4);
    context.drawImage(canvas, 0, 0);
    image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
    imageData = image.data;
    for (let i = 0, l = imageData.length; i < l; i += 4) {
      const v = ~~(Math.random() * 5);
      imageData[i] += v;
      imageData[i + 1] += v;
      imageData[i + 2] += v;
    }
    context.putImageData(image, 0, 0);
    return canvasScaled;
  }

  // On pointer move.
  container.addEventListener("pointermove", onPointerMove);
  function onPointerMove(event) {
    pointer.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    pointer.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    // See if the ray from the camera into the world hits one of our meshes
    const intersects = raycaster.intersectObject(terrain);
    // Toggle rotation bool for meshes that we clicked
    if (intersects.length > 0) {
      helper.position.set(0, 0, 0);
      helper.lookAt(intersects[0].face.normal);
      helper.position.copy(intersects[0].point);
    }
  }

  // Window resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Main animation loop.
  function animate() {
    renderer.render(scene, camera);
    stats.update();
  }
}

main();
