import { tan, zeros } from 'mathjs';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import * as MathJS from 'mathjs';
import { light } from '@material-ui/core/styles/createPalette';

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

export default function Background() {
  const canvasRef = useRef();

  useEffect(() => {
    //THREEJS RELATED VARIABLES
    let camera, prop1, prop2, prop3, prop4, drone, floor;

    const raycaster = new THREE.Raycaster();
    const setPoint = new THREE.Vector2();
    const scene = new THREE.Scene();
    const clock = new THREE.Clock();
    const renderer = configureRenderer();

    //SCREEN VARIABLES
    var HEIGHT, WIDTH;

    // Drone Variables
    var state = MathJS.matrix(MathJS.zeros(10, 1));
    state[3] = -20; // initial state
    const prop_range = 0.1;
    const prop_gain = 50;
    var hover_height = 12;

    // Initial setpoint in case mouse is not on screen
    setPoint.x = 0;
    setPoint.y = 0;

    // LOAD SCENE
    const loader = new GLTFLoader();
    loader.load(
      './model/scene (4).gltf',
      (gltf) => {
        // extract drone asset from scene
        scene.add(gltf.scene);
        camera = gltf.cameras[0];

        // extract assets from scene
        drone = scene.getObjectByName('drone');
        prop1 = scene.getObjectByName('prop1');
        prop2 = scene.getObjectByName('prop2');
        prop3 = scene.getObjectByName('prop3');
        prop4 = scene.getObjectByName('prop4');
        floor = scene.getObjectByName('floor');

        textureFloor();
        configureLightSource();
        configureShadows();
        setWindowSize();

        loop();
      },
      undefined,
      (error) => console.error(error),
    );

    function configureShadows() {
      drone.traverse((obj) => {
        if (obj.isMesh) obj.castShadow = true;
      });
      drone.scale.set(1.2, 1.2, 1.2);
      floor.receiveShadow = true;

      light = scene.getObjectByName('DirectionalLight');
      // params for shadow casting
      light.shadow.camera.top = 200;
      light.shadow.camera.bottom = -100;
      light.shadow.camera.left = -150;
      light.shadow.camera.right = 100;

      light.castShadow = true;
      light.shadow.mapSize.height = 1028; // default
      light.shadow.mapSize.width = 1028; // default
      light.shadow.blurSamples = 20;
      light.shadow.camera.near = 0.5; // default
      light.shadow.camera.far = 400; // default
    }

    function textureFloor() {
      // Reskin the floor as a holodeck
      const texture = new THREE.TextureLoader().load(
        './model/textures/texture.png',
      );
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(80, 80);
      floor.material.map = texture;
    }

    function configureLightSource() {
      light = scene.getObjectByName('DirectionalLight');
      light.intensity = 0.9;
      light.target.position.set(0, -10, 0);
    }

    function configureRenderer() {
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });

      renderer.setSize(WIDTH, HEIGHT);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      canvasRef.current.appendChild(renderer.domElement);
      return renderer;
    }

    function assignEventHandlers() {
      window.addEventListener('resize', setWindowSize, false);
      document.addEventListener('mousemove', handleMouseMove, false);
      document.addEventListener('keypress', onButtonPress, false);
      document.addEventListener('touchstart', handleTouchStart, false);
      document.addEventListener('touchmove', handleTouchMove, false);
    }

    function onButtonPress(e) {
      if (e.key === 'q') {
        hover_height += 2;
      } else if (e.key === 'a') {
        hover_height -= 2;
      }
      hover_height = hover_height > 0 ? hover_height : 0;
      hover_height =
        hover_height < 0.8 * camera.position.y
          ? hover_height
          : 0.8 * camera.position.y;
    }

    // updates global variables based on window parameters
    function setWindowSize() {
      HEIGHT = window.innerHeight;
      WIDTH = window.innerWidth;
      renderer.setSize(WIDTH, HEIGHT);
      camera.aspect = WIDTH / HEIGHT;
      camera.updateProjectionMatrix();
    }

    function handleMouseMove(event) {
      setPoint.x = (event.clientX / window.innerWidth) * 2 - 1;
      setPoint.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    function handleTouchStart(event) {
      if (event.touches.length > 1) {
        event.preventDefault();
        setPoint.x = (event.touches.pageX / window.innerWidth) * 2 - 1;
        setPoint.y = -(event.touches.pageY / window.innerHeight) * 2 + 1;
      }
    }

    function handleTouchMove(event) {
      if (event.touches.length == 1) {
        setPoint.x = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
        setPoint.y = -(event.touches[0].pageY / window.innerHeight) * 2 + 1;
      }
    }

    function dynamics(x, u) {
      const m = 0.7;
      const L = 0.2;
      const I = (m * L * L) / 12; //moment of inertia
      const g = 9.81;

      const A = MathJS.matrix([
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0], // x
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // y
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0], // z
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 0], // theta
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // phi
        [0, 0, 0, g, 0, 0, 0, 0, 0, 0], // dx
        [0, 0, 0, 0, g, 0, 0, 0, 0, 0], // dy
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //dz
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //dtheta
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //dphi
      ]);
      const B = MathJS.matrix([
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1 / m, 1 / m, 1 / m, 1 / m], // ddz
        [1 / I, 1 / I, -1 / I, -1 / I], //dd theta
        [1 / I, -1 / I, -1 / I, 1 / I], // ddphi
      ]);

      return MathJS.add(MathJS.multiply(A, x), MathJS.multiply(B, u));
    }

    function controller(x, xstar) {
      // gains calculated via separate Julia script
      const K = [
        [
          0.866, 0.866, 2.2361, 1.801, 1.801, 0.5661, 0.5661, 0.8861, 0.0678,
          0.0678,
        ],
        [
          0.866, -0.866, 2.2361, 1.801, -1.801, 0.5661, -0.5661, 0.8861, 0.0678,
          -0.0678,
        ],
        [
          -0.866, -0.866, 2.2361, -1.801, -1.801, -0.5661, -0.5661, 0.8861,
          -0.0678, -0.0678,
        ],
        [
          -0.866, 0.866, 2.2361, -1.801, 1.801, -0.5661, 0.5661, 0.8861,
          -0.0678, 0.0678,
        ],
      ];

      const error = MathJS.subtract(xstar, x);
      return MathJS.multiply(K, error);
    }

    function euler_step(x, xdot, dt) {
      return MathJS.add(x, MathJS.multiply(xdot, dt));
    }

    function loop() {
      raycaster.setFromCamera(setPoint, camera);
      const intersects = raycaster.intersectObjects(scene.children);

      var setpointx = THREE.MathUtils.clamp(intersects[0].point.x, -200, 200);
      var setpointy = THREE.MathUtils.clamp(intersects[0].point.z, -160, 200);

      var xstar = MathJS.matrix([
        [setpointx],
        [setpointy],
        [hover_height],
        [0],
        [0],
        [0],
        [0],
        [0],
        [0],
        [0],
      ]);

      const u = controller(state, xstar);
      const xdot = dynamics(state, u);

      // Euler step
      const delta = clock.getDelta();
      state = euler_step(state, xdot, delta);

      // animate the propellers
      var u1 = sigmoid(u.get([0, 0]) * prop_range) * prop_gain;
      var u2 = sigmoid(u.get([1, 0]) * prop_range) * prop_gain;
      var u3 = sigmoid(u.get([2, 0]) * prop_range) * prop_gain;
      var u4 = sigmoid(u.get([3, 0]) * prop_range) * prop_gain;

      prop1.rotation.z += delta * u1;
      prop2.rotation.z += delta * u2;
      prop3.rotation.z += delta * u3;
      prop4.rotation.z += delta * u4;

      // update animation
      drone.position.x = state.get([0, 0]);
      drone.position.y = state.get([2, 0]);
      drone.position.z = state.get([1, 0]);

      drone.rotation.x = (0.25 * state.get([4, 0]) * Math.PI) / 180;
      drone.rotation.z = (0.25 * (-1 * state.get([5, 0]) * Math.PI)) / 180;

      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    }

    assignEventHandlers();
  }, []);

  return (
    <div
      ref={canvasRef}
      style={{ position: 'fixed', left: 0, right: 0, bottom: 0, top: 0 }}
    />
  );
}
