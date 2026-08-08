"use client";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { buildStoryLayout, STORY_DURATION } from "./FlyThroughPath";
import { STORY_FOV } from "./VerticalFraming";

export default function StoryPlayer({ photos, playing, runId, watermark, onFinish }) {
  const [sceneIndex, setSceneIndex] = useState(0);
  return <div className="story-frame"><Canvas key={runId} camera={{ position: [0, 0, 1.5], fov: STORY_FOV, near: .1, far: 100 }} dpr={[1, 1.5]}><color attach="background" args={["#02030a"]} /><StoryScene photos={photos} playing={playing} onScene={setSceneIndex} onFinish={onFinish} /></Canvas><div className="story-vignette" /><div className="story-safe top">GALAKSI KENANGAN <i>·</i> YTTA</div><blockquote key={`${runId}-${sceneIndex}`}>“{photos[sceneIndex]?.quote}”<small>{photos[sceneIndex]?.event} · {photos[sceneIndex]?.dateLabel}</small></blockquote>{watermark && <span className="story-watermark">YTTA<br /><small>MEMORY ARCHIVE</small></span>}</div>;
}

function StoryScene({ photos, playing, onScene, onFinish }) {
  const group = useRef(), elapsed = useRef(0), completed = useRef(false), lastScene = useRef(-1);
  const { camera } = useThree();
  const layout = useMemo(() => buildStoryLayout(photos.length), [photos.length]);
  const stars = useMemo(() => { const points = new Float32Array(1800 * 3); for (let i = 0; i < 1800; i += 1) points.set([(Math.random() - .5) * 34, (Math.random() - .5) * 52, -Math.random() * 65], i * 3); return points; }, []);
  const cameraPosition = useMemo(() => new THREE.Vector3(), []), lookTarget = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    if (!playing || completed.current) return;
    elapsed.current = Math.min(STORY_DURATION, elapsed.current + delta);
    const progress = elapsed.current / STORY_DURATION, sequence = Math.min(photos.length - .0001, progress * photos.length);
    const index = Math.min(photos.length - 1, Math.floor(sequence)), nextIndex = Math.min(photos.length - 1, index + 1), local = sequence - index;
    const transition = THREE.MathUtils.smoothstep(local, .7, 1);
    cameraPosition.copy(layout.views[index]).lerp(layout.views[nextIndex], transition);
    cameraPosition.x += Math.sin(local * Math.PI) * (index % 2 ? -.12 : .12);
    cameraPosition.y += Math.sin(local * Math.PI * 2) * .055;
    camera.position.lerp(cameraPosition, 1 - Math.exp(-delta * 8));
    if (index !== lastScene.current) { lastScene.current = index; onScene(index); }
    lookTarget.copy(layout.photos[index]).lerp(layout.photos[nextIndex], transition);
    camera.lookAt(lookTarget);
    camera.rotation.z += Math.sin(local * Math.PI) * (index % 2 ? -.008 : .008);
    if (elapsed.current >= STORY_DURATION) { completed.current = true; onFinish(); }
  });
  return <><points><bufferGeometry><bufferAttribute attach="attributes-position" args={[stars, 3]} /></bufferGeometry><pointsMaterial color="#dce7ff" size={.055} transparent opacity={.85} /></points><group ref={group}>{photos.map((photo, index) => <StoryPhoto key={photo.image} photo={photo} position={layout.photos[index]} view={layout.views[index]} activeIndex={lastScene} index={index} />)}</group></>;
}

function StoryPhoto({ photo, position, view, index, activeIndex }) {
  const card = useRef(), material = useRef(), halo = useRef(), texture = useLoader(THREE.TextureLoader, photo.image);
  useEffect(() => { texture.colorSpace = THREE.SRGBColorSpace; }, [texture]);
  useFrame((state, delta) => {
    if (!card.current || !material.current) return;
    const active = activeIndex.current === index, target = active ? 1.025 : .96;
    const scale = THREE.MathUtils.damp(card.current.scale.x, target, 4, delta); card.current.scale.setScalar(scale);
    card.current.position.y = position.y + Math.sin(state.clock.elapsedTime * .55 + index) * .045;
    material.current.opacity = THREE.MathUtils.damp(material.current.opacity, active ? 1 : .12, 7, delta);
    if (halo.current) halo.current.rotation.z += delta * (index % 2 ? -.05 : .05);
  });
  const ratio = texture.image.width / texture.image.height, width = ratio > 1 ? 4.05 : 2.85, height = width / ratio;
  return <group ref={card} position={position} onUpdate={(self) => self.lookAt(view)}>
    <mesh position={[0, 0, -.055]}><planeGeometry args={[width + .16, height + .16]} /><meshBasicMaterial color="#b7c8f4" transparent opacity={.48} /></mesh>
    <mesh><planeGeometry args={[width, height]} /><meshBasicMaterial ref={material} map={texture} transparent opacity={index ? .12 : 1} side={THREE.DoubleSide} toneMapped={false} /></mesh>
    <mesh ref={halo} position={[0, 0, -.12]} scale={[1.35, 1.35, 1]}><ringGeometry args={[Math.max(width, height) * .57, Math.max(width, height) * .575, 96]} /><meshBasicMaterial color="#7891d1" transparent opacity={.25} side={THREE.DoubleSide} /></mesh>
  </group>;
}
