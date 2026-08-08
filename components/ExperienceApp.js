"use client";

import { useEffect, useState } from "react";
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
  const { muted, currentTrack, tracks, start, stop, selectTrack, toggleMute } = useAudio();
  const chooseMode = async (nextMode) => { setMode(nextMode); setStarted(false); await start(); };
  const enter = async () => { await start(); setStarted(true); };
  const back = () => { stop(); setMode(null); setStarted(false); };
  useEffect(() => {
    PlanetariumSphere.preload?.();
    MemoryWall.preload?.();
    CinematicRecap.preload?.();
    prepareExperienceAssets(setPreparation);
    return () => unsubscribeAssetProgress(setPreparation);
  }, []);

  if (!mode) return <ModeSelector onSelect={chooseMode} preparation={preparation} />;

  const names = { galaxy: "GALAKSI KENANGAN", wall: "LORONG KENANGAN", cinematic: "CINEMATIC RECAP" };
  const titles = { galaxy: "Galaksi Kenangan", wall: "Lorong Kenangan", cinematic: "Cinematic Recap" };
  const eyebrow = { galaxy: "ENTER THE ORBIT", wall: "ENTER THE HALLWAY", cinematic: "A MEMORY FILM" };
  const descriptions = {
    galaxy: "Drag untuk melihat semesta di sekelilingmu.",
    wall: "Geser untuk menyusuri dinding kenangan.",
    cinematic: "Duduk tenang. Biarkan kenangan memutar ceritanya sendiri.",
  };

  return <main className={`experience-shell theme-${mode}`}>
    {mode === "galaxy" ? <PlanetariumSphere active={started} /> : mode === "wall" ? <MemoryWall active={started} /> : <CinematicRecap active={started} onBack={back} prepared={preparation.progress >= 1} />}
    <header className="experience-nav">
      <button className="back-mode" onClick={back} aria-label="Kembali ke pilihan mode">← <span>PILIH MODE</span></button>
      <strong>{names[mode]}</strong>
      <div className="audio-controls">
        <select className="track-select" value={currentTrack} onChange={(event) => selectTrack(Number(event.target.value))} aria-label="Pilih lagu">
          {tracks.map((track, index) => <option key={track.file} value={index}>{index + 1}. {track.title} — {track.artist}</option>)}
        </select>
        <button className="sound-toggle" onClick={toggleMute} aria-label={muted ? "Nyalakan musik" : "Matikan musik"}>{muted ? "♪×" : "♪"}</button>
      </div>
    </header>
    {!started && <section className="start-overlay">
      <span className="eyebrow">{eyebrow[mode]}</span><h1>{titles[mode]}</h1><p>{descriptions[mode]}</p>
      <p className="device-note">Untuk experience terbaik, gunakan iPad/tablet atau laptop/komputer.</p>
      <button className="enter-btn" onClick={enter}><span>{mode === "cinematic" ? "Klik untuk memutar" : "Klik untuk mulai"}</span><i>↗</i></button>
    </section>}
  </main>;
}
