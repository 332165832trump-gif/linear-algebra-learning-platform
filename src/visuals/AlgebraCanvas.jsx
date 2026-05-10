import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";
import * as THREE from "three";

const size = 560;
const mid = size / 2;
const scale = 58;
const COLOR = {
  transform: "#60A5FA",
  vector: "#F6C86E",
  invariant: "#6EE7B7",
  eigen: "#C084FC",
  warning: "#F87171",
  axis: "#D8E6F3"
};

const toScreen = ([x, y]) => [mid + x * scale, mid - y * scale];
const fromScreen = (x, y) => [(x - mid) / scale, (mid - y) / scale];
const mul = (m, [x, y]) => [m.a * x + m.b * y, m.c * x + m.d * y];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const fmt = (value) => (Math.abs(value) < 0.01 ? "0.00" : value.toFixed(2));

function useTicker(playing) {
  const [time, setTime] = useState(0);
  useEffect(() => {
    if (!playing) return undefined;
    let frame;
    let last = performance.now();
    const tick = (now) => {
      const delta = Math.min(0.034, (now - last) / 1000);
      last = now;
      setTime((current) => current + delta);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  return [time, setTime];
}

function project3D([x, y, z], camera = 42) {
  const yaw = (camera * Math.PI) / 180;
  const pitch = -0.78;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const xr = x * cy - z * sy;
  const zr = x * sy + z * cy;
  const yr = y * cp - zr * sp;
  return [mid + xr * 54, mid - yr * 54];
}

function line3D(a, b, camera) {
  const [x1, y1] = project3D(a, camera);
  const [x2, y2] = project3D(b, camera);
  return { x1, y1, x2, y2 };
}

function Arrow3D({ from = [0, 0, 0], to, camera, color, label }) {
  const attrs = line3D(from, to, camera);
  const [tx, ty] = project3D(to, camera);
  return (
    <g filter="url(#softGlow)">
      <motion.line {...attrs} stroke={color} strokeWidth="9" strokeOpacity="0.13" strokeLinecap="round" />
      <motion.line {...attrs} stroke={color} strokeWidth="3.8" strokeLinecap="round" markerEnd={`url(#arrow-${color.slice(1)})`} />
      {label ? (
        <text x={tx + 8} y={ty - 8} fill={color} fontSize="13" fontWeight="800">
          {label}
        </text>
      ) : null}
    </g>
  );
}

function Grid({ matrix, faded = false }) {
  const lines = [];
  for (let i = -5; i <= 5; i += 1) {
    const a = mul(matrix, [-5, i]);
    const b = mul(matrix, [5, i]);
    const c = mul(matrix, [i, -5]);
    const d = mul(matrix, [i, 5]);
    const [x1, y1] = toScreen(a);
    const [x2, y2] = toScreen(b);
    const [x3, y3] = toScreen(c);
    const [x4, y4] = toScreen(d);
    lines.push(<line key={`h-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} className={faded ? "grid-faded" : "grid-line"} />);
    lines.push(<line key={`v-${i}`} x1={x3} y1={y3} x2={x4} y2={y4} className={faded ? "grid-faded" : "grid-line"} />);
  }
  return lines;
}

function Arrow({ from = [0, 0], to, color = "#F6C86E", width = 3, label }) {
  const [x1, y1] = toScreen(from);
  const [x2, y2] = toScreen(to);
  return (
    <g>
      <motion.line
        x1={x1}
        y1={y1}
        animate={{ x2, y2 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        stroke={color}
        strokeWidth={width + 5}
        strokeOpacity="0.14"
        strokeLinecap="round"
      />
      <motion.line
        x1={x1}
        y1={y1}
        animate={{ x2, y2 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        markerEnd={`url(#arrow-${color.slice(1)})`}
      />
      {label ? (
        <motion.text animate={{ x: x2 + 8, y: y2 - 8 }} fill={color} fontSize="13" fontWeight="700">
          {label}
        </motion.text>
      ) : null}
    </g>
  );
}

function AxisDefs() {
  const colors = ["F6C86E", "60A5FA", "6EE7B7", "C084FC", "F87171", "D8E6F3"];
  return (
    <defs>
      {colors.map((color) => (
        <marker key={color} id={`arrow-${color}`} markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L8,3 z" fill={`#${color}`} />
        </marker>
      ))}
      <radialGradient id="surfaceGlow" cx="50%" cy="50%" r="65%">
        <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.18" />
        <stop offset="58%" stopColor="#6EE7B7" stopOpacity="0.05" />
        <stop offset="100%" stopColor="#0B1020" stopOpacity="0" />
      </radialGradient>
      <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

function DragLayer({ point, setPoint }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [sx, sy] = toScreen(point);

  const update = (event) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const [vx, vy] = fromScreen(x, y);
    setPoint([clamp(vx, -4, 4), clamp(vy, -4, 4)]);
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 h-full w-full touch-none"
      onPointerMove={(event) => dragging && update(event)}
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => setDragging(false)}
    >
      <circle
        cx={sx}
        cy={sy}
        r="15"
        fill="rgba(246,200,110,0.22)"
        stroke={COLOR.vector}
        strokeWidth="2"
        className="cursor-grab vector-handle"
        onPointerDown={(event) => {
          setDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
      />
    </svg>
  );
}

function Slider({ label, value, setValue, min = -2, max = 2, step = 0.05 }) {
  return (
    <label className="control-row">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
      />
      <b>{fmt(value)}</b>
    </label>
  );
}

function SceneControls({ playing, setPlaying, reset, camera, setCamera }) {
  return (
    <div className="scene-controls">
      <button type="button" className="scene-button" onClick={() => setPlaying((value) => !value)}>
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        <span>{playing ? "暂停" : "播放"}</span>
      </button>
      <button type="button" className="scene-button" onClick={reset}>
        <RotateCcw className="h-4 w-4" />
        <span>重置</span>
      </button>
      <label className="camera-control">
        <span>视角</span>
        <input type="range" min="-70" max="70" step="1" value={camera} onChange={(event) => setCamera(Number(event.target.value))} />
        <b>{Math.round(camera)}°</b>
      </label>
    </div>
  );
}

function FormulaRibbon({ module, step }) {
  const labels = {
    "linear-transform": ["T(v)", "A v", "\\det A"],
    eigenvalue: ["v", "A v", "A v=\\lambda v"],
    eigenvector: ["v", "A v", "A v=\\lambda v"],
    "quadratic-form": ["q(x,y)", "x^T A x", "\\text{正定/不定}"],
    jordan: ["v", "(A-\\lambda I)w=v", "J=\\lambda I+N"],
    "vector-space": ["u,v", "a u+b v", "\\operatorname{span}(u,v)"]
  };
  return (
    <div className="formula-ribbon">
      {(labels[module.id] ?? [module.formula]).map((item, index) => (
        <motion.span
          key={item}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: step >= index ? 1 : 0.28, y: step >= index ? 0 : 8 }}
        >
          {item}
        </motion.span>
      ))}
    </div>
  );
}

function TeacherCue({ children }) {
  return <div className="teacher-cue">{children}</div>;
}

function ThreeMathScene({ module }) {
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

    const makeLine = (points, color, opacity = 1, width = 2) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, linewidth: width });
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
    const lines = [];
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
      lines.push(makeLine([new THREE.Vector3(-4, 0.04, 0), new THREE.Vector3(4, 0.04, 0)], 0xc084fc, 0.85));
      arrows.push(makeArrow(new THREE.Vector3(1, 0, 0), 0xc084fc, 2.7));
      arrows.push(makeArrow(new THREE.Vector3(0.7, 0, 1), 0xf6c86e, 2.2));
      arrows.push(makeArrow(new THREE.Vector3(1.25, 0, 1), 0x6ee7b7, 2.35));
    } else if (module.type === "eigen") {
      lines.push(makeLine([new THREE.Vector3(-4, 0.04, 0), new THREE.Vector3(4, 0.04, 0)], 0xc084fc, 0.75));
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
      mount.removeChild(renderer.domElement);
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

function Space3DScene({ module }) {
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useTicker(playing);
  const [camera, setCamera] = useState(38);
  const [spread, setSpread] = useState(1.25);
  const pulse = 0.5 + 0.5 * Math.sin(time * 1.4);
  const u = [1.9, 0, 0.55];
  const v = [0.25 + spread * Math.cos(0.75), 0, spread * Math.sin(0.75)];
  const p = [u[0] + v[0], 0, u[2] + v[2]];
  const points = [];
  for (let a = -2; a <= 2; a += 1) {
    for (let b = -2; b <= 2; b += 1) points.push([a * u[0] + b * v[0], 0, a * u[2] + b * v[2]]);
  }
  const step = Math.floor(time % 6 / 2);

  return (
    <>
      <div className="canvas-wrap canvas-3d">
        <BaseSvg>
          <PlaneGrid3D camera={camera} color={COLOR.invariant} />
          <polygon points={[project3D([0, 0, 0], camera), project3D(u, camera), project3D(p, camera), project3D(v, camera)].map(([x, y]) => `${x},${y}`).join(" ")} fill="rgba(110,231,183,0.18)" stroke={COLOR.invariant} strokeWidth="2" />
          {points.map((point, index) => {
            const [x, y] = project3D(point, camera);
            return <circle key={index} cx={x} cy={y} r={3 + pulse * 1.8} fill={COLOR.invariant} opacity="0.7" />;
          })}
          <Arrow3D to={u} camera={camera} color={COLOR.vector} label="u" />
          <Arrow3D to={v} camera={camera} color={COLOR.invariant} label="v" />
          <Arrow3D to={p} camera={camera} color={COLOR.transform} label="u+v" />
        </BaseSvg>
        <FormulaRibbon module={module} step={step} />
      </div>
      <SceneControls playing={playing} setPlaying={setPlaying} reset={() => setTime(0)} camera={camera} setCamera={setCamera} />
      <div className="control-grid">
        <Slider label="张开" value={spread} setValue={setSpread} min={0.35} max={2.4} />
      </div>
      <TeacherCue>绿色半透明平面表示所有线性组合的集合；黄色和绿色箭头是生成方向，蓝色箭头展示“相加后仍留在同一平面”。</TeacherCue>
    </>
  );
}

function Transform3DScene({ module }) {
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useTicker(playing);
  const [camera, setCamera] = useState(40);
  const [shear, setShear] = useState(0.55);
  const [stretch, setStretch] = useState(1.2);
  const phase = 0.5 + 0.5 * Math.sin(time * 1.2);
  const matrix = { a: 1 + (stretch - 1) * phase, b: shear * phase, c: -0.28 * phase, d: 1.05 + 0.18 * phase };
  const det = matrix.a * matrix.d - matrix.b * matrix.c;
  const transformPoint = ([x, y, z]) => [matrix.a * x + matrix.b * z, y, matrix.c * x + matrix.d * z];
  const e1 = transformPoint([1.6, 0, 0]);
  const e2 = transformPoint([0, 0, 1.6]);
  const step = Math.floor(time % 6 / 2);

  return (
    <>
      <div className="canvas-wrap canvas-3d">
        <BaseSvg>
          <PlaneGrid3D camera={camera} faded />
          <PlaneGrid3D camera={camera} transformPoint={transformPoint} color={COLOR.transform} />
          <polygon points={[project3D([0, 0, 0], camera), project3D(e1, camera), project3D([e1[0] + e2[0], 0, e1[2] + e2[2]], camera), project3D(e2, camera)].map(([x, y]) => `${x},${y}`).join(" ")} fill="rgba(96,165,250,0.22)" stroke={COLOR.transform} strokeWidth="2.5" filter="url(#softGlow)" />
          <Arrow3D to={[1.6, 0, 0]} camera={camera} color={COLOR.axis} label="e1" />
          <Arrow3D to={e1} camera={camera} color={COLOR.vector} label="Ae1" />
          <Arrow3D to={e2} camera={camera} color={COLOR.transform} label="Ae2" />
        </BaseSvg>
        <FormulaRibbon module={module} step={step} />
      </div>
      <SceneControls playing={playing} setPlaying={setPlaying} reset={() => setTime(0)} camera={camera} setCamera={setCamera} />
      <div className="control-grid">
        <Slider label="剪切" value={shear} setValue={setShear} min={-1.4} max={1.4} />
        <Slider label="伸缩" value={stretch} setValue={setStretch} min={0.45} max={2.2} />
      </div>
      <div className="stat-strip">
        <Stat label="det(A)" value={fmt(det)} />
        <Stat label="面积倍率" value={fmt(Math.abs(det))} />
        <Stat label="动画相位" value={fmt(phase)} />
      </div>
      <TeacherCue>蓝色网格是同一个平面被矩阵连续作用后的样子；半透明四边形的面积变化就是行列式的几何直觉。</TeacherCue>
    </>
  );
}

function Eigen3DScene({ module }) {
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useTicker(playing);
  const [camera, setCamera] = useState(36);
  const [mix, setMix] = useState(0.55);
  const [lambda, setLambda] = useState(1.45);
  const matrix = { a: lambda, b: mix, c: 0.0, d: 0.72 };
  const phase = 0.5 + 0.5 * Math.sin(time * 1.35);
  const dirs = [-65, -35, -10, 0, 24, 52, 78].map((deg) => {
    const r = (deg * Math.PI) / 180;
    const v = [Math.cos(r) * 1.45, 0, Math.sin(r) * 1.45];
    const av = [matrix.a * v[0] + matrix.b * v[2], 0, matrix.c * v[0] + matrix.d * v[2]];
    return { deg, v, current: [v[0] + (av[0] - v[0]) * phase, 0, v[2] + (av[2] - v[2]) * phase], eigen: Math.abs(deg) < 2 };
  });
  const step = Math.floor(time % 6 / 2);

  return (
    <>
      <div className="canvas-wrap canvas-3d">
        <BaseSvg>
          <PlaneGrid3D camera={camera} faded />
          <line {...line3D([-3, 0, 0], [3, 0, 0], camera)} stroke={COLOR.eigen} strokeWidth="3" strokeDasharray="8 8" />
          {dirs.map((item) => (
            <Arrow3D key={item.deg} to={item.current} camera={camera} color={item.eigen ? COLOR.eigen : COLOR.vector} label={item.eigen ? "特征方向" : ""} />
          ))}
        </BaseSvg>
        <FormulaRibbon module={module} step={step} />
      </div>
      <SceneControls playing={playing} setPlaying={setPlaying} reset={() => setTime(0)} camera={camera} setCamera={setCamera} />
      <div className="control-grid">
        <Slider label="混合" value={mix} setValue={setMix} min={-1.4} max={1.4} />
        <Slider label="λ" value={lambda} setValue={setLambda} min={-2} max={2} />
      </div>
      <TeacherCue>大多数黄色向量会改变方向；紫色虚线方向经过变换后仍留在同一直线上，所以公式里的 v 是方向，λ 是沿这个方向的伸缩倍数。</TeacherCue>
    </>
  );
}

function Quadratic3DScene({ module }) {
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useTicker(playing);
  const [camera, setCamera] = useState(38);
  const [a, setA] = useState(0.75);
  const [b, setB] = useState(0.25);
  const [d, setD] = useState(0.95);
  const wave = playing ? 0.08 * Math.sin(time * 1.6) : 0;
  const q = (x, z) => clamp((a + wave) * x * x + 2 * b * x * z + d * z * z, -2.1, 2.1);
  const rows = [];
  for (let x = -2; x <= 2.001; x += 0.4) {
    const line = [];
    for (let z = -2; z <= 2.001; z += 0.4) line.push([x, q(x, z), z]);
    rows.push(line);
  }
  const cols = [];
  for (let z = -2; z <= 2.001; z += 0.4) {
    const line = [];
    for (let x = -2; x <= 2.001; x += 0.4) line.push([x, q(x, z), z]);
    cols.push(line);
  }
  const type = a > 0 && d > 0 && a * d - b * b > 0 ? "正定：碗形" : a < 0 && d < 0 && a * d - b * b > 0 ? "负定：倒碗" : "不定：马鞍";
  const step = Math.floor(time % 6 / 2);

  return (
    <>
      <div className="canvas-wrap canvas-3d">
        <BaseSvg>
          <PlaneGrid3D camera={camera} faded />
          {[...rows, ...cols].map((line, index) => (
            <polyline key={index} points={line.map((point) => project3D(point, camera).join(",")).join(" ")} fill="none" stroke={index % 2 ? COLOR.eigen : COLOR.transform} strokeWidth="1.5" opacity="0.68" />
          ))}
          <Arrow3D to={[0, q(0, 0) + 1.5, 0]} camera={camera} color={COLOR.vector} label="高度 q" />
        </BaseSvg>
        <FormulaRibbon module={module} step={step} />
      </div>
      <SceneControls playing={playing} setPlaying={setPlaying} reset={() => setTime(0)} camera={camera} setCamera={setCamera} />
      <div className="control-grid">
        <Slider label="x²" value={a} setValue={setA} min={-1.4} max={1.4} />
        <Slider label="xy" value={b} setValue={setB} min={-1.2} max={1.2} />
        <Slider label="y²" value={d} setValue={setD} min={-1.4} max={1.4} />
      </div>
      <div className="stat-strip">
        <Stat label="曲面类型" value={type} />
        <Stat label="ad-b²" value={fmt(a * d - b * b)} />
      </div>
      <TeacherCue>曲面的高度就是 q(x,y)。正定像碗，所有方向都向上；不定像马鞍，有些方向向上、有些方向向下。</TeacherCue>
    </>
  );
}

function Jordan3DScene({ module }) {
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useTicker(playing);
  const [camera, setCamera] = useState(36);
  const [shear, setShear] = useState(0.9);
  const [lambda, setLambda] = useState(1.05);
  const phase = 0.5 + 0.5 * Math.sin(time * 1.2);
  const eigen = [1.8 * lambda, 0, 0];
  const generalizedStart = [0, 0, 1.5];
  const generalizedEnd = [shear * 1.5 + 0.1, 0, lambda * 1.5];
  const generalized = [
    generalizedStart[0] + (generalizedEnd[0] - generalizedStart[0]) * phase,
    0,
    generalizedStart[2] + (generalizedEnd[2] - generalizedStart[2]) * phase
  ];
  const step = Math.floor(time % 6 / 2);

  return (
    <>
      <div className="canvas-wrap canvas-3d">
        <BaseSvg>
          <PlaneGrid3D camera={camera} faded />
          <line {...line3D([-3, 0, 0], [3, 0, 0], camera)} stroke={COLOR.eigen} strokeWidth="3" strokeDasharray="9 8" />
          <Arrow3D to={eigen} camera={camera} color={COLOR.eigen} label="特征向量 v" />
          <Arrow3D to={generalizedStart} camera={camera} color={COLOR.axis} label="w" />
          <Arrow3D to={generalized} camera={camera} color={COLOR.vector} label="Jw" />
          <line {...line3D(generalized, eigen, camera)} stroke={COLOR.invariant} strokeWidth="2" strokeDasharray="6 8" />
        </BaseSvg>
        <FormulaRibbon module={module} step={step} />
      </div>
      <SceneControls playing={playing} setPlaying={setPlaying} reset={() => setTime(0)} camera={camera} setCamera={setCamera} />
      <div className="control-grid">
        <Slider label="链偏移" value={shear} setValue={setShear} min={0} max={1.8} />
        <Slider label="λ" value={lambda} setValue={setLambda} min={0.35} max={1.8} />
      </div>
      <TeacherCue>紫色方向是真正的特征方向；黄色方向会被拖向它，说明只有一个特征轴时，矩阵还残留一个“链式剪切”，因此不能完全对角化。</TeacherCue>
    </>
  );
}

function PlaneGrid3D({ camera, color = COLOR.axis, transformPoint = (point) => point, faded = false }) {
  const lines = [];
  for (let i = -4; i <= 4; i += 1) {
    lines.push(<line key={`x-${i}`} {...line3D(transformPoint([-4, 0, i]), transformPoint([4, 0, i]), camera)} stroke={color} strokeWidth="1" strokeOpacity={faded ? 0.12 : 0.26} />);
    lines.push(<line key={`z-${i}`} {...line3D(transformPoint([i, 0, -4]), transformPoint([i, 0, 4]), camera)} stroke={color} strokeWidth="1" strokeOpacity={faded ? 0.12 : 0.26} />);
  }
  lines.push(<line key="axis-x" {...line3D(transformPoint([-4.5, 0, 0]), transformPoint([4.5, 0, 0]), camera)} stroke={COLOR.axis} strokeWidth="1.8" strokeOpacity="0.62" />);
  lines.push(<line key="axis-z" {...line3D(transformPoint([0, 0, -4.5]), transformPoint([0, 0, 4.5]), camera)} stroke={COLOR.axis} strokeWidth="1.8" strokeOpacity="0.62" />);
  return lines;
}

function MatrixControls({ matrix, setMatrix }) {
  const update = (key) => (value) => setMatrix((current) => ({ ...current, [key]: value }));
  return (
    <div className="control-grid">
      <Slider label="a" value={matrix.a} setValue={update("a")} />
      <Slider label="b" value={matrix.b} setValue={update("b")} />
      <Slider label="c" value={matrix.c} setValue={update("c")} />
      <Slider label="d" value={matrix.d} setValue={update("d")} />
    </div>
  );
}

function BaseSvg({ children }) {
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
      <AxisDefs />
      <rect width={size} height={size} fill="url(#surfaceGlow)" />
      <circle cx="280" cy="280" r="180" fill="none" stroke="rgba(96,165,250,0.08)" strokeWidth="1" />
      <circle cx="280" cy="280" r="104" fill="none" stroke="rgba(192,132,252,0.08)" strokeWidth="1" />
      {children}
    </svg>
  );
}

function VectorView({ module }) {
  const [point, setPoint] = useState([2.2, 1.4]);
  const inner = point[0] * 1.4 + point[1] * 0.7;
  const norm = Math.hypot(point[0], point[1]);
  const projection = (inner / (1.4 * 1.4 + 0.7 * 0.7));
  const projPoint = [projection * 1.4, projection * 0.7];

  return (
    <>
      <div className="canvas-wrap">
        <BaseSvg>
          <Grid matrix={{ a: 1, b: 0, c: 0, d: 1 }} />
          <Arrow to={[4.5, 0]} color={COLOR.axis} width={1.5} />
          <Arrow to={[0, 4.5]} color={COLOR.axis} width={1.5} />
          <Arrow to={[1.4, 0.7]} color={COLOR.invariant} label="u" />
          <Arrow to={point} color={COLOR.vector} label="v" />
          {module.id.includes("inner") || module.id.includes("orthogonal") ? (
            <>
              <line {...lineAttrs(point, projPoint)} stroke={COLOR.eigen} strokeDasharray="7 7" strokeWidth="2" />
              <Arrow to={projPoint} color={COLOR.eigen} width={2.4} label="proj" />
            </>
          ) : null}
        </BaseSvg>
        <DragLayer point={point} setPoint={setPoint} />
      </div>
      <div className="stat-strip">
        <Stat label="坐标" value={`(${fmt(point[0])}, ${fmt(point[1])})`} />
        <Stat label="长度" value={fmt(norm)} />
        <Stat label="内积" value={fmt(inner)} />
      </div>
    </>
  );
}

function SpaceView() {
  const [theta, setTheta] = useState(48);
  const [length, setLength] = useState(1.7);
  const rad = (theta * Math.PI) / 180;
  const u = [2, 0.7];
  const v = [Math.cos(rad) * length, Math.sin(rad) * length];
  const area = Math.abs(u[0] * v[1] - u[1] * v[0]);
  const dependent = area < 0.18;
  const combos = [];
  for (let i = -2; i <= 2; i += 1) {
    for (let j = -2; j <= 2; j += 1) {
      combos.push([i * u[0] + j * v[0], i * u[1] + j * v[1]]);
    }
  }
  return (
    <>
      <div className="canvas-wrap">
        <BaseSvg>
          <Grid matrix={{ a: 1, b: 0, c: 0, d: 1 }} />
          {combos.map((p, index) => {
            const [x, y] = toScreen(p);
            return <motion.circle key={index} cx={x} cy={y} r="4" fill={dependent ? COLOR.warning : COLOR.invariant} opacity="0.78" initial={{ r: 0 }} animate={{ r: 4 }} />;
          })}
          <Arrow to={u} color={COLOR.vector} label="u" />
          <Arrow to={v} color={COLOR.invariant} label="v" />
        </BaseSvg>
      </div>
      <div className="control-grid">
        <Slider label="夹角" value={theta} setValue={setTheta} min={0} max={180} step={1} />
        <Slider label="长度" value={length} setValue={setLength} min={0.4} max={3} />
      </div>
      <div className="stat-strip">
        <Stat label="生成状态" value={dependent ? "方向重复" : "张成平面"} />
        <Stat label="面积指标" value={fmt(area)} />
      </div>
    </>
  );
}

function TransformView({ module }) {
  const defaults = module.id === "rank" ? { a: 1.2, b: 0.9, c: 0.6, d: 0.45 } : { a: 1.15, b: 0.45, c: -0.2, d: 1.05 };
  const [matrix, setMatrix] = useState(defaults);
  const det = matrix.a * matrix.d - matrix.b * matrix.c;
  const rank = Math.abs(det) > 0.05 ? 2 : Math.abs(matrix.a) + Math.abs(matrix.b) + Math.abs(matrix.c) + Math.abs(matrix.d) > 0.05 ? 1 : 0;
  const e1 = mul(matrix, [1, 0]);
  const e2 = mul(matrix, [0, 1]);
  return (
    <>
      <div className="canvas-wrap">
        <BaseSvg>
          <Grid matrix={{ a: 1, b: 0, c: 0, d: 1 }} faded />
          <motion.g animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Grid matrix={matrix} />
            <motion.polygon
              animate={{ points: poly([[0, 0], e1, [e1[0] + e2[0], e1[1] + e2[1]], e2]) }}
              fill="rgba(96,165,250,0.18)"
              stroke={COLOR.transform}
              strokeWidth="2"
              filter="url(#softGlow)"
            />
          </motion.g>
          <Arrow to={e1} color={COLOR.vector} label="Ae1" />
          <Arrow to={e2} color={COLOR.transform} label="Ae2" />
        </BaseSvg>
      </div>
      <MatrixControls matrix={matrix} setMatrix={setMatrix} />
      <div className="stat-strip">
        <Stat label="det(A)" value={fmt(det)} />
        <Stat label="rank" value={rank} />
        <Stat label="矩阵" value={`[${fmt(matrix.a)} ${fmt(matrix.b)}; ${fmt(matrix.c)} ${fmt(matrix.d)}]`} />
      </div>
    </>
  );
}

function DeterminantView({ module }) {
  const [shift, setShift] = useState(module.id === "linear-system" ? 1.1 : 0.35);
  const [tilt, setTilt] = useState(0.75);
  const matrix = { a: 1.4, b: shift, c: tilt - 0.4, d: 1.2 };
  const det = matrix.a * matrix.d - matrix.b * matrix.c;
  const e1 = mul(matrix, [1, 0]);
  const e2 = mul(matrix, [0, 1]);
  const line1A = [-4, (shift - 4) / 1.6];
  const line1B = [4, (shift + 4) / 1.6];
  const line2A = [-4, (-tilt + 4) / 1.25];
  const line2B = [4, (-tilt - 4) / 1.25];
  return (
    <>
      <div className="canvas-wrap">
        <BaseSvg>
          <Grid matrix={{ a: 1, b: 0, c: 0, d: 1 }} />
          {module.id === "linear-system" ? (
            <>
              <line {...lineAttrs(line1A, line1B)} stroke={COLOR.vector} strokeWidth="3" strokeLinecap="round" />
              <line {...lineAttrs(line2A, line2B)} stroke={COLOR.invariant} strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <motion.polygon
                animate={{ points: poly([[0, 0], e1, [e1[0] + e2[0], e1[1] + e2[1]], e2]) }}
                fill={det >= 0 ? "rgba(96,165,250,0.22)" : "rgba(248,113,113,0.20)"}
                stroke={det >= 0 ? COLOR.transform : COLOR.warning}
                strokeWidth="3"
                filter="url(#softGlow)"
              />
              <Arrow to={e1} color={COLOR.vector} label="a1" />
              <Arrow to={e2} color={COLOR.invariant} label="a2" />
            </>
          )}
        </BaseSvg>
      </div>
      <div className="control-grid">
        <Slider label={module.id === "linear-system" ? "方程1" : "剪切"} value={shift} setValue={setShift} min={-1.8} max={1.8} />
        <Slider label={module.id === "linear-system" ? "方程2" : "倾斜"} value={tilt} setValue={setTilt} min={-1.8} max={1.8} />
      </div>
      <div className="stat-strip">
        <Stat label={module.id === "linear-system" ? "几何情形" : "有向面积"} value={module.id === "linear-system" ? "交点随约束移动" : fmt(det)} />
        <Stat label="符号" value={det >= 0 ? "方向保持" : "方向翻转"} />
      </div>
    </>
  );
}

function EigenView({ module }) {
  const [angle, setAngle] = useState(32);
  const [shear, setShear] = useState(module.id === "jordan" ? 1 : 0.4);
  const [lambda, setLambda] = useState(1.45);
  const rad = (angle * Math.PI) / 180;
  const v = [Math.cos(rad) * 2.3, Math.sin(rad) * 2.3];
  const matrix = module.id === "jordan" ? { a: lambda, b: shear, c: 0, d: lambda } : { a: lambda, b: shear, c: 0.2, d: 0.72 };
  const av = mul(matrix, v);
  const cross = Math.abs(v[0] * av[1] - v[1] * av[0]) / Math.max(0.1, Math.hypot(...v) * Math.hypot(...av));
  return (
    <>
      <div className="canvas-wrap">
        <BaseSvg>
          <Grid matrix={{ a: 1, b: 0, c: 0, d: 1 }} faded />
          <Grid matrix={matrix} />
          <line {...lineAttrs([-4, 0], [4, 0])} stroke={COLOR.eigen} strokeWidth="2.5" strokeDasharray="7 7" />
          <Arrow to={v} color={COLOR.vector} label="x" />
          <Arrow to={av} color={COLOR.eigen} label="Ax" />
        </BaseSvg>
      </div>
      <div className="control-grid">
        <Slider label="测试角" value={angle} setValue={setAngle} min={0} max={180} step={1} />
        <Slider label={module.id === "jordan" ? "剪切链" : "混合量"} value={shear} setValue={setShear} min={-1.5} max={1.5} />
        <Slider label="λ" value={lambda} setValue={setLambda} min={-2} max={2} />
      </div>
      <div className="stat-strip">
        <Stat label="共线误差" value={fmt(cross)} />
        <Stat label="提示" value={cross < 0.08 ? "接近特征方向" : "继续旋转寻找"} />
      </div>
    </>
  );
}

function FormView() {
  const [a, setA] = useState(1.1);
  const [b, setB] = useState(0.55);
  const [d, setD] = useState(0.8);
  const points = useMemo(() => contourPoints(a, b, d), [a, b, d]);
  const discriminant = b * b - a * d;
  return (
    <>
      <div className="canvas-wrap">
        <BaseSvg>
          <Grid matrix={{ a: 1, b: 0, c: 0, d: 1 }} />
          {points.map((path, index) => (
            <polyline key={index} points={path.map(toScreen).map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke={index % 2 ? COLOR.vector : COLOR.eigen} strokeWidth="2" opacity="0.84" />
          ))}
        </BaseSvg>
      </div>
      <div className="control-grid">
        <Slider label="x²" value={a} setValue={setA} min={-1.8} max={1.8} />
        <Slider label="xy" value={b} setValue={setB} min={-1.8} max={1.8} />
        <Slider label="y²" value={d} setValue={setD} min={-1.8} max={1.8} />
      </div>
      <div className="stat-strip">
        <Stat label="判别趋势" value={discriminant < 0 ? "椭圆型" : "双曲/退化型"} />
        <Stat label="b²-ad" value={fmt(discriminant)} />
      </div>
    </>
  );
}

export function AlgebraCanvas({ module }) {
  const advancedView = {
    "vector-space": <Space3DScene module={module} />,
    "linear-transform": <Transform3DScene module={module} />,
    eigenvalue: <Eigen3DScene module={module} />,
    eigenvector: <Eigen3DScene module={module} />,
    "quadratic-form": <Quadratic3DScene module={module} />,
    jordan: <Jordan3DScene module={module} />
  }[module.id];

  const view = advancedView ?? {
    vector: <VectorView module={module} />,
    space: <SpaceView module={module} />,
    transform: <TransformView module={module} />,
    determinant: <DetermininantAlias module={module} />,
    eigen: <EigenView module={module} />,
    form: <FormView module={module} />
  }[module.type];

  return (
    <div className="lab-card">
      <div className="lab-toolbar">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-vectorGold" />
          <span className="h-2.5 w-2.5 rounded-full bg-skyMath" />
          <span className="h-2.5 w-2.5 rounded-full bg-eigenPurple" />
        </div>
        <button type="button" className="icon-button" onClick={() => window.location.reload()} title="重置实验">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
      <ThreeMathScene module={module} />
      {view}
    </div>
  );
}

function DetermininantAlias({ module }) {
  return <DeterminantView module={module} />;
}

function Stat({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function lineAttrs(a, b) {
  const [x1, y1] = toScreen(a);
  const [x2, y2] = toScreen(b);
  return { x1, y1, x2, y2 };
}

function poly(points) {
  return points.map(toScreen).map(([x, y]) => `${x},${y}`).join(" ");
}

function contourPoints(a, b, d) {
  const levels = [0.7, 1.5, 2.6, 3.8];
  return levels.map((level) => {
    const pts = [];
    for (let t = 0; t <= Math.PI * 2 + 0.04; t += 0.04) {
      const x = Math.cos(t);
      const y = Math.sin(t);
      const q = a * x * x + 2 * b * x * y + d * y * y;
      const r = Math.sqrt(Math.abs(level / (q || 0.001)));
      pts.push([clamp(x * r, -4.5, 4.5), clamp(y * r, -4.5, 4.5)]);
    }
    return pts;
  });
}
