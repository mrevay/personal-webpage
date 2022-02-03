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
    let scene,
      camera,
      fieldOfView,
      aspectRatio,
      prop1,
      prop2,
      prop3,
      prop4,
      renderer,
      clock,
      drone,
      floor;

    console.log('Loading Scene');

    // LOAD SCENE
    scene = new THREE.Scene();

    const loader = new GLTFLoader();
    loader.load(
      './model/scene (3).gltf',
      (gltf) => {
        // extract drone asset from scene
        console.log('Loading full Scene', gltf);
        scene.add(gltf.scene);

        camera = gltf.cameras[0];
        console.log(camera);

        drone = scene.getObjectByName('drone');
        prop1 = scene.getObjectByName('prop1');
        prop2 = scene.getObjectByName('prop2');
        prop3 = scene.getObjectByName('prop3');
        prop4 = scene.getObjectByName('prop4');
        floor = scene.getObjectByName('floor');

        // Turn on shadows
        drone.traverse((obj) => {
          if (obj.isMesh) obj.castShadow = true;
        });

        // light = scene.getObjectByName('PointLight');
        // light = new THREE.DirectionalLight(0xffffff, 5.0);
        light = scene.getObjectByName('DirectionalLight');
        light.intensity = 0.5;
        light.target.position.set(0, -10, 0);

        const shadow_width = 100;
        light.shadow.camera.top = shadow_width;
        light.shadow.camera.bottom = -shadow_width;
        light.shadow.camera.left = shadow_width;
        light.shadow.camera.right = -shadow_width;

        light.castShadow = true;
        light.shadow.mapSize.height = 1028; // default
        light.shadow.mapSize.width = 1028; // default
        light.shadow.blurSamples = 20;
        light.shadow.camera.near = 0.5; // default
        light.shadow.camera.far = 400; // default

        floor.receiveShadow = true;

        console.log(drone);

        loop();
      },
      undefined,
      (error) => console.error(error),
    );

    //SCREEN VARIABLES
    var HEIGHT, WIDTH, windowHalfX, windowHalfY, xLimit, yLimit;

    var state = MathJS.matrix(MathJS.zeros(10, 1));
    state[3] = -20; // initial state
    const base_prop_speed = 10;
    const prop_range = 0.1;
    const prop_gain = 50;
    var hover_height = 12;

    // MISC
    var mousePos = { x: 0, y: 0 };

    function init() {
      // To work with THREEJS, you need a scene, a camera, and a renderer

      // create the camera
      HEIGHT = window.innerHeight;
      WIDTH = window.innerWidth;
      aspectRatio = WIDTH / HEIGHT;

      //create the renderer
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(WIDTH, HEIGHT);
      renderer.gammaInput = true;
      renderer.gammaOutput = true;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      canvasRef.current.appendChild(renderer.domElement);

      mousePos = { x: WIDTH / 2, y: HEIGHT / 2 };

      // Create a clock to help simulate
      clock = new THREE.Clock();

      // handling resize and mouse move events
      window.addEventListener('resize', onWindowResize, false);
      document.addEventListener('mousemove', handleMouseMove, false);
      document.addEventListener('mousemove', handleMouseMove, false);

      document.addEventListener('keypress', onButtonPress, false);

      // let's make it work on mobile too
      document.addEventListener('touchstart', handleTouchStart, false);
      document.addEventListener('touchend', handleTouchEnd, false);
      document.addEventListener('touchmove', handleTouchMove, false);
    }

    function onButtonPress(e) {
      if (e.key === 'q') {
        hover_height += 1;
      } else if (e.key === 'a') {
        hover_height -= 1;
      }
      hover_height = hover_height > 0 ? hover_height : 0;
      hover_height =
        hover_height < 0.8 * camera.position.y
          ? hover_height
          : 0.8 * camera.position.y;
    }

    function onWindowResize() {
      HEIGHT = window.innerHeight;
      WIDTH = window.innerWidth;
      windowHalfX = WIDTH / 2;
      windowHalfY = HEIGHT / 2;
      renderer.setSize(WIDTH, HEIGHT);
      camera.aspect = WIDTH / HEIGHT;
      camera.updateProjectionMatrix(); // force the camera to update its aspect ratio
      // recalculate the limits
      var ang = ((fieldOfView / 2) * Math.PI) / 180;
      yLimit = camera.position.z * Math.tan(ang);
      xLimit = yLimit * camera.aspect;
    }

    function handleMouseMove(event) {
      // console.log(event);
      // mousePos.x = event.clientX == null ? mousePos.x : event.clientX;
      // mousePos.y = event.clientY == null ? mousePos.y : event.clientY;
      mousePos = { x: event.clientX, y: event.clientY };
    }

    function handleTouchStart(event) {
      if (event.touches.length > 1) {
        event.preventDefault();
        mousePos = { x: event.touches[0].pageX, y: event.touches[0].pageY };
        updateSpeed();
      }
    }

    function handleTouchEnd(event) {
      mousePos = { x: windowHalfX, y: windowHalfY };
      updateSpeed();
    }

    function handleTouchMove(event) {
      if (event.touches.length == 1) {
        event.preventDefault();
        mousePos = { x: event.touches[0].pageX, y: event.touches[0].pageY };
        updateSpeed();
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
          1.118, 1.118, 2.2361, 1.3969, 1.3969, 0.5665, 0.5665, 0.8861, 0.0643,
          0.0643,
        ],
        [
          1.118, -1.118, 2.2361, 1.3969, -1.3969, 0.5665, -0.5665, 0.8861,
          0.0643, -0.0643,
        ],
        [
          -1.118, -1.118, 2.2361, -1.3969, -1.3969, -0.5665, -0.5665, 0.8861,
          -0.0643, -0.0643,
        ],
        [
          -1.118, 1.118, 2.2361, -1.3969, 1.3969, -0.5665, 0.5665, 0.8861,
          -0.0643, 0.0643,
        ],
      ];

      const error = MathJS.subtract(xstar, x);
      return MathJS.multiply(K, error);
    }

    function euler_step(x, xdot, dt) {
      return MathJS.add(x, MathJS.multiply(xdot, dt));
    }

    function loop() {
      var setpointx = (mousePos.x - WIDTH / 2) / 20;
      var setpointy = (mousePos.y - HEIGHT / 2) / 20;

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

      try {
        // animate the propellers
        // var u1 = base_prop_speed + u.get([0, 0]) * prop_gain;
        // var u2 = base_prop_speed + u.get([1, 0]) * prop_gain;
        // var u3 = base_prop_speed + u.get([2, 0]) * prop_gain;
        // var u4 = base_prop_speed + u.get([3, 0]) * prop_gain;

        var u1 = sigmoid(u.get([0, 0]) * prop_range) * prop_gain;
        var u2 = sigmoid(u.get([1, 0]) * prop_range) * prop_gain;
        var u3 = sigmoid(u.get([2, 0]) * prop_range) * prop_gain;
        var u4 = sigmoid(u.get([3, 0]) * prop_range) * prop_gain;

        prop1.rotation.z += delta * u1;
        prop2.rotation.z += delta * u2;
        prop3.rotation.z += delta * u3;
        prop4.rotation.z += delta * u4;
      } catch (error) {
        console.log(error);
      }

      // update animation
      drone.position.x = state.get([0, 0]);
      drone.position.y = state.get([2, 0]);
      drone.position.z = state.get([1, 0]);

      drone.rotation.x = (1 * state.get([4, 0]) * Math.PI) / 180;
      drone.rotation.z = (0.5 * (-1 * state.get([5, 0]) * Math.PI)) / 180;

      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    }

    init();
  }, []);

  return (
    <div
      ref={canvasRef}
      style={{ position: 'fixed', left: 0, right: 0, bottom: 0, top: 0 }}
    />
  );
}
