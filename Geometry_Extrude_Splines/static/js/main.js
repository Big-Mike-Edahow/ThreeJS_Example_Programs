// main.js

import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { direction, binormal, normal } from "./utils/constants.js";
import { position, lookAt, splines, params } from "./utils/constants.js";

let tubeGeometry, mesh;
let width = window.innerWidth;
let height = window.innerHeight;

function main() {
  // Scene.
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // Camera.
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 10000);
  camera.position.set(0, 50, 500);

  // lighting.
  scene.add(new THREE.AmbientLight(0xffffff));
  const light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(0, 0, 1);
  scene.add(light);

  // Renderer.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Orbit controls.
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 100;
  controls.maxDistance = 2000;

  // Stats.
  const stats = new Stats();
  container.appendChild(stats.dom);

  // Tube
  const parent = new THREE.Object3D();
  scene.add(parent);
  const splineCamera = new THREE.PerspectiveCamera(
    84,
    width / height,
    0.01,
    1000,
  );
  parent.add(splineCamera);
  const cameraHelper = new THREE.CameraHelper(splineCamera);
  scene.add(cameraHelper);
  addTube();

  // Debug camera.
  const cameraEye = new THREE.Mesh(
    new THREE.SphereGeometry(5),
    new THREE.MeshBasicMaterial({ color: 0xdddddd }),
  );
  parent.add(cameraEye);
  cameraHelper.visible = params.cameraHelper;
  cameraEye.visible = params.cameraHelper;

  // GUI
  const gui = new GUI({ width: 285 });
  const folderGeometry = gui.addFolder("Geometry");
  folderGeometry
    .add(params, "spline", Object.keys(splines))
    .onChange(function () {
      addTube();
    });
  folderGeometry
    .add(params, "scale", 2, 10)
    .step(2)
    .onChange(function () {
      setScale();
    });
  folderGeometry
    .add(params, "extrusionSegments", 50, 500)
    .step(50)
    .onChange(function () {
      addTube();
    });
  folderGeometry
    .add(params, "radiusSegments", 2, 12)
    .step(1)
    .onChange(function () {
      addTube();
    });
  folderGeometry.add(params, "closed").onChange(function () {
    addTube();
  });
  folderGeometry.open();

  const folderCamera = gui.addFolder("Camera");
  folderCamera.add(params, "animationView").onChange(function () {
    animateCamera();
  });
  folderCamera.add(params, "lookAhead").onChange(function () {
    animateCamera();
  });
  folderCamera.add(params, "cameraHelper").onChange(function () {
    animateCamera();
  });
  folderCamera.open();

  // Window resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Main Animation loop.
  function animate() {
    // Animate camera along spline.
    const time = Date.now();
    const looptime = 20 * 1000;
    const t = (time % looptime) / looptime;
    tubeGeometry.parameters.path.getPointAt(t, position);
    position.multiplyScalar(params.scale);

    // Interpolation.
    const segments = tubeGeometry.tangents.length;
    const pickt = t * segments;
    const pick = Math.floor(pickt);
    const pickNext = (pick + 1) % segments;

    // Calculate the Frenet-Serret frame (or TNB frame) along a 3D curve.
    binormal.subVectors(
      tubeGeometry.binormals[pickNext],
      tubeGeometry.binormals[pick],
    );
    binormal.multiplyScalar(pickt - pick).add(tubeGeometry.binormals[pick]);
    tubeGeometry.parameters.path.getTangentAt(t, direction);
    const offset = 15;
    normal.copy(binormal).cross(direction);

    // We move on an offset on its binormal.
    position.add(normal.clone().multiplyScalar(offset));
    splineCamera.position.copy(position);
    cameraEye.position.copy(position);

    // Using arclength for stabilization in look ahead.
    tubeGeometry.parameters.path.getPointAt(
      (t + 30 / tubeGeometry.parameters.path.getLength()) % 1,
      lookAt,
    );
    lookAt.multiplyScalar(params.scale);

    // Camera orientation 2 - up orientation via normal.
    if (!params.lookAhead) lookAt.copy(position).add(direction);
    splineCamera.matrix.lookAt(splineCamera.position, lookAt, normal);
    splineCamera.quaternion.setFromRotationMatrix(splineCamera.matrix);

    // Update the visual guides. Render the scene using either the animated
    // spline camera, or the camera. Update the performance monitor.
    cameraHelper.update();
    renderer.render(
      scene,
      params.animationView === true ? splineCamera : camera,
    );
    stats.update();
  }

  // Clears the previous mesh. Updates the scene's tube geometry
  // based on the current UI params.

  function addTube() {
    if (mesh !== undefined) {
      parent.remove(mesh);
      mesh.geometry.dispose();
    }
    const extrudePath = splines[params.spline];
    tubeGeometry = new THREE.TubeGeometry(
      extrudePath,
      params.extrusionSegments,
      2,
      params.radiusSegments,
      params.closed,
    );
    addGeometry(tubeGeometry);
    setScale();
  }

  // Apply a uniform scale to all axes based on config params.
  function setScale() {
    mesh.scale.set(params.scale, params.scale, params.scale);
  }

  // Create a composite 3D object by wrapping the geometry in a solid, light
  // reactive material, and overlay a semi-transparent wireframe.
  function addGeometry(geometry) {
    const material = new THREE.MeshLambertMaterial({ color: 0xff00ff });
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      opacity: 0.3,
      wireframe: true,
      transparent: true,
    });
    mesh = new THREE.Mesh(geometry, material);
    const wireframe = new THREE.Mesh(geometry, wireframeMaterial);
    mesh.add(wireframe);
    parent.add(mesh);
  }

  // Toggle the visibility of the camera helper and eye mesh based on UI params.
  function animateCamera() {
    cameraHelper.visible = params.cameraHelper;
    cameraEye.visible = params.cameraHelper;
  }
}

main();

