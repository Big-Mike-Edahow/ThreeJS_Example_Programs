// main.js

import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { MapControls } from "three/addons/controls/MapControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { acceleratedRaycast, computeBatchedBoundsTree } from "three-mesh-bvh";
import { createRadixSort } from "@three.ez/batched-mesh-extensions";
import { extendBatchedMeshPrototype } from "@three.ez/batched-mesh-extensions";
import { getBatchedMeshLODCount } from "@three.ez/batched-mesh-extensions";
import { performanceRangeLOD } from "@three.ez/simplify-geometry";
import { simplifyGeometriesByErrorLOD } from "@three.ez/simplify-geometry";

// Add and override BatchedMesh methods ( @three.ez/batched-mesh-extensions ).
extendBatchedMeshPrototype();

// Add the extension functions ( three-mesh-bvh ).
THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BatchedMesh.prototype.computeBoundsTree = computeBatchedBoundsTree;

const instancesCount = 500000;
let batchedMesh;
let lastHoveredInstance = null;
const lastHoveredColor = new THREE.Color();
const highlight = new THREE.Color("red");
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(1, 1);
const position = new THREE.Vector3();
const quaternion = new THREE.Quaternion();
const scale = new THREE.Vector3(1, 1, 1);
const matrix = new THREE.Matrix4();
const color = new THREE.Color();

async function main() {
  // Window height and width.
  let width = window.innerWidth;
  let height = window.innerHeight;

  // Scene.
  const scene = new THREE.Scene();

  // Camera.
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(0, 20, 55);

  // Renderer.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Stats.
  const stats = new Stats();
  document.body.appendChild(stats.dom);

  // PMREM generator.
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(
    new RoomEnvironment(),
    0.04,
  ).texture;

  // Raycaster.
  raycaster.firstHitOnly = true;

  // Map controls.
  const controls = new MapControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI / 2;

  // Geometries.
  const geometries = [
    new THREE.TorusKnotGeometry(1, 0.4, 256, 32, 1, 1),
    new THREE.TorusKnotGeometry(1, 0.4, 256, 32, 1, 2),
    new THREE.TorusKnotGeometry(1, 0.4, 256, 32, 1, 3),
    new THREE.TorusKnotGeometry(1, 0.4, 256, 32, 1, 4),
    new THREE.TorusKnotGeometry(1, 0.4, 256, 32, 1, 5),
    new THREE.TorusKnotGeometry(1, 0.4, 256, 32, 2, 1),
    new THREE.TorusKnotGeometry(1, 0.4, 256, 32, 2, 3),
    new THREE.TorusKnotGeometry(1, 0.4, 256, 32, 3, 1),
    new THREE.TorusKnotGeometry(1, 0.4, 256, 32, 4, 1),
    new THREE.TorusKnotGeometry(1, 0.4, 256, 32, 5, 3),
  ];

  // Generate 4 LODs (levels of detail) for each geometry.
  const geometriesLODArray = await simplifyGeometriesByErrorLOD(
    geometries,
    4,
    performanceRangeLOD,
  );

  // Create BatchedMesh.
  const { vertexCount, indexCount, LODIndexCount } =
    getBatchedMeshLODCount(geometriesLODArray);
  batchedMesh = new THREE.BatchedMesh(
    instancesCount,
    vertexCount,
    indexCount,
    new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0.8 }),
  );

  // Enable radix sort for better performance.
  batchedMesh.customSort = createRadixSort(batchedMesh);

  // Add geometries and their LODs to the batched mesh.
  // All LODs share the same position array.
  for (let i = 0; i < geometriesLODArray.length; i++) {
    const geometryLOD = geometriesLODArray[i];
    const geometryId = batchedMesh.addGeometry(
      geometryLOD[0],
      -1,
      LODIndexCount[i],
    );
    batchedMesh.addGeometryLOD(geometryId, geometryLOD[1], 50);
    batchedMesh.addGeometryLOD(geometryId, geometryLOD[2], 100);
    batchedMesh.addGeometryLOD(geometryId, geometryLOD[3], 125);
    batchedMesh.addGeometryLOD(geometryId, geometryLOD[4], 200);
  }

  // Place instances in a 2D grid with randomized rotation and color.
  const sqrtCount = Math.ceil(Math.sqrt(instancesCount));
  const size = 5.5;
  const start = (sqrtCount / -2) * size + size / 2;

  // Generate many 3D objects at once using a BatchedMesh.
  for (let i = 0; i < instancesCount; i++) {
    const r = Math.floor(i / sqrtCount);
    const c = i % sqrtCount;
    const id = batchedMesh.addInstance(
      Math.floor(Math.random() * geometriesLODArray.length),
    );
    position.set(c * size + start, 0, r * size + start);
    quaternion.random();
    batchedMesh.setMatrixAt(id, matrix.compose(position, quaternion, scale));
    batchedMesh.setColorAt(id, color.setHSL(Math.random(), 0.6, 0.5));
  }

  // Compute blas (bottom-level acceleration structure) bvh ( three-mesh-bvh ).
  batchedMesh.computeBoundsTree();

  // Compute tlas (top-level acceleration structure) bvh ( @three.ez/batched-mesh-extensions ).
  batchedMesh.computeBVH(THREE.WebGLCoordinateSystem);
  scene.add(batchedMesh);

  // GUI config.
  const config = {
    freeze: false,
    useBVH: true,
    useLOD: true,
  };

  // Set up properties for the Batched Mesh. 
  const bvh = batchedMesh.bvh;
  const lods = batchedMesh._geometryInfo.map((x) => x.LOD);
  const onBeforeRender = batchedMesh.onBeforeRender;

  // GUI.
  const gui = new GUI();
  gui.add(batchedMesh, "instanceCount").disable();
  gui.add(config, "freeze").onChange((v) => {
    batchedMesh.onBeforeRender = v ? () => {} : onBeforeRender;
  });
  const frustumCullingFolder = gui.addFolder("Frustum culling & raycasting");
  frustumCullingFolder.add(config, "useBVH").onChange((v) => {
    batchedMesh.bvh = v ? bvh : null;
  });
  const geometriesFolder = gui.addFolder("Geometries");
  geometriesFolder.add(config, "useLOD").onChange((v) => {
    const geometryInfo = batchedMesh._geometryInfo;
    for (let i = 0; i < geometryInfo.length; i++) {
      geometryInfo[i].LOD = v ? lods[i] : null;
    }
  });

  // Pointer move.
  document.addEventListener("pointermove", onPointerMove);
  function onPointerMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycast();
  }

  // Window resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Raycast.
  function raycast() {
    raycaster.setFromCamera(mouse, camera);
    const intersection = raycaster.intersectObject(batchedMesh);
    const batchId = intersection.length > 0 ? intersection[0].batchId : null;
    if (lastHoveredInstance === batchId) return;
    if (lastHoveredInstance) {
      batchedMesh.setColorAt(lastHoveredInstance, lastHoveredColor);
    }
    if (batchId) {
      batchedMesh.getColorAt(batchId, lastHoveredColor);
      batchedMesh.setColorAt(batchId, highlight);
    }
    lastHoveredInstance = batchId;
  }

  // Main animation loop.
  function animate() {
    stats.begin();
    renderer.render(scene, camera);
    stats.end();
  }

  // Start the animation loop.
  renderer.setAnimationLoop(animate);
}

main();
