// main.js

import * as THREE from "three";

function main() {
  // Variable declarations.
  const amount = 6;
  let width = (window.innerWidth / amount) * window.devicePixelRatio;
  let height = (window.innerHeight / amount) * window.devicePixelRatio;
  let aspectRatio = window.innerWidth / window.innerHeight;

  const cameras = [];

  // Cameras initialization.
  for (let y = 0; y < amount; y++) {
    for (let x = 0; x < amount; x++) {
      const subcamera = new THREE.PerspectiveCamera(40, aspectRatio, 0.1, 10);
      subcamera.viewport = new THREE.Vector4(
        Math.floor(x * width),
        Math.floor(y * height),
        Math.ceil(width),
        Math.ceil(height),
      );
      subcamera.position.x = x / amount - 0.5;
      subcamera.position.y = 0.5 - y / amount;
      subcamera.position.z = 1.5;
      subcamera.position.multiplyScalar(2);
      subcamera.lookAt(0, 0, 0);
      subcamera.updateMatrixWorld();
      cameras.push(subcamera);
    }
  }

  // Scene.
  const scene = new THREE.Scene();

  // Camera.
  const camera = new THREE.ArrayCamera(cameras);
  camera.position.z = 3;

  // Ambient Lighting.
  scene.add(new THREE.AmbientLight(0x999999));

  // Directional Lighting.
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(0.5, 0.5, 1);
  light.castShadow = true;
  light.shadow.camera.zoom = 4;
  scene.add(light);

  // Renderer.
  const renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.shadowMap.enabled = true;
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Background.
  const geometryBackground = new THREE.PlaneGeometry(100, 100);
  const materialBackground = new THREE.MeshPhongMaterial({ color: 0x000066 });
  const background = new THREE.Mesh(geometryBackground, materialBackground);
  background.receiveShadow = true;
  background.position.set(0, 0, -1);
  scene.add(background);

  // Cylinder.
  const geometryCylinder = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
  const materialCylinder = new THREE.MeshPhongMaterial({ color: 0xff0000 });
  const mesh = new THREE.Mesh(geometryCylinder, materialCylinder);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  // Window Resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    width = (window.innerWidth / amount) * window.devicePixelRatio;
    height = (window.innerHeight / amount) * window.devicePixelRatio;
    aspectRatio = window.innerWidth / window.innerHeight;
    camera.aspect = aspectRatio;
    camera.updateProjectionMatrix();

    for (let y = 0; y < amount; y++) {
      for (let x = 0; x < amount; x++) {
        const subcamera = camera.cameras[amount * y + x];
        subcamera.viewport.set(
          Math.floor(x * width),
          Math.floor(y * height),
          Math.ceil(width),
          Math.ceil(height),
        );
        subcamera.aspect = aspectRatio;
        subcamera.updateProjectionMatrix();
      }
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Main animation loop.
  function animate() {
    mesh.rotation.x += 0.005;
    mesh.rotation.z += 0.01;

    renderer.render(scene, camera);
  }
}

main();
