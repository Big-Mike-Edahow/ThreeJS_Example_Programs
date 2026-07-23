// main.js

import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

THREE.Cache.enabled = true;

let cameraTarget, textMesh1, textMesh2, textGeo;

let firstLetter = true;
let text = "ThreeJS",
  bevelEnabled = true,
  font = undefined,
  fontName = "optimer",
  fontWeight = "bold";

const depth = 20,
  size = 70,
  hover = 30,
  curveSegments = 4,
  bevelThickness = 2,
  bevelSize = 1.5;
  
const mirror = true;

const fontMap = {
  helvetiker: 0,
  optimer: 1,
  gentilis: 2,
  "droid_sans": 3,
  "droid_serif": 4,
};

const weightMap = {
  regular: 0,
  bold: 1,
};

const reverseFontMap = [];
const reverseWeightMap = [];

for (const i in fontMap) reverseFontMap[fontMap[i]] = i;
for (const i in weightMap) reverseWeightMap[weightMap[i]] = i;

let targetRotation = 0;
let targetRotationOnPointerDown = 0;

let pointerX = 0;
let pointerXOnPointerDown = 0;

let windowHalfX = window.innerWidth / 2;
let width = window.innerWidth;
let height = window.innerHeight;

let fontIndex = 1;

function main() {
  // Scene.
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 250, 1400);

  // Camera.
  const camera = new THREE.PerspectiveCamera(30, width / height, 1, 1500);
  camera.position.set(0, 400, 700);
  cameraTarget = new THREE.Vector3(0, 150, 0);

  // Directional light.
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
  dirLight.position.set(0, 0, 1).normalize();
  scene.add(dirLight);

  // Point light.
  const pointLight = new THREE.PointLight(0xffffff, 4.5, 0, 0);
  pointLight.color.setHSL(Math.random(), 1, 0.5);
  pointLight.position.set(0, 100, 90);
  scene.add(pointLight);

  // Renderer.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Group.
  const materials = [
    new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true }), // front
    new THREE.MeshPhongMaterial({ color: 0xffffff }), // side
  ];
  const group = new THREE.Group();
  group.position.y = 100;
  scene.add(group);

  // Plane.
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(10000, 10000),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.5,
      transparent: true,
    }),
  );
  plane.position.y = 100;
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  // Object parameters.
  const params = {
    changeColor: function () {
      pointLight.color.setHSL(Math.random(), 1, 0.5);
    },
    changeFont: function () {
      fontIndex++;
      fontName = reverseFontMap[fontIndex % reverseFontMap.length];
      loadFont();
    },
    changeWeight: function () {
      if (fontWeight === "bold") {
        fontWeight = "regular";
      } else {
        fontWeight = "bold";
      }
      loadFont();
    },
    changeBevel: function () {
      bevelEnabled = !bevelEnabled;
      refreshText();
    },
  };

  // GUI.
  const gui = new GUI();
  gui.add(params, "changeColor").name("change color");
  gui.add(params, "changeFont").name("change font");
  gui.add(params, "changeWeight").name("change weight");
  gui.add(params, "changeBevel").name("change bevel");
  gui.open();

  // On document key down.
  document.addEventListener("keydown", onDocumentKeyDown);
  function onDocumentKeyDown(event) {
    if (firstLetter) {
      firstLetter = false;
      text = "";
    }
    const keyCode = event.keyCode;
    if (keyCode == 8) {
      event.preventDefault();
      text = text.substring(0, text.length - 1);
      refreshText();
      return false;
    }
  }

  // On document keypress.
  document.addEventListener("keypress", onDocumentKeyPress);
  function onDocumentKeyPress(event) {
    const keyCode = event.which;
    if (keyCode == 8) {
      event.preventDefault();
    } else {
      const ch = String.fromCharCode(keyCode);
      text += ch;
      refreshText();
    }
  }

  // Load the specified fonts.
  function loadFont() {
    const loader = new FontLoader();
    loader.load(
      "static/fonts/" + fontName + "_" + fontWeight + ".typeface.json",
      function (response) {
        font = response;
        refreshText();
      },
    );
  }

  // Create the text.
  function createText() {
    textGeo = new TextGeometry(text, {
      font: font,
      size: size,
      depth: depth,
      curveSegments: curveSegments,
      bevelThickness: bevelThickness,
      bevelSize: bevelSize,
      bevelEnabled: bevelEnabled,
    });
    textGeo.computeBoundingBox();
    const centerOffset =
      -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
    textMesh1 = new THREE.Mesh(textGeo, materials);
    textMesh1.position.x = centerOffset;
    textMesh1.position.y = hover;
    textMesh1.position.z = 0;
    textMesh1.rotation.x = 0;
    textMesh1.rotation.y = Math.PI * 2;
    group.add(textMesh1);
    if (mirror) {
      textMesh2 = new THREE.Mesh(textGeo, materials);
      textMesh2.position.x = centerOffset;
      textMesh2.position.y = -hover;
      textMesh2.position.z = depth;
      textMesh2.rotation.x = Math.PI;
      textMesh2.rotation.y = Math.PI * 2;
      group.add(textMesh2);
    }
  }

  // Refresh the text.
  function refreshText() {
    group.remove(textMesh1);
    if (mirror) group.remove(textMesh2);
    if (!text) return;
    createText();
  }

  /******* Event listeners. *******/
  container.style.touchAction = "none";

  // On pointer down.
  container.addEventListener("pointerdown", onPointerDown);
  function onPointerDown(event) {
    if (event.isPrimary === false) return;
    pointerXOnPointerDown = event.clientX - windowHalfX;
    targetRotationOnPointerDown = targetRotation;
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  }

  // On pointer move.
  function onPointerMove(event) {
    if (event.isPrimary === false) return;
    pointerX = event.clientX - windowHalfX;
    targetRotation =
      targetRotationOnPointerDown + (pointerX - pointerXOnPointerDown) * 0.02;
  }

  // On pointer up.
  function onPointerUp(event) {
    if (event.isPrimary === false) return;
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
  }

  // Window resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Main animation loop.
  function animate() {
    group.rotation.y += (targetRotation - group.rotation.y) * 0.05;
    camera.lookAt(cameraTarget);

    renderer.clear();
    renderer.render(scene, camera);
  }

  loadFont();
}

main();
