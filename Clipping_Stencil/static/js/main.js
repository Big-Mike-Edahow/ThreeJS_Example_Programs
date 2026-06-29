// main.js

import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { createPlaneStencilGroup, params } from "./utils/utilities.js";

function main() {
  // Window width and height.
  let width = window.innerWidth;
  let height = window.innerHeight;

  // Timer.
  const timer = new THREE.Timer();
  timer.connect(document);

  // Scene.
  const scene = new THREE.Scene();

  // Camera.
  const camera = new THREE.PerspectiveCamera(36, width / height, 1, 100);
  camera.position.set(2, 2, 2);

  // Ambient lighting.
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));

  // Directional lighting.
  const dirLight = new THREE.DirectionalLight(0xffffff, 3);
  dirLight.position.set(5, 10, 7.5);
  dirLight.castShadow = true;
  dirLight.shadow.camera.right = 2;
  dirLight.shadow.camera.left = -2;
  dirLight.shadow.camera.top = 2;
  dirLight.shadow.camera.bottom = -2;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  scene.add(dirLight);

  // Planes.
  const planes = [
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),
  ];

  // Plane helpers.
  const planeHelpers = planes.map((p) => new THREE.PlaneHelper(p, 2, 0xffffff));
  planeHelpers.forEach((ph) => {
    ph.visible = false;
    scene.add(ph);
  });

  // Object.
  const geometry = new THREE.TorusKnotGeometry(0.4, 0.15, 220, 60);
  const object = new THREE.Group();
  scene.add(object);

  // Set up clip plane rendering.
  const planeObjects = [];
  const planeGeom = new THREE.PlaneGeometry(4, 4);
  for (let i = 0; i < 3; i++) {
    const poGroup = new THREE.Group();
    const plane = planes[i];
    const stencilGroup = createPlaneStencilGroup(geometry, plane, i + 1);
    // Plane is clipped by the other clipping planes.
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0xe91e63,
      metalness: 0.1,
      roughness: 0.75,
      clippingPlanes: planes.filter((p) => p !== plane),
      stencilWrite: true,
      stencilRef: 0,
      stencilFunc: THREE.NotEqualStencilFunc,
      stencilFail: THREE.ReplaceStencilOp,
      stencilZFail: THREE.ReplaceStencilOp,
      stencilZPass: THREE.ReplaceStencilOp,
    });
    const po = new THREE.Mesh(planeGeom, planeMat);
    po.onAfterRender = function (renderer) {
      renderer.clearStencil();
    };
    po.renderOrder = i + 1.1;
    object.add(stencilGroup);
    poGroup.add(po);
    planeObjects.push(po);
    scene.add(poGroup);
  }

  // Material.
  const material = new THREE.MeshStandardMaterial({
    color: 0xffc107,
    metalness: 0.1,
    roughness: 0.75,
    clippingPlanes: planes,
    clipShadows: true,
    shadowSide: THREE.DoubleSide,
  });

  // Add the color.
  const clippedColorFront = new THREE.Mesh(geometry, material);
  clippedColorFront.castShadow = true;
  clippedColorFront.renderOrder = 6;
  object.add(clippedColorFront);

  // Ground.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9, 1, 1),
    new THREE.ShadowMaterial({
      color: 0x000000,
      opacity: 0.25,
      side: THREE.DoubleSide,
    }),
  );
  ground.rotation.x = -Math.PI / 2; // Rotates X/Y to X/Z.
  ground.position.y = -1;
  ground.receiveShadow = true;
  scene.add(ground);

  // Renderer.
  const renderer = new THREE.WebGLRenderer({ antialias: true, stencil: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x263238);
  renderer.setAnimationLoop(animate);
  renderer.shadowMap.enabled = true;
  renderer.localClippingEnabled = true;
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Stats.
  const stats = new Stats();
  container.appendChild(stats.dom);

  // Orbit controls.
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 2;
  controls.maxDistance = 20;
  controls.update();

  // GUI.
  const gui = new GUI();
  gui.add(params, "animate");
  const planeX = gui.addFolder("planeX");
  planeX
    .add(params.planeX, "displayHelper")
    .onChange((v) => (planeHelpers[0].visible = v));
  planeX
    .add(params.planeX, "constant")
    .min(-1)
    .max(1)
    .onChange((d) => (planes[0].constant = d));
  planeX.add(params.planeX, "negated").onChange(() => {
    planes[0].negate();
    params.planeX.constant = planes[0].constant;
  });
  planeX.open();
  const planeY = gui.addFolder("planeY");
  planeY
    .add(params.planeY, "displayHelper")
    .onChange((v) => (planeHelpers[1].visible = v));
  planeY
    .add(params.planeY, "constant")
    .min(-1)
    .max(1)
    .onChange((d) => (planes[1].constant = d));
  planeY.add(params.planeY, "negated").onChange(() => {
    planes[1].negate();
    params.planeY.constant = planes[1].constant;
  });
  planeY.open();
  const planeZ = gui.addFolder("planeZ");
  planeZ
    .add(params.planeZ, "displayHelper")
    .onChange((v) => (planeHelpers[2].visible = v));
  planeZ
    .add(params.planeZ, "constant")
    .min(-1)
    .max(1)
    .onChange((d) => (planes[2].constant = d));
  planeZ.add(params.planeZ, "negated").onChange(() => {
    planes[2].negate();
    params.planeZ.constant = planes[2].constant;
  });
  planeZ.open();

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
    const delta = timer.getDelta();

    if (params.animate) {
      object.rotation.x += delta * 0.5;
      object.rotation.y += delta * 0.2;
    }

    for (let i = 0; i < planeObjects.length; i++) {
      const plane = planes[i];
      const po = planeObjects[i];
      plane.coplanarPoint(po.position);
      po.lookAt(
        po.position.x - plane.normal.x,
        po.position.y - plane.normal.y,
        po.position.z - plane.normal.z,
      );
    }

    stats.begin();
    renderer.render(scene, camera);
    stats.end();
  }
}

main();
