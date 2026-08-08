"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import ModeSelector from "./ModeSelector";
import { AudioProvider, useAudio } from "@/shared/AudioManager";
import { prepareExperienceAssets, unsubscribeAssetProgress } from "@/shared/AssetPreloader";

const PlanetariumSphere = dynamic(() => import("@/modes/PlanetariumSphere"), { ssr: false });
const MemoryWall = dynamic(() => import("@/modes/MemoryWall"), { ssr: false });
const CinematicRecap = dynamic(() => import("@/modes/CinematicRecap"), { ssr: false });

export default function ExperienceApp() {
  return <AudioProvider><ExperienceRouter /></AudioProvider>;
}

function ExperienceRouter() {
  const [mode, setMode] = useState(null);
  const [started, setStarted] = useState(false);
  const [preparation, setPreparation] = useState({ completed: 0, total: 0, progress: 0 });
  const [chromeVisible, setChromeVisible] = useState(true);
  const [musicOpen, setMusicOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const hideTimer = useRef(null);
  const { muted, currentTrack, tracks, start, stop, selectTrack, toggleMute } = useAudio();

  useEffect(() => {
    PlanetariumSphere.preload?.(); MemoryWall.preload?.(); CinematicRecap.preload?.();
    prepareExperienceAssets(setPreparation);
    return () => unsubscribeAssetProgress(setPreparation);
  }, []);

  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", update);
    document.addEventListener("webkitfullscreenchange", update);
    return () => { document.removeEventListener("fullscreenchange", update); document.removeEventListener("webkitfullscreenchange", update); };
  }, []);

  const revealChrome = useCallback(() => {
    setChromeVisible(true);
    clearTimeout(hideTimer.current);
    if (started && !musicOpen) hideTimer.current = setTimeout(() => setChromeVisible(false), 2000);
  }, [started, musicOpen]);

  useEffect(() => { revealChrome(); return () => clearTimeout(hideTimer.current); }, [revealChrome]);

  const chooseMode = async (nextMode) => { setMode(nextMode); setStarted(false); setChromeVisible(true); await start(); };
  const enter = async () => { await start(); setStarted(true); };
  const back = () => {
    stop(); setMode(null); setStarted(false); setMusicOpen(false); setChromeVisible(true);
    if (document.fullscreenElement) document.exitFullscreen?.();
  };
  const toggleFullscreen = async () => {
    const root = document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement) await (document.exitFullscreen?.() ?? document.webkitExitFullscreen?.());
    else await (root.requestFullscreen?.() ?? root.webkitRequestFullscreen?.());
    revealChrome();
  };

  if (!mode) return <ModeSelector onSelect={chooseMode} preparation={preparation} />;

  const names = { galaxy: "GALAKSI KENANGAN", wall: "LORONG KENANGAN", cinematic: "CINEMATIC RECAP" };
  const titles = { galaxy: "Galaksi Kenangan", wall: "Lorong Kenangan", cinematic: "Cinematic Recap" };
  const eyebrow = { galaxy: "ENTER THE ORBIT", wall: "ENTER THE HALLWAY", cinematic: "A MEMORY FILM" };
  const descriptions = { galaxy: "Drag untuk melihat semesta di sekelilingmu.", wall: "Geser untuk menyusuri dinding kenangan.", cinematic: "Duduk tenang. Biarkan kenangan memutar ceritanya sendiri." };
  const track = tracks[currentTrack];

  return <main className={`experience-shell theme-${mode} ${chromeVisible ? "chrome-visible" : "chrome-hidden"}`} onPointerMove={revealChrome} onPointerDown={revealChrome}>
    {mode === "galaxy" ? <PlanetariumSphere active={started} /> : mode === "wall" ? <MemoryWall active={started} /> : <CinematicRecap active={started} onBack={back} prepared={preparation.progress >= 1} />}
    <header className="experience-nav">
      <button className="back-mode" onClick={back} aria-label="Kembali ke pilihan mode">← <span>PILIH MODE</span></button>
      <strong>{names[mode]}</strong>
      <div className="audio-controls">
        <div className={`music-picker ${musicOpen ? "open" : ""}`}>
          <button className="music-current" onClick={() => setMusicOpen((open) => !open)} aria-expanded={musicOpen}>
            <span><small>NOW PLAYING · {currentTrack + 1}/3</small><b>{track.title}</b><em>{track.artist}</em></span><i>⌄</i>
          </button>
          {musicOpen && <div className="music-menu">
            {tracks.map((item, index) => <button key={item.file} className={index === currentTrack ? "active" : ""} onClick={() => { selectTrack(index); setMusicOpen(false); revealChrome(); }}><span>{String(index + 1).padStart(2, "0")}</span><b>{item.title}</b><small>{item.artist}</small></button>)}
          </div>}
        </div>
        <button className="chrome-circle sound-toggle" onClick={toggleMute} aria-label={muted ? "Nyalakan musik" : "Matikan musik"}>{muted ? "♪×" : "♪"}</button>
        <button className="chrome-circle fullscreen-toggle" onClick={toggleFullscreen} aria-label={fullscreen ? "Keluar fullscreen" : "Masuk fullscreen"}>{fullscreen ? "↙" : "⛶"}</button>
      </div>
    </header>
    {!started && <section className="start-overlay">
      <span className="eyebrow">{eyebrow[mode]}</span><h1>{titles[mode]}</h1><p>{descriptions[mode]}</p>
      <p className="device-note">Untuk experience terbaik, gunakan iPad/tablet atau laptop/komputer.</p>
      <button className="enter-btn" onClick={enter}><span>{mode === "cinematic" ? "Klik untuk memutar" : "Klik untuk mulai"}</span><i>↗</i></button>
    </section>}
  </main>;
}
