// constants.js

import * as THREE from "three";
import { TransformControls } from "three/addons/controls/TransformControls.js";

let width = window.innerWidth;
let height = window.innerHeight;
export let splinePointsLength = 4;

const point = new THREE.Vector3();
export const raycaster = new THREE.Raycaster();
export const pointer = new THREE.Vector2();
export const onUpPosition = new THREE.Vector2();
export const onDownPosition = new THREE.Vector2();
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(70, width / height, 1, 10000);
export const renderer = new THREE.WebGLRenderer({ antialias: true });
export const transformControl = new TransformControls(
  camera,
  renderer.domElement,
);

export const splineHelperObjects = [];
export const positions = [];
export const splines = {};

export const ARC_SEGMENTS = 200;

export const params = {
  uniform: true,
  tension: 0.5,
  centripetal: true,
  chordal: true,
  addPoint: addPoint,
  removePoint: removePoint,
  exportSpline: exportSpline,
};

// Add a new point to the spline, update the line geometry, and redraw.
export function addPoint() {
  splinePointsLength++;
  positions.push(addSplineObject().position);
  updateSplineOutline();
  render();
}

// Remove the last point from the spline and scene.
export function removePoint() {
  if (splinePointsLength <= 4) {
    return;
  }
  const point = splineHelperObjects.pop();
  splinePointsLength--;
  positions.pop();
  if (transformControl.object === point) transformControl.detach();
  scene.remove(point);
  updateSplineOutline();
  render();
}

// Extract path data from a visual spline editor to use in the scene.
function exportSpline() {
  const strplace = [];
  for (let i = 0; i < splinePointsLength; i++) {
    const p = splineHelperObjects[i].position;
    strplace.push(`new THREE.Vector3(${p.x}, ${p.y}, ${p.z})`);
  }
  console.log(strplace.join(",\n"));
  const code = "[" + strplace.join(",\n\t") + "]";
  prompt("copy and paste code", code);
}

// Add an interactive control point/helper object for the curve spline.
export function addSplineObject(position) {
  const geometry = new THREE.BoxGeometry(20, 20, 20);
  const material = new THREE.MeshLambertMaterial({
    color: Math.random() * 0xffffff,
  });
  const object = new THREE.Mesh(geometry, material);
  if (position) {
    object.position.copy(position);
  } else {
    object.position.x = Math.random() * 1000 - 500;
    object.position.y = Math.random() * 600;
    object.position.z = Math.random() * 800 - 400;
  }
  object.castShadow = true;
  object.receiveShadow = true;
  scene.add(object);
  splineHelperObjects.push(object);
  return object;
}

// Update the visual vertices of curve meshes based on mathematical splines.
export function updateSplineOutline() {
  for (const k in splines) {
    const spline = splines[k];

    const splineMesh = spline.mesh;
    const position = splineMesh.geometry.attributes.position;

    for (let i = 0; i < ARC_SEGMENTS; i++) {
      const t = i / (ARC_SEGMENTS - 1);
      spline.getPoint(t, point);
      position.setXYZ(i, point.x, point.y, point.z);
    }
    position.needsUpdate = true;
  }
}

// Update the visibility of spline meshes. Render the scene.
export function render() {
  splines.uniform.mesh.visible = params.uniform;
  splines.centripetal.mesh.visible = params.centripetal;
  splines.chordal.mesh.visible = params.chordal;
  renderer.render(scene, camera);
}
