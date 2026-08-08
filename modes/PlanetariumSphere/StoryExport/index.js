"use client";
import { useEffect, useMemo, useState } from "react";
import PhotoSelector, { autoCurate } from "./PhotoSelector";
import StoryPlayer from "./StoryPlayer";
import ScreenRecordGuide from "@/shared/StoryExport/ScreenRecordGuide";
import { useAudio } from "@/shared/AudioManager";

export default function StoryExport({ photos, onClose }) {
  const initial = useMemo(() => autoCurate(photos), [photos]);
  const [selected, setSelected] = useState(initial), [stage, setStage] = useState("setup"), [watermark, setWatermark] = useState(true), [countdown, setCountdown] = useState(3), [runId, setRunId] = useState(0), [recording, setRecording] = useState(false);
  const { pause, resume, seekAudio, fadeTo } = useAudio();
  const begin = (isRecording) => { setRecording(isRecording); if (isRecording) setStage("guide"); else startCountdown(false); };
  const startCountdown = (isRecording = recording) => { setRecording(isRecording); setCountdown(3); setStage("countdown"); };
  useEffect(() => {
    if (stage !== "countdown") return;
    if (countdown <= 0) { setRunId((value) => value + 1); seekAudio(45); fadeTo(.5, 300); resume(); setStage("playing"); return; }
    const timer = setTimeout(() => setCountdown((value) => value - 1), 900); return () => clearTimeout(timer);
  }, [stage, countdown, fadeTo, resume, seekAudio]);
  const finish = () => { pause(); setStage("finished"); };
  const close = () => { resume(); onClose(); };
  return <div className="story-export"><div className="story-export-backdrop" onClick={close} /><section className="story-export-panel"><header><div><small>MODE 01 · STORY EXPORT</small><h2>Galaksi dalam format vertikal.</h2></div><button onClick={close} aria-label="Tutup">×</button></header><div className="story-export-body"><div className="story-preview-wrap"><StoryPlayer photos={selected} playing={stage === "playing"} runId={runId} watermark={watermark} onFinish={finish} />{stage === "countdown" && <div className="story-countdown"><small>{recording ? "SCREEN RECORDING" : "PREVIEW"}</small><b>{countdown || "GO"}</b></div>}{stage === "finished" && <div className="story-finished"><small>{recording ? "RECORDING SEQUENCE COMPLETE" : "PREVIEW COMPLETE"}</small><button onClick={() => startCountdown(recording)}>Putar Ulang</button><button onClick={() => setStage("setup")}>Edit Story</button></div>}</div><div className="story-config">{stage === "guide" ? <ScreenRecordGuide onCancel={() => setStage("setup")} onStart={() => startCountdown(true)} /> : <><PhotoSelector photos={photos} selected={selected} onChange={setSelected} /><label className="watermark-option"><input type="checkbox" checked={watermark} onChange={(event) => setWatermark(event.target.checked)} /><span>Watermark YTTA</span></label><div className="story-actions"><button disabled={selected.length < 4} onClick={() => begin(false)}>Preview 24 Detik</button><button className="primary" disabled={selected.length < 4} onClick={() => begin(true)}>Siapkan Screen Record</button></div><p className="story-note">Preview menggunakan potongan musik mulai 0:45. Pastikan izin penggunaan audio sebelum membagikan hasil rekaman.</p></>}</div></div></section></div>;
}
