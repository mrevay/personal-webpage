import { tan, zeros } from 'mathjs';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import * as MathJS from 'mathjs';
import { CatchingPokemonSharp } from '@mui/icons-material';

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
      light,
      renderer,
      clock,
      drone;

    //SCREEN VARIABLES
    var HEIGHT, WIDTH, windowHalfX, windowHalfY, xLimit, yLimit;

    var state = MathJS.matrix(MathJS.zeros(6, 1));
    state[1] = -5; // initial state
    const base_prop_speed = 20;
    const prop_gain = 0.2;

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

      fieldOfView = 45;
      nearPlane = 1; // the camera won't "see" any object placed in front of this plane
      farPlane = 2000; // the camera wont't see any object placed further than this plane
      camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane,
      );
      camera.position.z = 100;
      camera.position.y = 20;
      camera.lookAt(0, 0, 0);

      //create the renderer
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(WIDTH, HEIGHT);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      canvasRef.current.appendChild(renderer.domElement);

      // convert the field of view to radians
      var ang = (fieldOfView * Math.PI) / 180;

      //  y limit because fielOfView is a vertical field of view.
      // I then calculate the x Limit
      xLimit = yLimit * camera.aspect;

      // precalculate the center of the screen, used to update the speed depending on the mouse position
      windowHalfX = WIDTH / 2;
      windowHalfY = HEIGHT / 2;

      mousePos = { x: windowHalfX, y: HEIGHT / 2 };

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
      // gains calculated via separate Julia script
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
      const f = camera.getFocalLength();

      // const alpha_x = camera.position.z / WIDTH / f;
      const alpha_x = (4 * camera.position.z * MathJS.tan(ang / 2)) / WIDTH;
      const alpha_y = (2 * camera.position.z * MathJS.tan(ang / 2)) / HEIGHT;

      var setpointx = (mousePos.x - WIDTH / 2) * alpha_x;
      var setpointy = (HEIGHT / 2 - mousePos.y) * alpha_y;

      var xstar = MathJS.matrix([[setpointx], [setpointy], [0], [0], [0], [0]]);

      const u = controller(state, xstar);
      const xdot = dynamics(state, u);

      // Euler step
      const delta = clock.getDelta();
      state = euler_step(state, xdot, delta);

      try {
        // animate the propellers
        var ul = base_prop_speed + u.get([0, 0]) * prop_gain;
        var ur = base_prop_speed + u.get([1, 0]) * prop_gain;

        drone.children[0].children[6].rotation.z += delta * ul;
        drone.children[0].children[7].rotation.z -= delta * ur;
        drone.children[0].children[8].rotation.z += delta * ul;
        drone.children[0].children[9].rotation.z -= delta * ur;
      } catch (error) {
        console.log(error);
      }

      // update animation
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
      // light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.0);
      // light.position.set(0, 20, 20);
      // // scene.add(light);

      // shadowLight = new THREE.DirectionalLight(0xffffff, 1.0);
      // shadowLight.position.set(0, 20, 10);
      // scene.add(shadowLight);

      const ambient_light = new THREE.AmbientLight(0xffffff, 0.3); // soft white light
      scene.add(ambient_light);

      light = new THREE.PointLight(0xffffff, 1, 200);
      light.position.set(0, 20, 4);
      light.castShadow = true; // default false
      scene.add(light);
    }

    function createRoom() {
      const geometry = new THREE.PlaneGeometry(200, 200, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: 0xdd8a0c,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(geometry, material);
      plane.position.set(0, -20, 0);
      plane.rotation.set(-Math.PI / 2, 0, 0);
      plane.receiveShadow = true;
      scene.add(plane);
    }

    function createDrone() {
      drone = new THREE.Group();

      // Load the model
      const loader = new GLTFLoader();
      loader.load(
        './model/scene.gltf',
        (gltf) => {
          // extract animations
          const mixer = new THREE.AnimationMixer(gltf.scene);
          const clips = gltf.animations;
          const action = mixer.clipAction(clips[0]);
          action.play();

          // extract drone asset from scene
          var model = gltf.scenes[0].children[0].children[0].children[0];
          model.children = model.children.slice(0, 12); // removes shadows
          model.rotation.x = -Math.PI / 2;
          model.castShadow = true;

          // Add Mesh to scene
          drone.add(model);
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
    createDrone();
    // createRoom();
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
