// main.js

import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { assignTransformedPlanes } from "./imports/helpers.js";
import { createPlanes, Planes, Empty } from "./imports/helpers.js";
import { PlaneMatrices, GlobalClippingPlanes } from "./imports/helpers.js";

function main() {
  // Variable declarations.
  let startTime = Date.now();
  let width = window.innerWidth;
  let height = window.innerHeight;

  // Scene.
  const scene = new THREE.Scene();

  // Camera.
  const camera = new THREE.PerspectiveCamera(36, width / height, 0.25, 16);
  camera.position.set(0, 1.5, 3);

  // Ambient lighting.
  scene.add(new THREE.AmbientLight(0xffffff));

  // Spotlight.
  const spotLight = new THREE.SpotLight(0xffffff, 60);
  spotLight.angle = Math.PI / 5;
  spotLight.penumbra = 0.2;
  spotLight.position.set(2, 3, 3);
  spotLight.castShadow = true;
  spotLight.shadow.camera.near = 3;
  spotLight.shadow.camera.far = 10;
  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;
  scene.add(spotLight);

  // Directional lighting.
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(0, 2, 0);
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 10;
  dirLight.shadow.camera.right = 1;
  dirLight.shadow.camera.left = -1;
  dirLight.shadow.camera.top = 1;
  dirLight.shadow.camera.bottom = -1;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  scene.add(dirLight);

  // Geometry.
  const clipMaterial = new THREE.MeshPhongMaterial({
    color: 0xee0a10,
    shininess: 100,
    side: THREE.DoubleSide,
    // Clipping setup:
    clippingPlanes: createPlanes(Planes.length),
    clipShadows: true,
  });

  // Object.
  const count = 5 * 5 * 5;
  const geometry = new THREE.BoxGeometry(0.18, 0.18, 0.18);
  const object = new THREE.InstancedMesh(geometry, clipMaterial, count);
  object.castShadow = true;
  let i = 0;
  const matrix = new THREE.Matrix4();
  for (let z = -2; z <= 2; ++z)
    for (let y = -2; y <= 2; ++y)
      for (let x = -2; x <= 2; ++x) {
        matrix.setPosition(x / 5, y / 5, z / 5);
        object.setMatrixAt(i++, matrix);
      }
  scene.add(object);

  // Plane geometry.
  const planeGeometry = new THREE.PlaneGeometry(3, 3, 1, 1),
    color = new THREE.Color();

  // Volume visualiztion.
  const volumeVisualization = new THREE.Group();
  volumeVisualization.visible = false;
  for (let i = 0, n = Planes.length; i !== n; ++i) {
    const material = new THREE.MeshBasicMaterial({
      color: color.setHSL(i / n, 0.5, 0.5).getHex(),
      side: THREE.DoubleSide,
      opacity: 0.2,
      transparent: true,
      // Clip to the others to show the volume.
      clippingPlanes: clipMaterial.clippingPlanes.filter(function (_, j) {
        return j !== i;
      }),
    });
    const mesh = new THREE.Mesh(planeGeometry, material);
    mesh.matrixAutoUpdate = false;
    volumeVisualization.add(mesh);
  }
  scene.add(volumeVisualization);

  // Ground.
  const ground = new THREE.Mesh(
    planeGeometry,
    new THREE.MeshPhongMaterial({
      color: 0xa0adaf,
      shininess: 10,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.scale.multiplyScalar(3);
  ground.receiveShadow = true;
  scene.add(ground);

  // Renderer.
  const renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.shadowMap.enabled = true;
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Clipping setup:
  const globalClippingPlanes = createPlanes(GlobalClippingPlanes.length);
  renderer.clippingPlanes = Empty;
  renderer.localClippingEnabled = true;

  // Stats.
  const stats = new Stats();
  container.appendChild(stats.dom);

  // Controls.
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 1;
  controls.maxDistance = 8;
  controls.target.set(0, 1, 0);
  controls.update();

  // GUI.
  const gui = new GUI(),
    folder = gui.addFolder("Local Clipping"),
    props = {
      get Enabled() {
        return renderer.localClippingEnabled;
      },
      set Enabled(v) {
        renderer.localClippingEnabled = v;
        if (!v) volumeVisualization.visible = false;
      },
      get Shadows() {
        return clipMaterial.clipShadows;
      },
      set Shadows(v) {
        clipMaterial.clipShadows = v;
      },
      get Visualize() {
        return volumeVisualization.visible;
      },
      set Visualize(v) {
        if (renderer.localClippingEnabled) volumeVisualization.visible = v;
      },
    };
  folder.add(props, "Enabled");
  folder.add(props, "Shadows");
  folder.add(props, "Visualize").listen();
  gui.addFolder("Global Clipping").add(
    {
      get Enabled() {
        return renderer.clippingPlanes !== Empty;
      },
      set Enabled(v) {
        renderer.clippingPlanes = v ? globalClippingPlanes : Empty;
      },
    },
    "Enabled",
  );

  // Window resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Set the orientation of an object based on a world matrix.
  function setObjectWorldMatrix(object, matrix) {
    const parent = object.parent;
    scene.updateMatrixWorld();
    object.matrix.copy(parent.matrixWorld).invert();
    object.applyMatrix4(matrix);
  }

  // Transform.
  const transform = new THREE.Matrix4(),
    tmpMatrix = new THREE.Matrix4();

  // Main animation loop.
  function animate() {
    const currentTime = Date.now();
    const time = (currentTime - startTime) / 1000;
    object.position.y = 1;
    object.rotation.x = time * 0.5;
    object.rotation.y = time * 0.2;
    object.updateMatrix();
    transform.copy(object.matrix);

    const bouncy = Math.cos(time * 0.5) * 0.5 + 0.7;
    transform.multiply(tmpMatrix.makeScale(bouncy, bouncy, bouncy));
    assignTransformedPlanes(clipMaterial.clippingPlanes, Planes, transform);

    const planeMeshes = volumeVisualization.children;
    for (let i = 0, n = planeMeshes.length; i !== n; ++i) {
      tmpMatrix.multiplyMatrices(transform, PlaneMatrices[i]);
      setObjectWorldMatrix(planeMeshes[i], tmpMatrix);
    }
    transform.makeRotationY(time * 0.1);
    assignTransformedPlanes(
      globalClippingPlanes,
      GlobalClippingPlanes,
      transform,
    );

    stats.begin();
    renderer.render(scene, camera);
    stats.end();
  }
}

main();
