"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import ModeSelector from "./ModeSelector";
import { AudioProvider, useAudio } from "@/shared/AudioManager";

const PlanetariumSphere = dynamic(() => import("@/modes/PlanetariumSphere"), { ssr: false });
const MemoryWall = dynamic(() => import("@/modes/MemoryWall"), { ssr: false });
const CinematicRecap = dynamic(() => import("@/modes/CinematicRecap"), { ssr: false });

export default function ExperienceApp() {
  return <AudioProvider><ExperienceRouter /></AudioProvider>;
}

function ExperienceRouter() {
  const [mode, setMode] = useState(null);
  const [started, setStarted] = useState(false);
  const { muted, start, toggleMute } = useAudio();
  const chooseMode = (nextMode) => { setMode(nextMode); setStarted(false); };
  const enter = async () => { await start(); setStarted(true); };
  const back = () => { setMode(null); setStarted(false); };
  if (!mode) return <ModeSelector onSelect={chooseMode} />;

  const names = { galaxy: "GALAKSI KENANGAN", wall: "LORONG KENANGAN", cinematic: "CINEMATIC RECAP" };
  const titles = { galaxy: "Galaksi Kenangan", wall: "Lorong Kenangan", cinematic: "Cinematic Recap" };
  const eyebrow = { galaxy: "ENTER THE ORBIT", wall: "ENTER THE HALLWAY", cinematic: "A MEMORY FILM" };
  const descriptions = {
    galaxy: "Drag untuk melihat semesta di sekelilingmu.",
    wall: "Geser untuk menyusuri dinding kenangan.",
    cinematic: "Duduk tenang. Biarkan kenangan memutar ceritanya sendiri.",
  };

  return <main className={`experience-shell theme-${mode}`}>
    {mode === "galaxy" ? <PlanetariumSphere active={started} /> : mode === "wall" ? <MemoryWall active={started} /> : <CinematicRecap active={started} onBack={back} />}
    <header className="experience-nav">
      <button className="back-mode" onClick={back} aria-label="Kembali ke pilihan mode">← <span>PILIH MODE</span></button>
      <strong>{names[mode]}</strong>
      <button className="sound-toggle" onClick={toggleMute} aria-label={muted ? "Nyalakan musik" : "Matikan musik"}>{muted ? "♪×" : "♪"}</button>
    </header>
    {!started && <section className="start-overlay">
      <span className="eyebrow">{eyebrow[mode]}</span><h1>{titles[mode]}</h1><p>{descriptions[mode]}</p>
      <button className="enter-btn" onClick={enter}><span>{mode === "cinematic" ? "Klik untuk memutar" : "Klik untuk mulai"}</span><i>↗</i></button>
    </section>}
  </main>;
}
