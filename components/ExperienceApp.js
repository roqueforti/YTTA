"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import ModeSelector from "./ModeSelector";
import { AudioProvider, useAudio } from "@/shared/AudioManager";

const PlanetariumSphere = dynamic(() => import("@/modes/PlanetariumSphere"), { ssr: false });
const MemoryWall = dynamic(() => import("@/modes/MemoryWall"), { ssr: false });

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

  return (
    <main className={`experience-shell theme-${mode}`}>
      {mode === "galaxy" ? <PlanetariumSphere active={started} /> : <MemoryWall active={started} />}
      <header className="experience-nav">
        <button className="back-mode" onClick={back} aria-label="Kembali ke pilihan mode">← <span>PILIH MODE</span></button>
        <strong>{mode === "galaxy" ? "GALAKSI KENANGAN" : "LORONG KENANGAN"}</strong>
        <button className="sound-toggle" onClick={toggleMute} aria-label={muted ? "Nyalakan musik" : "Matikan musik"}>{muted ? "◖×" : "◖))"}</button>
      </header>
      {!started && (
        <section className="start-overlay">
          <span className="eyebrow">{mode === "galaxy" ? "ENTER THE ORBIT" : "ENTER THE HALLWAY"}</span>
          <h1>{mode === "galaxy" ? "Galaksi Kenangan" : "Lorong Kenangan"}</h1>
          <p>{mode === "galaxy" ? "Drag untuk melihat semesta di sekelilingmu." : "Geser untuk menyusuri dinding kenangan."}</p>
          <button className="enter-btn" onClick={enter}><span>Klik untuk mulai</span><i>↗</i></button>
        </section>
      )}
    </main>
  );
}
