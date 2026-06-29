// utilities.js

import * as THREE from "three";

// Settings for clipping planes.
export const params = {
  // Turn the cut planes on or off.
  animate: true,

  // Cut settings for the X-axis.
  planeX: {
    constant: 0,
    negated: false,
    displayHelper: false,
  },

  // Cut settings for the Y-axis.
  planeY: {
    constant: 0,
    negated: false,
    displayHelper: false,
  },

  // Cut settings for the Z-axis.
  planeZ: {
    constant: 0,
    negated: false,
    displayHelper: false,
  },
};

// Creates a stencil mask group for a 3D geometry used with clipping planes.
export function createPlaneStencilGroup(geometry, plane, renderOrder) {
  const group = new THREE.Group();
  const baseMat = new THREE.MeshBasicMaterial();
  baseMat.depthWrite = false;
  baseMat.depthTest = false;
  baseMat.colorWrite = false;
  baseMat.stencilWrite = true;
  baseMat.stencilFunc = THREE.AlwaysStencilFunc;

  // Back faces.
  const mat0 = baseMat.clone();
  mat0.side = THREE.BackSide;
  mat0.clippingPlanes = [plane];
  mat0.stencilFail = THREE.IncrementWrapStencilOp;
  mat0.stencilZFail = THREE.IncrementWrapStencilOp;
  mat0.stencilZPass = THREE.IncrementWrapStencilOp;

  const mesh0 = new THREE.Mesh(geometry, mat0);
  mesh0.renderOrder = renderOrder;
  group.add(mesh0);

  // Front faces.
  const mat1 = baseMat.clone();
  mat1.side = THREE.FrontSide;
  mat1.clippingPlanes = [plane];
  mat1.stencilFail = THREE.DecrementWrapStencilOp;
  mat1.stencilZFail = THREE.DecrementWrapStencilOp;
  mat1.stencilZPass = THREE.DecrementWrapStencilOp;

  const mesh1 = new THREE.Mesh(geometry, mat1);
  mesh1.renderOrder = renderOrder;
  group.add(mesh1);

  return group;
}
