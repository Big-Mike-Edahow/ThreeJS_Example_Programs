// utilities.js

import * as THREE from "three";

export const params = {
  format: THREE.DepthFormat,
  type: THREE.UnsignedShortType,
  samples: 0,
};

export const formats = {
  DepthFormat: THREE.DepthFormat,
  DepthStencilFormat: THREE.DepthStencilFormat,
};

export const types = {
  UnsignedShortType: THREE.UnsignedShortType,
  UnsignedIntType: THREE.UnsignedIntType,
  FloatType: THREE.FloatType,
};
