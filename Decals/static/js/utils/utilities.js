// utilities.js

import * as THREE from "three";

export const textureLoader = new THREE.TextureLoader();
const decalNormal = textureLoader.load("static/models/decal-normal.jpg");
const decalDiffuse = textureLoader.load("static/models/decal-diffuse.png");
decalDiffuse.colorSpace = THREE.SRGBColorSpace;

export const intersection = {
  intersects: false,
  point: new THREE.Vector3(),
  normal: new THREE.Vector3(),
};

export const decalMaterial = new THREE.MeshPhongMaterial({
  specular: 0x444444,
  map: decalDiffuse,
  normalMap: decalNormal,
  normalScale: new THREE.Vector2(1, 1),
  shininess: 30,
  transparent: true,
  depthTest: true,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -4,
  wireframe: false,
});

function removeDecals() {
  decals.forEach(function (d) {
    mesh.remove(d);
  });

  decals.length = 0;
}

export const params = {
  minScale: 10,
  maxScale: 20,
  rotate: true,
  clear: function () {
    removeDecals();
  },
};
