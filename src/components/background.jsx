import { tan, zeros } from 'mathjs';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import * as MathJS from 'mathjs';

export default function Background() {
  const canvasRef = useRef();

  useEffect(() => {
    //THREEJS RELATED VARIABLES
    var scene,
      camera,
      fieldOfView,
      aspectRatio,
      nearPlane,
      farPlane,
      shadowLight,
      light,
      renderer,
      clock;

    //SCREEN VARIABLES
    var HEIGHT, WIDTH, windowHalfX, windowHalfY, xLimit, yLimit;

    var drone;

    var state = MathJS.matrix(MathJS.zeros(6, 1));

    // MISC
    var mousePos = { x: 0, y: 0 };

    function init() {
      // To work with THREEJS, you need a scene, a camera, and a renderer

      // create the scene;
      scene = new THREE.Scene();

      // create the camera
      HEIGHT = window.innerHeight;
      WIDTH = window.innerWidth;
      aspectRatio = WIDTH / HEIGHT;

      fieldOfView = 60;
      nearPlane = 1; // the camera won't "see" any object placed in front of this plane
      farPlane = 2000; // the camera wont't see any object placed further than this plane
      camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane,
      );
      camera.position.z = 50;

      //create the renderer
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(WIDTH, HEIGHT);
      canvasRef.current.appendChild(renderer.domElement);

      // convert the field of view to radians
      var ang = ((fieldOfView / 2) * Math.PI) / 180;

      //  y limit because fielOfView is a vertical field of view.
      // I then calculate the x Limit
      xLimit = yLimit * camera.aspect;

      // precalculate the center of the screen, used to update the speed depending on the mouse position
      windowHalfX = WIDTH / 2;
      windowHalfY = HEIGHT / 2;

      // Create a clock to help simulate
      clock = new THREE.Clock();

      // handling resize and mouse move events
      window.addEventListener('resize', onWindowResize, false);
      document.addEventListener('mousemove', handleMouseMove, false);
      // let's make it work on mobile too
      document.addEventListener('touchstart', handleTouchStart, false);
      document.addEventListener('touchend', handleTouchEnd, false);
      document.addEventListener('touchmove', handleTouchMove, false);
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
        [0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 1],
        [0, 0, g, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ]);
      const B = MathJS.matrix([
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [1 / m, 1 / m],
        [1 / I, -1 / I],
      ]);

      return MathJS.add(MathJS.multiply(A, x), MathJS.multiply(B, u));
    }

    function controller(x, xstar) {
      const K = [
        [2.23607, 2.23607, 2.08685, 0.977927, 1.2531, 0.0993444],
        [-2.23607, 2.23607, -2.08685, -0.977927, 1.2531, -0.0993444],
      ];

      const error = MathJS.subtract(xstar, x);
      return MathJS.multiply(K, error);
    }

    function euler_step(x, xdot, dt) {
      return MathJS.add(x, MathJS.multiply(xdot, dt));
    }

    function loop() {
      var ang = (fieldOfView * Math.PI) / 180;

      // color update depending on the speed
      // Project mouse position into drones plane
      const alpha_x = (camera.position.z / WIDTH) * MathJS.tan(ang);
      const alpha_y = (camera.position.z / HEIGHT) * MathJS.tan(ang);

      var setpointx = (mousePos.x - WIDTH / 2) * alpha_x;
      var setpointy = (HEIGHT / 2 - mousePos.y) * alpha_y;

      var xstar = MathJS.matrix([[setpointx], [setpointy], [0], [0], [0], [0]]);

      const u = controller(state, xstar);
      const xdot = dynamics(state, u);

      // Calculate elapsed time
      const delta = clock.getDelta();
      state = euler_step(state, xdot, delta);

      console.log(state.get([0, 0]));
      drone.position.x = state.get([0, 0]);
      drone.position.y = state.get([1, 0]);
      drone.rotation.z = (-1 * state.get([2, 0]) * Math.PI) / 180;

      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    }

    // Lights
    // I use 2 lights, an hemisphere to give a global ambient light
    // And a harder light to add some shadows
    function createLight() {
      light = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.8);
      scene.add(light);
      light.position.set(1, 2, 3);
      shadowLight = new THREE.DirectionalLight(0xffffff, 1.0);
      shadowLight.position.set(20, 20, 20);
      scene.add(shadowLight);
    }

    function createFish() {
      drone = new THREE.Group();

      // Load the model
      const loader = new GLTFLoader();
      loader.load(
        './model/scene.gltf',
        (gltf) => {
          drone.add(gltf.scene);
          console.log(gltf.scene);
        },
        undefined,
        (error) => console.error(error),
      );

      scene.add(drone);
    }

    function hexToRgb(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    }

    init();
    createLight();
    createFish();
    loop();
    //   setInterval(flyParticle, 70); // launch a new particle every 70ms
  }, []);

  return (
    <div
      ref={canvasRef}
      style={{ position: 'fixed', left: 0, right: 0, bottom: 0, top: 0 }}
    />
  );
}
