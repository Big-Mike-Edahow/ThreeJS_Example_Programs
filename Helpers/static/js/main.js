// main.js

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VertexNormalsHelper } from "three/addons/helpers/VertexNormalsHelper.js";
import { VertexTangentsHelper } from "three/addons/helpers/VertexTangentsHelper.js";

let vnh;
let vth;
let width = window.innerWidth;
let height = window.innerHeight;

function main() {
  // Scene.
  const scene = new THREE.Scene();

  // Camera.
  const camera = new THREE.PerspectiveCamera(70, width / height, 1, 1000);
  camera.position.z = 400;

  // Lighting.
  const light = new THREE.PointLight();
  light.position.set(200, 100, 150);
  scene.add(light);
  scene.add(new THREE.PointLightHelper(light, 15));

  // Renderer.
  const renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Grid helper.
  const gridHelper = new THREE.GridHelper(400, 40, 0x0000ff, 0x808080);
  gridHelper.position.y = -150;
  gridHelper.position.x = -150;
  scene.add(gridHelper);

  // Polar grid helper.
  const polarGridHelper = new THREE.PolarGridHelper(
    200,
    16,
    8,
    64,
    0x0000ff,
    0x808080,
  );
  polarGridHelper.position.y = -150;
  polarGridHelper.position.x = 200;
  scene.add(polarGridHelper);

  // GLTF loader.
  const loader = new GLTFLoader();
  loader.load("static/models/LeePerrySmith.glb", function (gltf) {
    const mesh = gltf.scene.children[0];
    mesh.geometry.computeTangents();
    const group = new THREE.Group();
    group.scale.multiplyScalar(50);
    scene.add(group);
    group.updateMatrixWorld(true);
    group.add(mesh);
    vnh = new VertexNormalsHelper(mesh, 5);
    scene.add(vnh);
    vth = new VertexTangentsHelper(mesh, 5);
    scene.add(vth);
    scene.add(new THREE.BoxHelper(mesh));
    const wireframe = new THREE.WireframeGeometry(mesh.geometry);
    let line = new THREE.LineSegments(wireframe);
    line.material.depthTest = false;
    line.material.opacity = 0.25;
    line.material.transparent = true;
    line.position.x = 4;
    group.add(line);
    scene.add(new THREE.BoxHelper(line));
    const edges = new THREE.EdgesGeometry(mesh.geometry);
    line = new THREE.LineSegments(edges);
    line.material.depthTest = false;
    line.material.opacity = 0.25;
    line.material.transparent = true;
    line.position.x = -4;
    group.add(line);
    scene.add(new THREE.BoxHelper(line));
    scene.add(new THREE.BoxHelper(group));
    scene.add(new THREE.BoxHelper(scene));
  });

  // Window resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Main animation loop.
  function animate() {
    const time = -performance.now() * 0.0003;
    camera.position.x = 400 * Math.cos(time);
    camera.position.z = 400 * Math.sin(time);
    camera.lookAt(scene.position);
    light.position.x = Math.sin(time * 1.7) * 300;
    light.position.y = Math.cos(time * 1.5) * 400;
    light.position.z = Math.cos(time * 1.3) * 300;
    if (vnh) vnh.update();
    if (vth) vth.update();
    renderer.render(scene, camera);
  }
}

main();
