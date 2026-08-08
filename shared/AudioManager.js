"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const AudioContext = createContext(null);
const TRACKS = ["ambient.mp3", "ambient 2.mp3", "ambient 3.mp3"];

export function AudioProvider({ children }) {
  const soundRef = useRef(null);
  const soundsRef = useRef([]);
  const trackIndexRef = useRef(0);
  const mutedRef = useRef(false);
  const targetVolumeRef = useRef(0.48);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => {
    soundsRef.current.forEach((sound) => sound.unload());
    soundsRef.current = [];
  }, []);

  const start = useCallback(async () => {
    if (!soundsRef.current.length) {
      const { Howl } = await import("howler");
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      soundsRef.current = TRACKS.map((filename, index) => new Howl({
        src: [`${basePath}/audio/${filename}`],
        html5: true,
        loop: false,
        preload: true,
        volume: index === 0 ? 0 : targetVolumeRef.current,
        onend: () => {
          const nextIndex = (index + 1) % TRACKS.length;
          const nextSound = soundsRef.current[nextIndex];
          if (!nextSound) return;
          trackIndexRef.current = nextIndex;
          soundRef.current = nextSound;
          nextSound.stop();
          nextSound.mute(mutedRef.current);
          nextSound.volume(targetVolumeRef.current);
          nextSound.play();
          setPlaying(true);
        },
      }));
      soundRef.current = soundsRef.current[0];
    }
    const sound = soundRef.current;
    if (!sound.playing()) sound.play();
    sound.mute(mutedRef.current);
    targetVolumeRef.current = 0.48;
    sound.fade(sound.volume(), targetVolumeRef.current, 1800);
    setPlaying(true);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      mutedRef.current = next;
      soundsRef.current.forEach((sound) => sound.mute(next));
      return next;
    });
  }, []);

  const fadeTo = useCallback((volume, duration = 700) => {
    targetVolumeRef.current = volume;
    const sound = soundRef.current;
    if (sound) sound.fade(sound.volume(), volume, duration);
  }, []);

  const pause = useCallback(() => { soundRef.current?.pause(); setPlaying(false); }, []);
  const resume = useCallback(() => { soundRef.current?.play(); setPlaying(true); }, []);
  const seekAudio = useCallback((seconds = 0) => soundRef.current?.seek(seconds), []);

  return <AudioContext.Provider value={{ muted, playing, start, toggleMute, fadeTo, pause, resume, seekAudio }}>{children}</AudioContext.Provider>;
}

export const useAudio = () => useContext(AudioContext);
