"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { buildScenes } from "./Timeline";

export function useSceneSequencer(active, onFinish) {
  const scenes = useMemo(buildScenes, []);
  const total = scenes.at(-1)?.end ?? 0;
  const timeline = useRef(null);
  const lastIndex = useRef(-1);
  const lastProgressUpdate = useRef(0);
  const [scene, setScene] = useState(scenes[0]);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const clock = { time: 0 };
    timeline.current = gsap.timeline({ paused: true, onComplete: onFinish }).to(clock, {
      time: total, duration: total, ease: "none", onUpdate: () => {
        const time = clock.time;
        const next = scenes.find((item) => time >= item.start && time < item.end) ?? scenes.at(-1);
        if (next.index !== lastIndex.current) { lastIndex.current = next.index; setScene(next); }
        const now = performance.now();
        if (now - lastProgressUpdate.current > 120 || time >= total) {
          lastProgressUpdate.current = now;
          setProgress(time / total);
        }
      },
    });
    return () => timeline.current?.kill();
  }, [scenes, total, onFinish]);

  useEffect(() => {
    if (!active) return;
    timeline.current?.play();
    setPlaying(true);
  }, [active]);

  const toggle = useCallback(() => {
    setPlaying((current) => { current ? timeline.current?.pause() : timeline.current?.play(); return !current; });
  }, []);
  const seek = useCallback((ratio) => timeline.current?.seek(Math.max(0, Math.min(1, ratio)) * total), [total]);
  const skip = useCallback(() => timeline.current?.seek(Math.min(total, scene.end + 0.01)), [scene, total]);
  const replay = useCallback(() => { lastIndex.current = -1; timeline.current?.restart(); setPlaying(true); }, []);

  return { scenes, scene, progress, playing, toggle, seek, skip, replay, total };
}
