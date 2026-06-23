// main.js

import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { CCDIKSolver } from "three/addons/animation/CCDIKSolver.js";
import { CCDIKHelper } from "three/addons/animation/CCDIKSolver.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

let scene, camera, renderer, orbitControls, transformControls;
let mirrorSphereCamera;

const OOI = {};
let IKSolver;

let stats, gui, conf;
const v0 = new THREE.Vector3();

async function main() {
  // IK config.
  conf = {
    followSphere: false,
    turnHead: true,
    ik_solver: true,
    update: updateIK,
  };

  // Window width and height.
  let width = window.innerWidth;
  let height = window.innerHeight;

  // Scene.
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xffffff, 0.17);
  scene.background = new THREE.Color(0xffffff);

  // Camera.
  camera = new THREE.PerspectiveCamera(55, width / height, 0.001, 5000);
  camera.position.set(
    0.9728517749133652,
    1.1044765132727201,
    0.7316689528482836,
  );
  camera.lookAt(scene.position);

  // Ambient lighting.
  const ambientLight = new THREE.AmbientLight(0xffffff, 8); // soft white light
  scene.add(ambientLight);

  // DRACO loader.
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");

  // GLTF loader.
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);
  const gltf = await gltfLoader.loadAsync("static/models/kira.glb");
  gltf.scene.traverse((n) => {
    if (n.name === "head") OOI.head = n;
    if (n.name === "lowerarm_l") OOI.lowerarm_l = n;
    if (n.name === "Upperarm_l") OOI.Upperarm_l = n;
    if (n.name === "hand_l") OOI.hand_l = n;
    if (n.name === "target_hand_l") OOI.target_hand_l = n;

    if (n.name === "boule") OOI.sphere = n;
    if (n.name === "Kira_Shirt_left") OOI.kira = n;
  });
  scene.add(gltf.scene);

  // Target position for orbit controls.
  const targetPosition = OOI.sphere.position.clone();
  OOI.hand_l.attach(OOI.sphere);

  // Mirror sphere cube-camera.
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024);
  mirrorSphereCamera = new THREE.CubeCamera(0.05, 50, cubeRenderTarget);
  scene.add(mirrorSphereCamera);
  const mirrorSphereMaterial = new THREE.MeshBasicMaterial({
    envMap: cubeRenderTarget.texture,
  });
  OOI.sphere.material = mirrorSphereMaterial;
  OOI.kira.add(OOI.kira.skeleton.bones[0]);
  const iks = [
    {
      target: 22, // "target_hand_l"
      effector: 6, // "hand_l"
      links: [
        {
          index: 5, // "lowerarm_l"
          rotationMin: new THREE.Vector3(1.2, -1.8, -0.4),
          rotationMax: new THREE.Vector3(1.7, -1.1, 0.3),
        },
        {
          index: 4, // "Upperarm_l"
          rotationMin: new THREE.Vector3(0.1, -0.7, -1.8),
          rotationMax: new THREE.Vector3(1.1, 0, -1.4),
        },
      ],
    },
  ];

  // IK Solver.
  IKSolver = new CCDIKSolver(OOI.kira, iks);
  const ccdikhelper = new CCDIKHelper(OOI.kira, iks, 0.01);
  scene.add(ccdikhelper);

  // GUI.
  gui = new GUI();
  gui.add(conf, "followSphere").name("follow sphere");
  gui.add(conf, "turnHead").name("turn head");
  gui.add(conf, "ik_solver").name("IK auto update");
  gui.add(conf, "update").name("IK manual update()");
  gui.open();

  // Renderer.
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Orbit controls.
  orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.minDistance = 0.2;
  orbitControls.maxDistance = 1.5;
  orbitControls.enableDamping = true;
  orbitControls.target.copy(targetPosition);

  // Transform controls.
  transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.size = 0.75;
  transformControls.showX = false;
  transformControls.space = "world";
  transformControls.attach(OOI.target_hand_l);
  scene.add(transformControls.getHelper());

  // Disable orbit controls while using transform controls.
  transformControls.addEventListener(
    "mouseDown",
    () => (orbitControls.enabled = false),
  );
  transformControls.addEventListener(
    "mouseUp",
    () => (orbitControls.enabled = true),
  );

  // Stats.
  stats = new Stats();
  document.body.appendChild(stats.dom);

  // Window resize.
  window.addEventListener("resize", onWindowResize, false);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Main animation loop.
  function animate() {
    if (OOI.sphere && mirrorSphereCamera) {
      OOI.sphere.visible = false;
      OOI.sphere.getWorldPosition(mirrorSphereCamera.position);
      mirrorSphereCamera.update(renderer, scene);
      OOI.sphere.visible = true;
    }

    // Orbit controls follow the sphere.
    if (OOI.sphere && conf.followSphere) {
      OOI.sphere.getWorldPosition(v0);
      orbitControls.target.lerp(v0, 0.1);
    }

    // Turn head.
    if (OOI.head && OOI.sphere && conf.turnHead) {
      OOI.sphere.getWorldPosition(v0);
      OOI.head.lookAt(v0);
      OOI.head.rotation.set(
        OOI.head.rotation.x,
        OOI.head.rotation.y + Math.PI,
        OOI.head.rotation.z,
      );
    }

    if (conf.ik_solver) {
      updateIK();
    }

    // Update controls and render scene.
    orbitControls.update();
    renderer.render(scene, camera);
    stats.update();
  }

  function updateIK() {
    if (IKSolver) IKSolver.update();

    scene.traverse(function (object) {
      if (object.isSkinnedMesh) object.computeBoundingSphere();
    });
  }
}

main();
