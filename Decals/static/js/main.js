// main.js

import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { DecalGeometry } from "three/addons/geometries/DecalGeometry.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { textureLoader } from "./utils/utilities.js";
import { decalMaterial, intersection, params } from "./utils/utilities.js";

// Constants and variable declarations.
const mouse = new THREE.Vector2();
const intersects = [];
const decals = [];
const position = new THREE.Vector3();
const orientation = new THREE.Euler();
const size = new THREE.Vector3(10, 10, 10);
let mesh;

function main() {
  // Window width and height.
  let width = window.innerWidth;
  let height = window.innerHeight;

  // Scene.
  const scene = new THREE.Scene();

  // Camera.
  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
  camera.position.z = 120;

  // Renderer.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Stats.
  const stats = new Stats();
  container.appendChild(stats.dom);

  // Orbit controls.
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 50;
  controls.maxDistance = 200;

  // Ambient lighting.
  scene.add(new THREE.AmbientLight(0x666666));

  // Directional lighting.
  const dirLight1 = new THREE.DirectionalLight(0xffddcc, 3);
  dirLight1.position.set(1, 0.75, 0.5);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xccccff, 3);
  dirLight2.position.set(-1, 0.75, -0.5);
  scene.add(dirLight2);

  // Geometry.
  const geometry = new THREE.BufferGeometry();
  geometry.setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);

  // Line.
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial());
  scene.add(line);

  // Texture loader.
  const map = textureLoader.load("static/models/Map-COL.jpg");
  map.colorSpace = THREE.SRGBColorSpace;
  const specularMap = textureLoader.load("static/models/Map-SPEC.jpg");
  const normalMap = textureLoader.load(
    "static/models/Infinite-Level_02_Tangent_SmoothUV.jpg",
  );

  // GLTF loader.
  const loader = new GLTFLoader();
  loader.load("static/models/LeePerrySmith.glb", function (gltf) {
    mesh = gltf.scene.children[0];
    mesh.material = new THREE.MeshPhongMaterial({
      specular: 0x111111,
      map: map,
      specularMap: specularMap,
      normalMap: normalMap,
      shininess: 25,
    });
    scene.add(mesh);
    mesh.scale.multiplyScalar(10);
  });

  // Raycaster.
  const raycaster = new THREE.Raycaster();

  // GUI.
  const gui = new GUI();
  gui.add(params, "minScale", 1, 30);
  gui.add(params, "maxScale", 1, 30);
  gui.add(params, "rotate");
  gui.add(params, "clear");
  gui.open();

  // Mouse helper.
  const mouseHelper = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 10),
    new THREE.MeshNormalMaterial(),
  );
  mouseHelper.visible = false;
  scene.add(mouseHelper);

  // Input.
  let moved = false;
  controls.addEventListener("change", function () {
    moved = true;
  });
  window.addEventListener("pointerdown", function () {
    moved = false;
  });
  window.addEventListener("pointerup", function (event) {
    if (moved === false) {
      checkIntersection(event.clientX, event.clientY);

      if (intersection.intersects) shoot();
    }
  });
  window.addEventListener("pointermove", onPointerMove);
  function onPointerMove(event) {
    if (event.isPrimary) {
      checkIntersection(event.clientX, event.clientY);
    }
  }

  // Check intersection.
  function checkIntersection(x, y) {
    if (mesh === undefined) return;

    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    raycaster.intersectObject(mesh, false, intersects);

    if (intersects.length > 0) {
      const p = intersects[0].point;
      mouseHelper.position.copy(p);
      intersection.point.copy(p);

      const normalMatrix = new THREE.Matrix3().getNormalMatrix(
        mesh.matrixWorld,
      );

      const n = intersects[0].face.normal.clone();
      n.applyNormalMatrix(normalMatrix);
      n.multiplyScalar(10);
      n.add(intersects[0].point);

      intersection.normal.copy(intersects[0].face.normal);
      mouseHelper.lookAt(n);

      const positions = line.geometry.attributes.position;
      positions.setXYZ(0, p.x, p.y, p.z);
      positions.setXYZ(1, n.x, n.y, n.z);
      positions.needsUpdate = true;

      intersection.intersects = true;

      intersects.length = 0;
    } else {
      intersection.intersects = false;
    }
  }

  // Shoot.
  function shoot() {
    position.copy(intersection.point);
    orientation.copy(mouseHelper.rotation);
    if (params.rotate) orientation.z = Math.random() * 2 * Math.PI;
    const scale =
      params.minScale + Math.random() * (params.maxScale - params.minScale);
    size.set(scale, scale, scale);
    const material = decalMaterial.clone();
    material.color.setHex(Math.random() * 0xffffff);
    const m = new THREE.Mesh(
      new DecalGeometry(mesh, position, orientation, size),
      material,
    );
    m.renderOrder = decals.length; // Give decals a fixed render order.
    decals.push(m);
    mesh.attach(m);
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
    renderer.render(scene, camera);
    stats.update();
  }
}

main();
