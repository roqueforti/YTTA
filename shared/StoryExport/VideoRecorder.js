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
  const candidates = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  const mimeType = candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "", chunks = [];
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 7_000_000 } : undefined);
  recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
  let frame;
  const draw = () => {
    context.drawImage(source, 0, 0, output.width, output.height);
    const gradient = context.createLinearGradient(0, 500, 0, 960); gradient.addColorStop(0, "transparent"); gradient.addColorStop(1, "rgba(1,2,8,.82)"); context.fillStyle = gradient; context.fillRect(0, 480, 540, 480);
    
    // Header text
    context.shadowColor = "rgba(0,0,0,1)"; context.shadowBlur = 7; context.shadowOffsetY = 2;
    context.fillStyle = "#fff"; context.font = "500 10px sans-serif"; context.letterSpacing = "3px"; context.fillText("GALAKSI KENANGAN · YTTA", 38, 115);
    context.shadowColor = "transparent";
    // Header line
    context.strokeStyle = "rgba(255,255,255,.35)"; context.lineWidth = 1; context.beginPath(); context.moveTo(38, 126); context.lineTo(502, 126); context.stroke();
    
    const overlay = getOverlay?.();
    if (overlay?.quote) { 
      context.textAlign = "center"; 
      context.shadowColor = "rgba(0,0,0,1)"; context.shadowBlur = 18; context.shadowOffsetY = 3;
      context.font = "italic 500 23px Georgia"; context.fillStyle = "#fff";
      const lines = wrapText(context, `“${overlay.quote}”`, 450); 
      // Bottom align the quote (bottom: 15% -> y ~ 816)
      const startY = 780 - (lines.length * 32);
      lines.forEach((line, index) => context.fillText(line, 270, startY + index * 32)); 
      
      context.font = "500 9px sans-serif"; context.fillStyle = "#b8c3df"; context.letterSpacing = "2px"; 
      context.fillText(`${overlay.event} · ${overlay.dateLabel}`.toUpperCase(), 270, 780 + 18); 
      context.shadowColor = "transparent";
    }
    if (overlay?.watermark) { 
      context.textAlign = "right"; context.fillStyle = "#fff"; 
      context.shadowColor = "rgba(0,0,0,1)"; context.shadowBlur = 8; context.shadowOffsetY = 2;
      context.font = "500 14px Georgia"; context.fillText("YTTA", 505, 900); 
      context.font = "500 7px sans-serif"; context.letterSpacing = "1px"; context.fillText("MEMORY ARCHIVE", 505, 912); 
      context.shadowColor = "transparent"; 
    }
    context.textAlign = "left"; frame = requestAnimationFrame(draw);
  };
  return { mimeType: mimeType || "video/webm", start() { draw(); recorder.start(500); }, stop() { return new Promise((resolve) => { recorder.onstop = () => { cancelAnimationFrame(frame); stream.getVideoTracks().forEach((track) => track.stop()); resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || "video/webm" })); }; recorder.stop(); }); } };
}

export function storyVideoExtension(blob) { return blob.type.includes("mp4") ? "mp4" : "webm"; }

export function downloadStoryVideo(blob) {
  const extension = storyVideoExtension(blob), url = URL.createObjectURL(blob), anchor = document.createElement("a");
  anchor.href = url; anchor.download = `ytta-galaksi-story.${extension}`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return extension;
}

export async function shareStoryVideo(blob, platform = "") {
  const extension = blob.type.includes("mp4") ? "mp4" : "webm", file = new File([blob], `ytta-galaksi-story.${extension}`, { type: blob.type });
  if (navigator.share && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: "Galaksi Kenangan · YTTA", text: platform ? `Bagikan Story ini melalui ${platform}` : "Galaksi Kenangan · YTTA" }); return "shared"; }
  downloadStoryVideo(blob); return "downloaded";
}
