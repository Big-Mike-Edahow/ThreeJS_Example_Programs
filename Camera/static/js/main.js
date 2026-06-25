// main.js

import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";

function main() {
  // Window width and height..
  let SCREEN_WIDTH = window.innerWidth;
  let SCREEN_HEIGHT = window.innerHeight;

  // Camera properties.
  let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
  const frustumSize = 600;

  // Scene.
  const scene = new THREE.Scene();

  // Camera.
  const camera = new THREE.PerspectiveCamera(50, 0.5 * aspect, 1, 10000);
  camera.position.z = 2500;

  // Perspective camera.
  const cameraPerspective = new THREE.PerspectiveCamera(
    50,
    0.5 * aspect,
    150,
    1000,
  );

  // Perspective camera helper.
  const cameraPerspectiveHelper = new THREE.CameraHelper(cameraPerspective);
  scene.add(cameraPerspectiveHelper);

  // Ortho camera.
  const cameraOrtho = new THREE.OrthographicCamera(
    (0.5 * frustumSize * aspect) / -2,
    (0.5 * frustumSize * aspect) / 2,
    frustumSize / 2,
    frustumSize / -2,
    150,
    1000,
  );

  // Ortho camera helper.
  const cameraOrthoHelper = new THREE.CameraHelper(cameraOrtho);
  scene.add(cameraOrthoHelper);

  // Active camera.
  const activeCamera = cameraPerspective;
  const activeHelper = cameraPerspectiveHelper;

  // Counteract different front orientation of cameras vs rig.
  cameraOrtho.rotation.y = Math.PI;
  cameraPerspective.rotation.y = Math.PI;

  // Camera rig.
  const cameraRig = new THREE.Group();
  cameraRig.add(cameraPerspective);
  cameraRig.add(cameraOrtho);
  scene.add(cameraRig);

  // Mesh.
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(100, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }),
  );
  scene.add(mesh);

  // Mesh2.
  const mesh2 = new THREE.Mesh(
    new THREE.SphereGeometry(50, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true }),
  );
  mesh2.position.y = 150;
  mesh.add(mesh2);

  // Mesh3.
  const mesh3 = new THREE.Mesh(
    new THREE.SphereGeometry(5, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true }),
  );
  mesh3.position.z = 150;
  cameraRig.add(mesh3);

  // Geometry.
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  for (let i = 0; i < 10000; i++) {
    vertices.push(THREE.MathUtils.randFloatSpread(2000)); // x
    vertices.push(THREE.MathUtils.randFloatSpread(2000)); // y
    vertices.push(THREE.MathUtils.randFloatSpread(2000)); // z
  }
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );

  // Particles.
  const particles = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0x888888 }),
  );
  scene.add(particles);

  // Renderer.
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  renderer.setAnimationLoop(animate);
  renderer.setScissorTest(true);

  // Threejs container.
  const container = document.querySelector("#threejs-container");
  container.appendChild(renderer.domElement);

  // Stats.
  const stats = new Stats();
  container.appendChild(stats.dom);

  // Window resize.
  window.addEventListener("resize", onWindowResize);
  function onWindowResize() {
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    camera.aspect = 0.5 * aspect;
    camera.updateProjectionMatrix();
    cameraPerspective.aspect = 0.5 * aspect;
    cameraPerspective.updateProjectionMatrix();
    cameraOrtho.left = (-0.5 * frustumSize * aspect) / 2;
    cameraOrtho.right = (0.5 * frustumSize * aspect) / 2;
    cameraOrtho.top = frustumSize / 2;
    cameraOrtho.bottom = -frustumSize / 2;
    cameraOrtho.updateProjectionMatrix();
  }

  // On keydown.
  document.addEventListener("keydown", onKeyDown);
  function onKeyDown(event) {
    switch (event.keyCode) {
      case 79 /*O*/:
        activeCamera = cameraOrtho;
        activeHelper = cameraOrthoHelper;
        break;
      case 80 /*P*/:
        activeCamera = cameraPerspective;
        activeHelper = cameraPerspectiveHelper;
        break;
    }
  }

  // Render.
  function render() {
    const r = Date.now() * 0.0005;

    mesh.position.x = 700 * Math.cos(r);
    mesh.position.z = 700 * Math.sin(r);
    mesh.position.y = 700 * Math.sin(r);

    mesh.children[0].position.x = 70 * Math.cos(2 * r);
    mesh.children[0].position.z = 70 * Math.sin(r);

    if (activeCamera === cameraPerspective) {
      cameraPerspective.fov = 35 + 30 * Math.sin(0.5 * r);
      cameraPerspective.far = mesh.position.length();
      cameraPerspective.updateProjectionMatrix();
      cameraPerspectiveHelper.update();
      cameraPerspectiveHelper.visible = true;
      cameraOrthoHelper.visible = false;
    } else {
      cameraOrtho.far = mesh.position.length();
      cameraOrtho.updateProjectionMatrix();

      cameraOrthoHelper.update();
      cameraOrthoHelper.visible = true;
      cameraPerspectiveHelper.visible = false;
    }

    cameraRig.lookAt(mesh.position);
    activeHelper.visible = false;

    renderer.setClearColor(0x000000, 1);
    renderer.setScissor(0, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT);
    renderer.setViewport(0, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT);
    renderer.render(scene, activeCamera);
    activeHelper.visible = true;

    renderer.setClearColor(0x111111, 1);
    renderer.setScissor(SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT);
    renderer.setViewport(SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT);
    renderer.render(scene, camera);
  }

  // Main animation loop.
  function animate() {
    render();
    stats.update();
  }
}

main();
