import { Link } from '@mui/icons-material';

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

export default function background() {
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    500,
  );
  camera.position.set(0, 0, 100);
  camera.lookAt(0, 0, 0);

  const scene = new THREE.Scene();

  return (
    <h1>
      <Link href="/">
        <a>Back</a>
      </Link>
    </h1>
  );
}
