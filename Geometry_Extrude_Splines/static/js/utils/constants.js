// constants.js

import * as THREE from "three";
import * as Curves from "three/addons/curves/CurveExtras.js";

export const direction = new THREE.Vector3();
export const binormal = new THREE.Vector3();
export const normal = new THREE.Vector3();
export const position = new THREE.Vector3();
export const lookAt = new THREE.Vector3();

const pipeSpline = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 10, -10),
  new THREE.Vector3(10, 0, -10),
  new THREE.Vector3(20, 0, 0),
  new THREE.Vector3(30, 0, 10),
  new THREE.Vector3(30, 0, 20),
  new THREE.Vector3(20, 0, 30),
  new THREE.Vector3(10, 0, 30),
  new THREE.Vector3(0, 0, 30),
  new THREE.Vector3(-10, 10, 30),
  new THREE.Vector3(-10, 20, 30),
  new THREE.Vector3(0, 30, 30),
  new THREE.Vector3(10, 30, 30),
  new THREE.Vector3(20, 30, 15),
  new THREE.Vector3(10, 30, 10),
  new THREE.Vector3(0, 30, 10),
  new THREE.Vector3(-10, 20, 10),
  new THREE.Vector3(-10, 10, 10),
  new THREE.Vector3(0, 0, 10),
  new THREE.Vector3(10, -10, 10),
  new THREE.Vector3(20, -15, 10),
  new THREE.Vector3(30, -15, 10),
  new THREE.Vector3(40, -15, 10),
  new THREE.Vector3(50, -15, 10),
  new THREE.Vector3(60, 0, 10),
  new THREE.Vector3(70, 0, 0),
  new THREE.Vector3(80, 0, 0),
  new THREE.Vector3(90, 0, 0),
  new THREE.Vector3(100, 0, 0),
]);

const sampleClosedSpline = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, -40, -40),
  new THREE.Vector3(0, 40, -40),
  new THREE.Vector3(0, 140, -40),
  new THREE.Vector3(0, 40, 40),
  new THREE.Vector3(0, -40, 40),
]);
sampleClosedSpline.curveType = "catmullrom";
sampleClosedSpline.closed = true;

// Keep a dictionary of Curve instances
export const splines = {
  GrannyKnot: new Curves.GrannyKnot(),
  HeartCurve: new Curves.HeartCurve(3.5),
  VivianiCurve: new Curves.VivianiCurve(70),
  KnotCurve: new Curves.KnotCurve(),
  HelixCurve: new Curves.HelixCurve(),
  TrefoilKnot: new Curves.TrefoilKnot(),
  TorusKnot: new Curves.TorusKnot(20),
  CinquefoilKnot: new Curves.CinquefoilKnot(20),
  TrefoilPolynomialKnot: new Curves.TrefoilPolynomialKnot(14),
  FigureEightPolynomialKnot: new Curves.FigureEightPolynomialKnot(),
  DecoratedTorusKnot4a: new Curves.DecoratedTorusKnot4a(),
  DecoratedTorusKnot4b: new Curves.DecoratedTorusKnot4b(),
  DecoratedTorusKnot5a: new Curves.DecoratedTorusKnot5a(),
  DecoratedTorusKnot5c: new Curves.DecoratedTorusKnot5c(),
  PipeSpline: pipeSpline,
  SampleClosedSpline: sampleClosedSpline,
};

export const params = {
  spline: "GrannyKnot",
  scale: 4,
  extrusionSegments: 100,
  radiusSegments: 3,
  closed: true,
  animationView: false,
  lookAhead: false,
  cameraHelper: false,
};
