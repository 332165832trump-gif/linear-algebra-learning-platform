import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeMathScene({ module }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070a12, 0.055);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
    camera.position.set(5.8, 4.2, 7.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const ambient = new THREE.AmbientLight(0x9fbfff, 1.6);
    const key = new THREE.PointLight(0x60a5fa, 28, 24);
    key.position.set(3, 5, 4);
    const rim = new THREE.PointLight(0xf6c86e, 16, 18);
    rim.position.set(-4, 3, -3);
    scene.add(ambient, key, rim);

    const grid = new THREE.GridHelper(9, 18, 0x60a5fa, 0x1d385c);
    grid.material.transparent = true;
    grid.material.opacity = 0.34;
    root.add(grid);

    const makeLine = (points, color, opacity = 1) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      const line = new THREE.Line(geometry, material);
      root.add(line);
      return line;
    };

    const makeArrow = (dir, color, length = 2.8, origin = new THREE.Vector3(0, 0.03, 0)) => {
      const arrow = new THREE.ArrowHelper(dir.clone().normalize(), origin, length, color, 0.32, 0.18);
      arrow.cone.material.transparent = true;
      arrow.cone.material.opacity = 0.95;
      arrow.line.material.transparent = true;
      arrow.line.material.opacity = 0.95;
      root.add(arrow);
      return arrow;
    };

    const arrows = [];
    const surfaces = [];

    if (module.id === "quadratic-form") {
      const geometry = new THREE.PlaneGeometry(5.2, 5.2, 48, 48);
      geometry.rotateX(-Math.PI / 2);
      const material = new THREE.MeshStandardMaterial({
        color: 0x5ea6ff,
        emissive: 0x163a60,
        metalness: 0.15,
        roughness: 0.42,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
        wireframe: true
      });
      const mesh = new THREE.Mesh(geometry, material);
      root.add(mesh);
      surfaces.push(mesh);
      arrows.push(makeArrow(new THREE.Vector3(0, 1, 0), 0xf6c86e, 1.9, new THREE.Vector3(-2.7, -1, -2.7)));
    } else if (module.id === "pca") {
      const cloud = new THREE.Group();
      const dotMaterial = new THREE.MeshStandardMaterial({ color: 0x6ee7b7, emissive: 0x0a463a, roughness: 0.25 });
      const dotGeometry = new THREE.SphereGeometry(0.045, 10, 10);
      for (let i = 0; i < 130; i += 1) {
        const t = i * 0.37;
        const radius = 0.45 + (i % 11) * 0.055;
        const x = Math.cos(t) * radius * 2.4;
        const y = Math.sin(t * 1.7) * 0.35;
        const z = Math.sin(t) * radius * 0.82;
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        dot.position.set(x, y, z);
        cloud.add(dot);
      }
      cloud.rotation.y = -0.58;
      root.add(cloud);
      surfaces.push(cloud);
      arrows.push(makeArrow(new THREE.Vector3(1, 0.08, 0.22), 0xf6c86e, 3.2));
      arrows.push(makeArrow(new THREE.Vector3(-0.18, 0.04, 1), 0xc084fc, 1.8));
    } else if (module.id === "jordan") {
      makeLine([new THREE.Vector3(-4, 0.04, 0), new THREE.Vector3(4, 0.04, 0)], 0xc084fc, 0.85);
      arrows.push(makeArrow(new THREE.Vector3(1, 0, 0), 0xc084fc, 2.7));
      arrows.push(makeArrow(new THREE.Vector3(0.7, 0, 1), 0xf6c86e, 2.2));
      arrows.push(makeArrow(new THREE.Vector3(1.25, 0, 1), 0x6ee7b7, 2.35));
    } else if (module.type === "eigen") {
      makeLine([new THREE.Vector3(-4, 0.04, 0), new THREE.Vector3(4, 0.04, 0)], 0xc084fc, 0.75);
      for (let i = -3; i <= 3; i += 1) {
        const angle = i * 0.34;
        arrows.push(makeArrow(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)), i === 0 ? 0xc084fc : 0xf6c86e, 1.6 + Math.abs(i) * 0.16));
      }
    } else {
      const planeGeometry = new THREE.PlaneGeometry(3.2, 3.2, 1, 1);
      const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x60a5fa,
        emissive: 0x102d54,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = -Math.PI / 2;
      root.add(plane);
      surfaces.push(plane);
      arrows.push(makeArrow(new THREE.Vector3(1, 0, 0.18), 0xf6c86e, 2.7));
      arrows.push(makeArrow(new THREE.Vector3(0.28, 0, 1), 0x60a5fa, 2.35));
    }

    const stars = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 220 }, () => new THREE.Vector3((Math.random() - 0.5) * 28, Math.random() * 12 - 2, (Math.random() - 0.5) * 28))
      ),
      new THREE.PointsMaterial({ color: 0xd8e6f3, transparent: true, opacity: 0.28, size: 0.018 })
    );
    scene.add(stars);

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      const width = Math.max(320, rect.width);
      const height = Math.max(300, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = performance.now() / 1000;
      root.rotation.y = Math.sin(t * 0.18) * 0.18;
      stars.rotation.y = t * 0.012;
      arrows.forEach((arrow, index) => {
        const pulse = 0.85 + Math.sin(t * 1.6 + index) * 0.08;
        arrow.scale.setScalar(pulse);
      });
      surfaces.forEach((surface, index) => {
        if (module.id === "quadratic-form" && surface.geometry?.attributes?.position) {
          const pos = surface.geometry.attributes.position;
          for (let i = 0; i < pos.count; i += 1) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            pos.setY(i, 0.22 * x * x - 0.18 * z * z + Math.sin(t + x) * 0.06);
          }
          pos.needsUpdate = true;
          surface.geometry.computeVertexNormals();
        } else {
          surface.rotation.y += 0.002 + index * 0.0005;
        }
      });
      renderer.render(scene, camera);
    };
    animate();

    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      scene.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.());
        else object.material?.dispose?.();
      });
      renderer.dispose();
    };
  }, [module.id, module.type]);

  return (
    <div className="three-scene" ref={mountRef}>
      <div className="three-scene-label">
        <span>WebGL 3D Scene</span>
        <b>{module.title}</b>
      </div>
    </div>
  );
}
