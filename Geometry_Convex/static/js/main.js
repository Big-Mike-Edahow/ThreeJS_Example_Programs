// main.js

import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

function main() {
  // Window size.
  let width = window.innerWidth;
  let height = window.innerHeight;

  // Scene.
  const scene = new THREE.Scene();

  // Camera.
  const camera = new THREE.PerspectiveCamera(40, width / height, 1, 1000);
  camera.position.set(15, 20, 30);
  scene.add(camera);

  // Lighting.
  scene.add(new THREE.AmbientLight(0x666666));
  const light = new THREE.PointLight(0xffffff, 3, 0, 0);
  camera.add(light);

  // Renderer.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Orbit Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 20;
  controls.maxDistance = 50;
  controls.maxPolarAngle = Math.PI / 2;

  // Axes Helper.
  scene.add(new THREE.AxesHelper(20));

  // Textures.
  const loader = new THREE.TextureLoader();
  const texture = loader.load("static/textures/disc.png");
  texture.colorSpace = THREE.SRGBColorSpace;

  // Group.
  const group = new THREE.Group();
  scene.add(group);

  // Points.
  let dodecahedronGeometry = new THREE.DodecahedronGeometry(10);

  /* If normal and uv attributes are not removed, mergeVertices() can't
    consolidate identical vertices with different normal/uv data. */
  dodecahedronGeometry.deleteAttribute("normal");
  dodecahedronGeometry.deleteAttribute("uv");

  dodecahedronGeometry =
    BufferGeometryUtils.mergeVertices(dodecahedronGeometry);

  const vertices = [];
  const positionAttribute = dodecahedronGeometry.getAttribute("position");

  for (let i = 0; i < positionAttribute.count; i++) {
    const vertex = new THREE.Vector3();
    vertex.fromBufferAttribute(positionAttribute, i);
    vertices.push(vertex);
  }

  const pointsMaterial = new THREE.PointsMaterial({
    color: 0x0080ff,
    map: texture,
    size: 1,
    alphaTest: 0.5,
  });

  const pointsGeometry = new THREE.BufferGeometry().setFromPoints(vertices);

  const points = new THREE.Points(pointsGeometry, pointsMaterial);
  group.add(points);

  // Convex hull.
  const meshMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    opacity: 0.5,
    side: THREE.DoubleSide,
    transparent: true,
  });

  const meshGeometry = new ConvexGeometry(vertices);

  const mesh = new THREE.Mesh(meshGeometry, meshMaterial);
  group.add(mesh);

  // Responsiveness.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Animation.
  function animate() {
    group.rotation.y += 0.005;

    renderer.render(scene, camera);
  }
}

main();
