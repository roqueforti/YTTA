"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const soundRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => soundRef.current?.unload(), []);

  const start = useCallback(async () => {
    if (!soundRef.current) {
      const { Howl } = await import("howler");
      soundRef.current = new Howl({
        src: [`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/audio/ambient.mp3`],
        html5: true,
        loop: true,
        preload: true,
        volume: 0,
      });
    }
    const sound = soundRef.current;
    if (!sound.playing()) sound.play();
    sound.mute(muted);
    sound.fade(sound.volume(), 0.48, 1800);
    setPlaying(true);
  }, [muted]);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      soundRef.current?.mute(next);
      return next;
    });
  }, []);

  return <AudioContext.Provider value={{ muted, playing, start, toggleMute }}>{children}</AudioContext.Provider>;
}

export const useAudio = () => useContext(AudioContext);
