function wrapText(context, text, maxWidth) {
  const words = text.split(/\s+/), lines = []; let line = "";
  words.forEach((word) => { const test = `${line} ${word}`.trim(); if (context.measureText(test).width > maxWidth && line) { lines.push(line); line = word; } else line = test; });
  if (line) lines.push(line); return lines.slice(0, 4);
}

export function createStoryRecorder(source, { getOverlay, audioStream } = {}) {
  if (!source || typeof MediaRecorder === "undefined") return null;
  const output = document.createElement("canvas"); output.width = 540; output.height = 960;
  const context = output.getContext("2d"), stream = output.captureStream(30);
  audioStream?.getAudioTracks().forEach((track) => stream.addTrack(track));
  const candidates = ["video/mp4;codecs=h264", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  const mimeType = candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "", chunks = [];
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 7_000_000 } : undefined);
  recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
  let frame;
  const draw = () => {
    context.drawImage(source, 0, 0, output.width, output.height);
    const gradient = context.createLinearGradient(0, 500, 0, 960); gradient.addColorStop(0, "transparent"); gradient.addColorStop(1, "rgba(1,2,8,.82)"); context.fillStyle = gradient; context.fillRect(0, 480, 540, 480);
    context.strokeStyle = "rgba(255,255,255,.45)"; context.lineWidth = 1; context.beginPath(); context.moveTo(38, 135); context.lineTo(502, 135); context.stroke();
    context.fillStyle = "#fff"; context.font = "600 9px sans-serif"; context.letterSpacing = "2px"; context.fillText("GALAKSI KENANGAN · YTTA", 38, 119);
    const overlay = getOverlay?.();
    if (overlay?.quote) { context.textAlign = "center"; context.font = "italic 600 27px Georgia"; const lines = wrapText(context, `“${overlay.quote}”`, 450); lines.forEach((line, index) => context.fillText(line, 270, 695 + index * 36)); context.font = "600 8px sans-serif"; context.fillStyle = "#bdc8e2"; context.fillText(`${overlay.event} · ${overlay.dateLabel}`.toUpperCase(), 270, 710 + lines.length * 36); }
    if (overlay?.watermark) { context.textAlign = "right"; context.fillStyle = "#fff"; context.font = "600 15px Georgia"; context.fillText("YTTA", 505, 895); context.font = "600 6px sans-serif"; context.fillText("MEMORY ARCHIVE", 505, 910); }
    context.textAlign = "left"; frame = requestAnimationFrame(draw);
  };
  return { mimeType: mimeType || "video/webm", start() { draw(); recorder.start(500); }, stop() { return new Promise((resolve) => { recorder.onstop = () => { cancelAnimationFrame(frame); stream.getVideoTracks().forEach((track) => track.stop()); resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || "video/webm" })); }; recorder.stop(); }); } };
}

export async function shareStoryVideo(blob) {
  const extension = blob.type.includes("mp4") ? "mp4" : "webm", file = new File([blob], `ytta-galaksi-story.${extension}`, { type: blob.type });
  if (navigator.share && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: "Galaksi Kenangan · YTTA" }); return "shared"; }
  const url = URL.createObjectURL(blob), anchor = document.createElement("a"); anchor.href = url; anchor.download = file.name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return "downloaded";
}
