"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { photos } from "@/data/photos";
import StoryExport from "./StoryExport";

export default function PlanetariumSphere({ active }) {
  const displayPhotos = useMemo(() => shufflePhotos(photos), []);
  const [loaded, setLoaded] = useState(0);
  const [spotlight, setSpotlight] = useState(null);
  const [visibleCount, setVisibleCount] = useState(14);
  const [gyro, setGyro] = useState(false);
  const [autoTour, setAutoTour] = useState(true);
  const [storyOpen, setStoryOpen] = useState(false);
  const idleTimer = useRef(null);
  const spotlightBag = useRef([]);
  const lastSpotlight = useRef(null);
  const firstSpotlightDone = useRef(false);
  const textureLoaded = useCallback(() => setLoaded((value) => value + 1), []);

  const enableGyro = async () => {
    if (gyro) { setGyro(false); setAutoTour(true); return; }
    const Orientation = window.DeviceOrientationEvent;
    if (!Orientation) return;
    if (typeof Orientation.requestPermission === "function" && await Orientation.requestPermission() !== "granted") return;
    clearTimeout(idleTimer.current);
    setGyro(true); setAutoTour(false); setSpotlight(null);
  };

  const registerInteraction = useCallback(() => {
    setAutoTour(false);
    setSpotlight(null);
    clearTimeout(idleTimer.current);
    if (!gyro) idleTimer.current = window.setTimeout(() => setAutoTour(true), 5000);
  }, [gyro]);

  useEffect(() => () => clearTimeout(idleTimer.current), []);

  useEffect(() => {
    if (!active) return;
    const reveal = window.setInterval(() => {
      setVisibleCount((count) => {
        const next = Math.min(displayPhotos.length, count + 25);
        if (next === displayPhotos.length) clearInterval(reveal);
        return next;
      });
    }, 250);
    return () => clearInterval(reveal);
  }, [active, displayPhotos.length]);

  useEffect(() => {
    if (!active || !autoTour || firstSpotlightDone.current) return;
    const first = window.setTimeout(() => {
      if (!spotlightBag.current.length) spotlightBag.current.push(...shufflePhotos(Array.from({ length: displayPhotos.length }, (_, index) => index)));
      const next = Math.floor(Math.random() * Math.min(14, displayPhotos.length));
      spotlightBag.current = spotlightBag.current.filter((index) => index !== next);
      lastSpotlight.current = next;
      firstSpotlightDone.current = true;
      setSpotlight(next);
    }, 1500);
    return () => clearTimeout(first);
  }, [active, autoTour, displayPhotos.length]);

  useEffect(() => {
    if (!active || !autoTour || visibleCount < displayPhotos.length) return;
    const cycle = window.setInterval(() => {
      const next = takeFromShuffleBag(spotlightBag.current, displayPhotos.length, lastSpotlight.current);
      lastSpotlight.current = next;
      setSpotlight(next);
    }, 7600);
    return () => clearInterval(cycle);
  }, [active, autoTour, visibleCount, displayPhotos.length]);

  const selectSpotlight = useCallback((index) => {
    registerInteraction();
    if (!spotlightBag.current.length) spotlightBag.current.push(...shufflePhotos(Array.from({ length: displayPhotos.length }, (_, item) => item)));
    spotlightBag.current = spotlightBag.current.filter((item) => item !== index);
    lastSpotlight.current = index;
    setSpotlight(index);
  }, [displayPhotos.length, registerInteraction]);

  return (
    <section className="galaxy-mode">
      <div style={{ display: storyOpen ? 'none' : 'block', width: '100%', height: '100%' }}>
        <Canvas camera={{ position: [0, 0, 0.01], fov: 62, near: 0.1, far: 160 }} dpr={[1, 1.6]}>
          <color attach="background" args={["#02030a"]} />
          <GalaxyScene photos={displayPhotos} active={active} gyro={gyro} autoTour={autoTour} visibleCount={visibleCount} spotlight={spotlight} setSpotlight={selectSpotlight} onInteraction={registerInteraction} onTexture={textureLoaded} />
        </Canvas>
      </div>
      {active && loaded < visibleCount && <div className="asset-progress"><span style={{ width: `${Math.round(loaded / visibleCount * 100)}%` }} /></div>}
      {spotlight != null && active && <aside className="galaxy-quote" key={spotlight}><small>{String(spotlight + 1).padStart(2, "0")} / {displayPhotos.length}</small><blockquote>{displayPhotos[spotlight].quote}</blockquote><p>{displayPhotos[spotlight].title}</p></aside>}
      {active && <button className={`gyro-toggle ${gyro ? "on" : ""}`} onClick={enableGyro}>{gyro ? "GYRO ON" : "GYRO"}</button>}
      {active && <button className="story-export-toggle" onClick={() => setStoryOpen(true)}>▯ <span>BUAT VERSI STORY</span></button>}
      {active && <div className={`tour-status ${autoTour ? "auto" : "manual"}`}><i />{gyro ? "GYRO · JELAJAH BEBAS" : autoTour ? "AUTO TOUR" : "JELAJAH BEBAS"}</div>}
      {active && <div className="mode-instruction">{autoTour ? "GERAKKAN LAYAR UNTUK MENGAMBIL KONTROL" : "↔  DRAG UNTUK MELIHAT · KLIK FOTO · AUTO 5 DETIK"}</div>}
      {storyOpen && <StoryExport photos={displayPhotos} onClose={() => setStoryOpen(false)} />}
    </section>
  );
}

function GalaxyScene({ photos: displayPhotos, active, gyro, autoTour, visibleCount, spotlight, setSpotlight, onInteraction, onTexture }) {
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
    const down = (event) => { onInteraction(); look.current.dragging = true; look.current.x = event.clientX; look.current.y = event.clientY; canvas.setPointerCapture(event.pointerId); };
    const move = (event) => {
      if (!look.current.dragging) return;
      onInteraction();
      look.current.yaw -= (event.clientX - look.current.x) * 0.0032;
      look.current.pitch = THREE.MathUtils.clamp(look.current.pitch - (event.clientY - look.current.y) * 0.0032, -1.35, 1.35);
      look.current.x = event.clientX; look.current.y = event.clientY;
    };
    const up = (event) => { look.current.dragging = false; if (event?.pointerId != null && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); };
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
    return () => { canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", up); };
  }, [gl, spotlight, onInteraction]);

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
    world.current.rotation.y += delta * 0.013;
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
        {displayPhotos.slice(0, visibleCount).map((photo, index) => <SpherePhoto key={photo.image} photo={photo} index={index} total={displayPhotos.length} active={spotlight === index} dimmed={spotlight != null && spotlight !== index} onClick={() => setSpotlight(index)} onLoad={onTexture} meshRefs={meshRefs} />)}
      </group>
    </>
  );
}

function SpherePhoto({ photo, index, total, active, dimmed, onClick, onLoad, meshRefs }) {
  const mesh = useRef();
  const material = useRef();
  const [texture, setTexture] = useState(null);
  const { size, camera } = useThree();
  const homeQuaternion = useRef(new THREE.Quaternion());
  const rotationWork = useMemo(() => ({ parent: new THREE.Quaternion(), target: new THREE.Quaternion() }), []);
  const positions = useMemo(() => {
    const y = 1 - index / (total - 1) * 2, radius = Math.sqrt(1 - y * y), theta = Math.PI * (3 - Math.sqrt(5)) * index;
    const home = new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius).multiplyScalar(30);
    const compact = size.width < 700;
    const activeSize = compact ? 0.86 : 1.65;
    return { home, near: home.clone().normalize().multiplyScalar(compact ? 11 : 7), normalScale: new THREE.Vector3(1, 1, 1), activeScale: new THREE.Vector3(activeSize, activeSize, activeSize) };
  }, [index, total, size.width]);
  const home = positions.home;

  useEffect(() => {
    let alive = true;
    new THREE.TextureLoader().load(photo.thumbnail, (loadedTexture) => {
      if (!alive) return loadedTexture.dispose();
      loadedTexture.colorSpace = THREE.SRGBColorSpace; setTexture(loadedTexture); onLoad();
    });
    return () => { alive = false; };
  }, [photo.thumbnail, onLoad]);

  useEffect(() => {
    if (mesh.current && texture) {
      // PlaneGeometry faces +Z and Object3D.lookAt points +Z at the target.
      // No extra 180° Y rotation: that exposes the back face and mirrors it.
      mesh.current.lookAt(0, 0, 0);
      homeQuaternion.current.copy(mesh.current.quaternion);
      meshRefs.current[index] = mesh.current;
    }
  }, [index, meshRefs, texture]);
  useEffect(() => () => texture?.dispose(), [texture]);
  useFrame((_, delta) => {
    if (!mesh.current || !material.current) return;
    const destination = active ? positions.near : home;
    mesh.current.position.lerp(destination, 1 - Math.exp(-delta * 2.3));
    mesh.current.scale.lerp(active ? positions.activeScale : positions.normalScale, 1 - Math.exp(-delta * 3));
    if (active) {
      mesh.current.parent.getWorldQuaternion(rotationWork.parent);
      rotationWork.target.copy(rotationWork.parent).invert().multiply(camera.quaternion);
      mesh.current.quaternion.slerp(rotationWork.target, 1 - Math.exp(-delta * 4));
    } else {
      mesh.current.quaternion.slerp(homeQuaternion.current, 1 - Math.exp(-delta * 3));
    }
    material.current.opacity = THREE.MathUtils.damp(material.current.opacity, dimmed ? 0.2 : 0.9, 4, delta);
  });
  if (!texture) return null;
  const ratio = texture.image.width / texture.image.height, width = ratio >= 1 ? 5.8 : 4.2;
  return <mesh ref={mesh} position={home} onClick={(event) => { event.stopPropagation(); onClick(); }}><planeGeometry args={[width, width / ratio]} /><meshBasicMaterial ref={material} map={texture} transparent opacity={0.9} side={THREE.DoubleSide} /></mesh>;
}

function shufflePhotos(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled;
}

function takeFromShuffleBag(bag, count, previous) {
  if (!bag.length) {
    bag.push(...shufflePhotos(Array.from({ length: count }, (_, index) => index)));
    if (count > 1 && bag.at(-1) === previous) [bag[0], bag[bag.length - 1]] = [bag.at(-1), bag[0]];
  }
  return bag.pop();
}
