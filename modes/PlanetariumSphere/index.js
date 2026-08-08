"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { photos } from "@/data/photos";

export default function PlanetariumSphere({ active }) {
  const [loaded, setLoaded] = useState(0);
  const [spotlight, setSpotlight] = useState(null);
  const [visibleCount, setVisibleCount] = useState(14);
  const [gyro, setGyro] = useState(false);
  const textureLoaded = useCallback(() => setLoaded((value) => value + 1), []);

  const enableGyro = async () => {
    const Orientation = window.DeviceOrientationEvent;
    if (!Orientation) return;
    if (typeof Orientation.requestPermission === "function" && await Orientation.requestPermission() !== "granted") return;
    setGyro(true);
  };

  useEffect(() => {
    if (!active) return;
    const reveal = window.setInterval(() => {
      if (spotlight == null) setVisibleCount((count) => Math.min(photos.length, count + 6));
    }, 850);
    return () => clearInterval(reveal);
  }, [active, spotlight]);

  useEffect(() => {
    if (!active || !visibleCount) return;
    const cycle = window.setInterval(() => setSpotlight((current) => current == null ? Math.floor(Math.random() * visibleCount) : (current + 1) % visibleCount), 7600);
    return () => clearInterval(cycle);
  }, [active, visibleCount]);

  return (
    <section className="galaxy-mode">
      <Canvas camera={{ position: [0, 0, 0.01], fov: 62, near: 0.1, far: 160 }} dpr={[1, 1.6]}>
        <color attach="background" args={["#02030a"]} />
        <GalaxyScene active={active} gyro={gyro} visibleCount={visibleCount} spotlight={spotlight} setSpotlight={setSpotlight} onTexture={textureLoaded} />
      </Canvas>
      {active && loaded < visibleCount && <div className="asset-progress"><span style={{ width: `${Math.round(loaded / visibleCount * 100)}%` }} /></div>}
      {spotlight != null && active && <aside className="galaxy-quote" key={spotlight}><small>{String(spotlight + 1).padStart(2, "0")} / {photos.length}</small><blockquote>{photos[spotlight].quote}</blockquote><p>{photos[spotlight].title}</p></aside>}
      {active && <button className={`gyro-toggle ${gyro ? "on" : ""}`} onClick={enableGyro}>{gyro ? "GYRO ON" : "GYRO"}</button>}
      {active && <div className="mode-instruction">↔ &nbsp; DRAG UNTUK MELIHAT · KLIK FOTO</div>}
    </section>
  );
}

function GalaxyScene({ active, gyro, visibleCount, spotlight, setSpotlight, onTexture }) {
  const world = useRef();
  const meshRefs = useRef([]);
  const { camera, gl } = useThree();
  const look = useRef({ yaw: 0, pitch: 0, dragging: false, x: 0, y: 0 });
  const stars = useMemo(() => {
    const values = new Float32Array(1500 * 3);
    for (let index = 0; index < 1500; index += 1) {
      const y = Math.random() * 2 - 1, theta = Math.random() * Math.PI * 2, side = Math.sqrt(1 - y * y);
      values.set([65 * side * Math.cos(theta), 65 * y, 65 * side * Math.sin(theta)], index * 3);
    }
    return values;
  }, []);
  const cameraWork = useMemo(() => ({
    position: new THREE.Vector3(),
    target: new THREE.Quaternion(),
    matrix: new THREE.Matrix4(),
    origin: new THREE.Vector3(),
  }), []);

  useEffect(() => {
    const canvas = gl.domElement;
    const down = (event) => { look.current.dragging = true; look.current.x = event.clientX; look.current.y = event.clientY; canvas.setPointerCapture(event.pointerId); };
    const move = (event) => {
      if (!look.current.dragging || spotlight != null) return;
      look.current.yaw -= (event.clientX - look.current.x) * 0.0032;
      look.current.pitch = THREE.MathUtils.clamp(look.current.pitch - (event.clientY - look.current.y) * 0.0032, -1.35, 1.35);
      look.current.x = event.clientX; look.current.y = event.clientY;
    };
    const up = () => { look.current.dragging = false; };
    canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerup", up);
    return () => { canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerup", up); };
  }, [gl, spotlight]);

  useEffect(() => {
    if (!gyro) return;
    const orient = (event) => {
      if (event.alpha == null || spotlight != null) return;
      look.current.yaw = THREE.MathUtils.degToRad(-event.alpha);
      look.current.pitch = THREE.MathUtils.clamp(THREE.MathUtils.degToRad((event.beta ?? 90) - 90), -1.35, 1.35);
    };
    window.addEventListener("deviceorientation", orient);
    return () => window.removeEventListener("deviceorientation", orient);
  }, [gyro, spotlight]);

  useFrame((_, delta) => {
    if (!active) return;
    if (!look.current.dragging) world.current.rotation.y += delta * (spotlight == null ? 0.013 : 0.007);
    if (spotlight != null && meshRefs.current[spotlight]) {
      const direction = meshRefs.current[spotlight].getWorldPosition(cameraWork.position).normalize();
      cameraWork.matrix.lookAt(cameraWork.origin, direction, camera.up);
      cameraWork.target.setFromRotationMatrix(cameraWork.matrix);
      camera.quaternion.slerp(cameraWork.target, 1 - Math.exp(-delta * 2.6));
    } else {
      camera.rotation.order = "YXZ"; camera.rotation.y = look.current.yaw; camera.rotation.x = look.current.pitch;
    }
  });

  return (
    <>
      <mesh><sphereGeometry args={[72, 48, 32]} /><meshBasicMaterial color="#090d1d" side={THREE.BackSide} /></mesh>
      <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[stars, 3]} /></bufferGeometry><pointsMaterial color="#bec9e7" size={0.09} transparent opacity={0.72} depthWrite={false} /></points>
      <group ref={world}>
        {photos.slice(0, visibleCount).map((photo, index) => <SpherePhoto key={photo.image} photo={photo} index={index} total={photos.length} active={spotlight === index} dimmed={spotlight != null && spotlight !== index} onClick={() => setSpotlight(index)} onLoad={onTexture} meshRefs={meshRefs} />)}
      </group>
    </>
  );
}

function SpherePhoto({ photo, index, total, active, dimmed, onClick, onLoad, meshRefs }) {
  const mesh = useRef();
  const material = useRef();
  const [texture, setTexture] = useState(null);
  const positions = useMemo(() => {
    const y = 1 - index / (total - 1) * 2, radius = Math.sqrt(1 - y * y), theta = Math.PI * (3 - Math.sqrt(5)) * index;
    const home = new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius).multiplyScalar(30);
    return { home, near: home.clone().normalize().multiplyScalar(7), normalScale: new THREE.Vector3(1, 1, 1), activeScale: new THREE.Vector3(1.65, 1.65, 1.65) };
  }, [index, total]);
  const home = positions.home;

  useEffect(() => {
    let alive = true;
    new THREE.TextureLoader().load(photo.thumbnail, (loadedTexture) => {
      if (!alive) return loadedTexture.dispose();
      loadedTexture.colorSpace = THREE.SRGBColorSpace; setTexture(loadedTexture); onLoad();
    });
    return () => { alive = false; };
  }, [photo.thumbnail, onLoad]);

  useEffect(() => { if (mesh.current && texture) { mesh.current.lookAt(0, 0, 0); mesh.current.rotateY(Math.PI); meshRefs.current[index] = mesh.current; } }, [index, meshRefs, texture]);
  useEffect(() => () => texture?.dispose(), [texture]);
  useFrame((_, delta) => {
    if (!mesh.current || !material.current) return;
    const destination = active ? positions.near : home;
    mesh.current.position.lerp(destination, 1 - Math.exp(-delta * 2.3));
    mesh.current.scale.lerp(active ? positions.activeScale : positions.normalScale, 1 - Math.exp(-delta * 3));
    material.current.opacity = THREE.MathUtils.damp(material.current.opacity, dimmed ? 0.2 : 0.9, 4, delta);
  });
  if (!texture) return null;
  const ratio = texture.image.width / texture.image.height, width = ratio >= 1 ? 5.8 : 4.2;
  return <mesh ref={mesh} position={home} onClick={(event) => { event.stopPropagation(); onClick(); }}><planeGeometry args={[width, width / ratio]} /><meshBasicMaterial ref={material} map={texture} transparent opacity={0.9} side={THREE.DoubleSide} /></mesh>;
}
