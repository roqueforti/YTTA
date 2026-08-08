"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import KenBurnsEffect from "./KenBurnsEffect";
import { useSceneSequencer } from "./SceneSequencer";
import { useAudioSync } from "./AudioSync";
import { photos } from "@/data/photos";
import { useAudio } from "@/shared/AudioManager";

export default function CinematicRecap({ active, onBack }) {
  const [loaded, setLoaded] = useState(0);
  const [finished, setFinished] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef();
  const { pause, resume, seekAudio } = useAudio();
  const finish = useCallback(() => { setFinished(true); pause(); }, [pause]);
  const { scene, progress, playing, toggle, seek, skip, replay, total } = useSceneSequencer(active && loaded === photos.length, finish);
  useAudioSync(scene, playing);

  useEffect(() => {
    let cancelled = false;
    photos.forEach((photo) => {
      const image = new Image();
      image.onload = image.onerror = () => !cancelled && setLoaded((count) => count + 1);
      image.src = photo.image;
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (active && loaded === photos.length) seekAudio(0);
  }, [active, loaded, seekAudio]);

  const showControls = () => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    if (playing) hideTimer.current = setTimeout(() => setControlsVisible(false), 2600);
  };
  const togglePlayback = () => { playing ? pause() : resume(); toggle(); showControls(); };
  const replayAll = () => { setFinished(false); seekAudio(0); resume(); replay(); };
  const format = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

  const sceneContent = useMemo(() => {
    if (scene.type === "opening") return <div className="film-card opening-card"><small>A MEMORY FILM</small><h1>Potongan Waktu</h1><p>2022 — 2026</p></div>;
    if (scene.type === "chapter") return <div className="film-card chapter-card"><small>MEMORY CHAPTER</small><h2>{scene.chapter.title}</h2><p>{scene.chapter.dateLabel}</p></div>;
    if (scene.type === "ending") return <div className="film-card ending-card"><small>UNTIL THE NEXT MEMORY</small><h2>Terima kasih<br />untuk kenangannya.</h2><p>YTTA · 2022—2026</p></div>;
    return <><KenBurnsEffect photo={scene.photo} direction={scene.index} duration={scene.duration} />{scene.impactful && <blockquote className="film-quote">“{scene.photo.quote}”<small>{scene.chapter.title}</small></blockquote>}</>;
  }, [scene]);

  if (loaded < photos.length) return <div className="film-loader"><div className="reel-count">{Math.max(1, 3 - Math.floor(loaded / Math.max(1, photos.length / 3)))}</div><small>PREPARING FILM REEL</small><div><span style={{ width: `${loaded / photos.length * 100}%` }} /></div><p>{loaded} / {photos.length}</p></div>;

  return <section className="cinematic-mode" onMouseMove={showControls} onTouchStart={showControls}>
    <div key={scene.index} className={`film-scene scene-${scene.type} transition-${scene.index % 4}`}>{sceneContent}</div>
    <div className="film-grade" /><div className="film-grain" /><div className="letterbox top" /><div className="letterbox bottom" />
    <div className={`film-controls ${controlsVisible || !playing ? "visible" : ""}`}>
      <button onClick={togglePlayback} aria-label={playing ? "Jeda" : "Putar"}>{playing ? "Ⅱ" : "▶"}</button>
      <button onClick={skip} aria-label="Lewati adegan">▶|</button><span>{format(progress * total)}</span>
      <input aria-label="Progress film" type="range" min="0" max="1" step="0.001" value={progress} onChange={(event) => seek(Number(event.target.value))} />
      <span>{format(total)}</span>
    </div>
    {finished && <div className="film-finished"><button onClick={replayAll}>Putar Ulang</button><button onClick={onBack}>Kembali ke Pilihan Mode</button></div>}
  </section>;
}
