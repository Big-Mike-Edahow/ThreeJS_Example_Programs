// main.js

import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { raycaster, pointer, onUpPosition } from "./utils/constants.js";
import { onDownPosition, splineHelperObjects } from "./utils/constants.js";
import { positions, splines, ARC_SEGMENTS, params } from "./utils/constants.js";
import { addPoint, removePoint, addSplineObject } from "./utils/constants.js";
import { transformControl, camera } from "./utils/constants.js";
import { updateSplineOutline, scene, renderer } from "./utils/constants.js";
import { splinePointsLength, render } from "./utils/constants.js";

function main() {
  // Scene.
  scene.background = new THREE.Color(0xf0f0f0);

  // Camera.
  camera.position.set(0, 250, 1000);
  scene.add(camera);

  // Ambient lighting.
  const ambientLight = new THREE.AmbientLight(0xf0f0f0, 3);
  scene.add(ambientLight);

  // Spot light.
  const light = new THREE.SpotLight(0xffffff, 4.5);
  light.position.set(0, 1500, 200);
  light.angle = Math.PI * 0.2;
  light.decay = 0;
  light.castShadow = true;
  light.shadow.camera.near = 200;
  light.shadow.camera.far = 2000;
  light.shadow.bias = -0.000222;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  scene.add(light);

  // Renderer.
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Orbit controls.
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.damping = 0.2;
  controls.addEventListener("change", render);

  // Grid helper.
  const helper = new THREE.GridHelper(2000, 100);
  helper.position.y = -199;
  helper.material.opacity = 0.25;
  helper.material.transparent = true;
  scene.add(helper);

  // Plane geometry.
  const planeGeometry = new THREE.PlaneGeometry(2000, 2000);
  planeGeometry.rotateX(-Math.PI / 2);

  // Plane material.
  const planeMaterial = new THREE.ShadowMaterial({
    color: 0x000000,
    opacity: 0.2,
  });

  // Plane.
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.position.y = -200;
  plane.receiveShadow = true;
  scene.add(plane);

  // GUI.
  const gui = new GUI();
  gui.add(params, "uniform").onChange(render);
  gui
    .add(params, "tension", 0, 1)
    .step(0.01)
    .onChange(function (value) {
      splines.uniform.tension = value;
      updateSplineOutline();
      render();
    });
  gui.add(params, "centripetal").onChange(render);
  gui.add(params, "chordal").onChange(render);
  gui.add(params, "addPoint");
  gui.add(params, "removePoint");
  gui.add(params, "exportSpline");
  gui.open();

  // Transform control.
  transformControl.addEventListener("change", render);
  transformControl.addEventListener("dragging-changed", function (event) {
    controls.enabled = !event.value;
  });
  scene.add(transformControl.getHelper());
  transformControl.addEventListener("objectChange", function () {
    updateSplineOutline();
  });

  /************* Curves **************/
  for (let i = 0; i < splinePointsLength; i++) {
    addSplineObject(positions[i]);
  }
  positions.length = 0;
  for (let i = 0; i < splinePointsLength; i++) {
    positions.push(splineHelperObjects[i].position);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(ARC_SEGMENTS * 3), 3),
  );
  let curve = new THREE.CatmullRomCurve3(positions);
  curve.curveType = "catmullrom";
  curve.mesh = new THREE.Line(
    geometry.clone(),
    new THREE.LineBasicMaterial({
      color: 0xff0000,
      opacity: 0.35,
    }),
  );
  curve.mesh.castShadow = true;
  splines.uniform = curve;
  curve = new THREE.CatmullRomCurve3(positions);
  curve.curveType = "centripetal";
  curve.mesh = new THREE.Line(
    geometry.clone(),
    new THREE.LineBasicMaterial({
      color: 0x00ff00,
      opacity: 0.35,
    }),
  );
  curve.mesh.castShadow = true;
  splines.centripetal = curve;
  curve = new THREE.CatmullRomCurve3(positions);
  curve.curveType = "chordal";
  curve.mesh = new THREE.Line(
    geometry.clone(),
    new THREE.LineBasicMaterial({
      color: 0x0000ff,
      opacity: 0.35,
    }),
  );
  curve.mesh.castShadow = true;
  splines.chordal = curve;
  for (const k in splines) {
    const spline = splines[k];
    scene.add(spline.mesh);
  }
  load([
    new THREE.Vector3(
      289.76843686945404,
      452.51481137238443,
      56.10018915737797,
    ),
    new THREE.Vector3(
      -53.56300074753207,
      171.49711742836848,
      -14.495472686253045,
    ),
    new THREE.Vector3(
      -91.40118730204415,
      176.4306956436485,
      -6.958271935582161,
    ),
    new THREE.Vector3(-383.785318791128, 491.1365363371675, 47.869296953772746),
  ]);
  render();

  // Update the spline's control points to match the provided array.
  function load(new_positions) {
    while (new_positions.length > positions.length) {
      addPoint();
    }
    while (new_positions.length < positions.length) {
      removePoint();
    }
    for (let i = 0; i < positions.length; i++) {
      positions[i].copy(new_positions[i]);
    }
    updateSplineOutline();
  }

  // On pointer down.
  document.addEventListener("pointerdown", onPointerDown);
  function onPointerDown(event) {
    onDownPosition.x = event.clientX;
    onDownPosition.y = event.clientY;
  }

  // On pointer up.
  document.addEventListener("pointerup", onPointerUp);
  function onPointerUp(event) {
    onUpPosition.x = event.clientX;
    onUpPosition.y = event.clientY;
    if (onDownPosition.distanceTo(onUpPosition) === 0) {
      transformControl.detach();
      render();
    }
  }

  // On pointer move.
  document.addEventListener("pointermove", onPointerMove);
  function onPointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(splineHelperObjects, false);
    if (intersects.length > 0) {
      const object = intersects[0].object;
      if (object !== transformControl.object) {
        transformControl.attach(object);
      }
    }
  }

  // Window resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
  }
}

main();
