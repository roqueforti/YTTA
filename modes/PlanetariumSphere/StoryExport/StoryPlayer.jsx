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
  useFrame((_, delta) => {
    if (!playing || completed.current) return;
    elapsed.current = Math.min(STORY_DURATION, elapsed.current + delta);
    const progress = elapsed.current / STORY_DURATION;
    layout.curve.getPointAt(Math.min(.999, progress), camera.position);
    const index = Math.min(photos.length - 1, Math.floor(progress * photos.length));
    if (index !== lastScene.current) { lastScene.current = index; onScene(index); }
    const target = layout.photos[index]; camera.lookAt(target);
    group.current.rotation.z = Math.sin(progress * Math.PI * 2) * .015;
    if (elapsed.current >= STORY_DURATION) { completed.current = true; onFinish(); }
  });
  return <><points><bufferGeometry><bufferAttribute attach="attributes-position" args={[stars, 3]} /></bufferGeometry><pointsMaterial color="#dce7ff" size={.055} transparent opacity={.85} /></points><group ref={group}>{photos.map((photo, index) => <StoryPhoto key={photo.image} photo={photo} position={layout.photos[index]} activeIndex={lastScene} index={index} />)}</group></>;
}

function StoryPhoto({ photo, position, index, activeIndex }) {
  const mesh = useRef(), texture = useLoader(THREE.TextureLoader, photo.image);
  useEffect(() => { texture.colorSpace = THREE.SRGBColorSpace; }, [texture]);
  useFrame((_, delta) => { if (!mesh.current) return; const target = activeIndex.current === index ? 1.18 : 1; const scale = THREE.MathUtils.damp(mesh.current.scale.x, target, 5, delta); mesh.current.scale.setScalar(scale); });
  const ratio = texture.image.width / texture.image.height, width = ratio > 1 ? 4.6 : 3.45;
  return <mesh ref={mesh} position={position} onUpdate={(self) => self.lookAt(0, position.y, position.z + 6)}><planeGeometry args={[width, width / ratio]} /><meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} /></mesh>;
}
