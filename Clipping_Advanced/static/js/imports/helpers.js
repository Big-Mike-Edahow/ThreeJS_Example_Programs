// helpers.js

import * as THREE from "three";

// Defines the triangular faces of a 3D tetrahedron.
const Indices = [0, 1, 2, 0, 2, 3, 0, 3, 1, 1, 3, 2];

// A regular tetrahedron for the clipping volume:
const Vertices = [
  new THREE.Vector3(+1, 0, +Math.SQRT1_2),
  new THREE.Vector3(-1, 0, +Math.SQRT1_2),
  new THREE.Vector3(0, +1, -Math.SQRT1_2),
  new THREE.Vector3(0, -1, -Math.SQRT1_2),
];

// Creates a clipping volume from a convex triangular mesh,
// specified by the arrays 'vertices' and 'indices'.
function planesFromMesh(vertices, indices) {
  const n = indices.length / 3,
    result = new Array(n);
  for (let i = 0, j = 0; i < n; ++i, j += 3) {
    const a = vertices[indices[j]],
      b = vertices[indices[j + 1]],
      c = vertices[indices[j + 2]];
    result[i] = new THREE.Plane().setFromCoplanarPoints(a, b, c);
  }
  return result;
}

// Create a set of objects that form the sides of an n-sided polygon.
function cylindricalPlanes(n, innerRadius) {
  const result = createPlanes(n);
  for (let i = 0; i !== n; ++i) {
    const plane = result[i],
      angle = (i * Math.PI * 2) / n;
    plane.normal.set(Math.cos(angle), 0, Math.sin(angle));
    plane.constant = innerRadius;
  }
  return result;
}

// Creates a matrix that aligns X/Y to a given plane.
export const planeToMatrix = (function () {
  const xAxis = new THREE.Vector3();
  const yAxis = new THREE.Vector3();
  const trans = new THREE.Vector3();

  return function planeToMatrix(plane) {
    const zAxis = plane.normal,
      matrix = new THREE.Matrix4();
    // Build an Orthonormal Basis from a Unit Vector.
    if (Math.abs(zAxis.x) > Math.abs(zAxis.z)) {
      yAxis.set(-zAxis.y, zAxis.x, 0);
    } else {
      yAxis.set(0, -zAxis.z, zAxis.y);
    }
    xAxis.crossVectors(yAxis.normalize(), zAxis);
    plane.coplanarPoint(trans);
    return matrix.set(
      xAxis.x,
      yAxis.x,
      zAxis.x,
      trans.x,
      xAxis.y,
      yAxis.y,
      zAxis.y,
      trans.y,
      xAxis.z,
      yAxis.z,
      zAxis.z,
      trans.z,
      0,
      0,
      0,
      1,
    );
  };
})();

// Creates an array of n uninitialized plane objects.
export function createPlanes(n) {
  const result = new Array(n);
  for (let i = 0; i !== n; ++i) result[i] = new THREE.Plane();
  return result;
}

// Sets an array of existing planes to transformed 'planesIn'.
export function assignTransformedPlanes(planesOut, planesIn, matrix) {
  for (let i = 0, n = planesIn.length; i !== n; ++i)
    planesOut[i].copy(planesIn[i]).applyMatrix4(matrix);
}

// Named exports for individual constants.
export const GlobalClippingPlanes = cylindricalPlanes(5, 2.5);
export const Planes = planesFromMesh(Vertices, Indices);
export const PlaneMatrices = Planes.map(planeToMatrix);
export const Empty = Object.freeze([]);
