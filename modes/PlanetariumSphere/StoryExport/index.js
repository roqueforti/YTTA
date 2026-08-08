"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PhotoSelector, { autoCurate } from "./PhotoSelector";
import StoryPlayer from "./StoryPlayer";
import { createStoryRecorder, downloadStoryVideo, shareStoryVideo, storyVideoExtension } from "@/shared/StoryExport/VideoRecorder";
import { useAudio } from "@/shared/AudioManager";

export default function StoryExport({ photos, onClose }) {
  const initial = useMemo(() => autoCurate(photos), [photos]);
  const [selected, setSelected] = useState(initial), [stage, setStage] = useState("setup"), [watermark, setWatermark] = useState(true), [countdown, setCountdown] = useState(3), [runId, setRunId] = useState(0), [exporting, setExporting] = useState(false), [video, setVideo] = useState(null), [shareStatus, setShareStatus] = useState("");
  const canvasRef = useRef(null), recorderRef = useRef(null), sceneRef = useRef(0);
  const { pause, resume, seekAudio, fadeTo, getAudioCaptureStream } = useAudio();
  const startCountdown = (shouldExport = false) => { setExporting(shouldExport); setVideo(null); setShareStatus(""); setCountdown(3); setStage("countdown"); };
  useEffect(() => {
    if (stage !== "countdown") return;
    if (countdown <= 0) { setRunId((value) => value + 1); seekAudio(45); fadeTo(.5, 300); resume(); setStage("playing"); return; }
    const timer = setTimeout(() => setCountdown((value) => value - 1), 900); return () => clearTimeout(timer);
  }, [stage, countdown, fadeTo, resume, seekAudio]);
  useEffect(() => {
    if (stage !== "playing" || !exporting) return;
    const timer = setTimeout(() => { recorderRef.current = createStoryRecorder(canvasRef.current, { audioStream: getAudioCaptureStream(), getOverlay: () => ({ ...selected[sceneRef.current], watermark }) }); recorderRef.current?.start(); }, 0);
    return () => clearTimeout(timer);
  }, [stage, exporting, runId, getAudioCaptureStream, selected, watermark]);
  const finish = useCallback(async () => {
    pause();
    if (recorderRef.current) { const blob = await recorderRef.current.stop(); recorderRef.current = null; setVideo(blob); }
    setStage("finished");
  }, [pause]);
  const share = async (platform) => { if (!video) return; try { const result = await shareStoryVideo(video, platform); setShareStatus(result === "shared" ? `Menu share dibuka · pilih ${platform}` : "Share file tidak didukung — video sudah diunduh"); } catch (error) { if (error?.name !== "AbortError") setShareStatus("Tidak dapat membuka menu share"); } };
  const download = () => { if (!video) return; const extension = downloadStoryVideo(video); setShareStatus(extension === "mp4" ? "MP4 berhasil diunduh" : "Browser ini hanya mendukung encoder WebM; file WebM berhasil diunduh"); };
  const close = () => { resume(); onClose(); };
  return <div className="story-export"><div className="story-export-backdrop" onClick={close} /><section className="story-export-panel"><header><div><small>MODE 01 · STORY EXPORT</small><h2>Buat Story dalam beberapa klik.</h2></div><button onClick={close} aria-label="Tutup">×</button></header><div className="story-export-body"><div className="story-preview-wrap"><StoryPlayer photos={selected} playing={stage === "playing"} runId={runId} watermark={watermark} onFinish={finish} onCanvasReady={(canvas) => { canvasRef.current = canvas; }} onSceneChange={(index) => { sceneRef.current = index; }} />{stage === "countdown" && <div className="story-countdown"><small>{exporting ? "MENYIAPKAN VIDEO" : "PREVIEW"}</small><b>{countdown || "GO"}</b></div>}{stage === "finished" && <div className="story-finished"><small>{exporting ? `VIDEO ${video ? storyVideoExtension(video).toUpperCase() : ""} SIAP` : "PREVIEW SELESAI"}</small>{video && <><button className="download-story" onClick={download}>↓ Download {storyVideoExtension(video).toUpperCase()}</button><div className="platform-share"><button onClick={() => share("Instagram")}>Instagram</button><button onClick={() => share("WhatsApp")}>WhatsApp</button><button onClick={() => share("TikTok")}>TikTok</button></div><span className="share-hint">Menu share perangkat akan terbuka dengan file video terlampir.</span></>}<button onClick={() => startCountdown(exporting)}>Putar Ulang</button><button onClick={() => setStage("setup")}>Ganti Foto</button>{shareStatus && <p>{shareStatus}</p>}</div>}</div><div className="story-config"><PhotoSelector photos={photos} selected={selected} onChange={setSelected} /><label className="watermark-option"><input type="checkbox" checked={watermark} onChange={(event) => setWatermark(event.target.checked)} /><span>Watermark YTTA</span></label><div className="story-actions"><button disabled={selected.length < 4} onClick={() => startCountdown(false)}>Lihat Preview</button><button className="primary" disabled={selected.length < 4} onClick={() => startCountdown(true)}>Buat Video Story</button></div><p className="story-note">MP4 digunakan jika encoder perangkat mendukungnya. Tombol platform membuka native share sheet dengan video terlampir.</p></div></div></section></div>;
}
