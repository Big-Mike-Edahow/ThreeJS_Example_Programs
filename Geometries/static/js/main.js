// main.js

import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";
import { plane, klein } from "three/addons/geometries/ParametricFunctions.js";
import { mobius } from "three/addons/geometries/ParametricFunctions.js";

const points = [];
let object, geometry;
let width = window.innerWidth;
let height = window.innerHeight;

function main() {
  // Scene.
  const scene = new THREE.Scene();

  // Camera.
  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
  camera.position.y = 500;

  // Ambient lighting.
  const ambientLight = new THREE.AmbientLight(0xcccccc, 1.5);
  scene.add(ambientLight);

  // Point lighting.
  const pointLight = new THREE.PointLight(0xffffff, 2.5, 0, 0);
  camera.add(pointLight);
  scene.add(camera);

  // Renderer.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Stats.
  const stats = new Stats();
  document.body.appendChild(stats.dom);

  // Load and configure the UV grid texture for a double-sided material.
  const map = new THREE.TextureLoader().load(
    "static/textures/uv_grid_opengl.jpg",
  );
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 16;
  map.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshPhongMaterial({
    map: map,
    side: THREE.DoubleSide,
  });

  // Sphere.
  object = new THREE.Mesh(new THREE.SphereGeometry(75, 20, 10), material);
  object.position.set(-300, 0, 300);
  scene.add(object);

  // Icosahedron.
  object = new THREE.Mesh(new THREE.IcosahedronGeometry(75), material);
  object.position.set(-100, 0, 300);
  scene.add(object);

  // Octahedron.
  object = new THREE.Mesh(new THREE.OctahedronGeometry(75), material);
  object.position.set(100, 0, 300);
  scene.add(object);

  // Tetrahedron.
  object = new THREE.Mesh(new THREE.TetrahedronGeometry(75), material);
  object.position.set(300, 0, 300);
  scene.add(object);

  // Rectangle.
  object = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 4, 4), material);
  object.position.set(-300, 0, 100);
  scene.add(object);

  // Cube
  object = new THREE.Mesh(
    new THREE.BoxGeometry(100, 100, 100, 4, 4, 4),
    material,
  );
  object.position.set(-100, 0, 100);
  scene.add(object);

  // Circle.
  object = new THREE.Mesh(
    new THREE.CircleGeometry(50, 20, 0, Math.PI * 2),
    material,
  );
  object.position.set(100, 0, 100);
  scene.add(object);

  // Ring.
  object = new THREE.Mesh(
    new THREE.RingGeometry(10, 50, 20, 5, 0, Math.PI * 2),
    material,
  );
  object.position.set(300, 0, 100);
  scene.add(object);

  // Cylinder.
  object = new THREE.Mesh(
    new THREE.CylinderGeometry(25, 75, 100, 40, 5),
    material,
  );
  object.position.set(-300, 0, -100);
  scene.add(object);

  // Generate 50 points using nested sine waves for an organic, wavy profile.
  // X represents the radius, Y represents the height.
  for (let i = 0; i < 50; i++) {
    points.push(
      new THREE.Vector2(
        Math.sin(i * 0.2) * Math.sin(i * 0.1) * 15 + 50,
        (i - 5) * 2,
      ),
    );
  }

  // Lathe.
  object = new THREE.Mesh(new THREE.LatheGeometry(points, 20), material);
  object.position.set(-100, 0, -100);
  scene.add(object);

  // Torus.
  object = new THREE.Mesh(new THREE.TorusGeometry(50, 20, 20, 20), material);
  object.position.set(100, 0, -100);
  scene.add(object);

  // Torusknot.
  object = new THREE.Mesh(
    new THREE.TorusKnotGeometry(50, 10, 50, 20),
    material,
  );
  object.position.set(300, 0, -100);
  scene.add(object);

  // Capsule.
  object = new THREE.Mesh(new THREE.CapsuleGeometry(20, 50), material);
  object.position.set(-300, 0, -300);
  scene.add(object);

  // Plane.
  geometry = new ParametricGeometry(plane, 10, 10);
  geometry.scale(100, 100, 100);
  geometry.center();
  object = new THREE.Mesh(geometry, material);
  object.position.set(-100, 0, -300);
  scene.add(object);

  // Klein.
  geometry = new ParametricGeometry(klein, 20, 20);
  object = new THREE.Mesh(geometry, material);
  object.position.set(100, 0, -300);
  object.scale.multiplyScalar(5);
  scene.add(object);

  // Mobius.
  geometry = new ParametricGeometry(mobius, 20, 20);
  object = new THREE.Mesh(geometry, material);
  object.position.set(300, 0, -300);
  object.scale.multiplyScalar(30);
  scene.add(object);

  // Window resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Main animation loop.
  function animate() {
    const timer = Date.now() * 0.0001;
    camera.position.x = Math.cos(timer) * 800;
    camera.position.z = Math.sin(timer) * 800;
    camera.lookAt(scene.position);
    scene.traverse(function (object) {
      if (object.isMesh === true) {
        object.rotation.x = timer * 5;
        object.rotation.y = timer * 2.5;
      }
    });
    renderer.render(scene, camera);
    stats.update();
  }
}

main();
