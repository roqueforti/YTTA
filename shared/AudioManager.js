"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Howl } from "howler";

const AudioContext = createContext(null);
const TRACKS = [
  { file: "ambient.mp3", title: "Memori Baik", artist: "Sheila On 7" },
  { file: "ambient 2.mp3", title: "Bergema Sampai Selamanya", artist: "Nadhif Basalamah" },
  { file: "ambient 3.mp3", title: "Tujuh Belas", artist: "Tulus" },
];

export function AudioProvider({ children }) {
  const soundRef = useRef(null);
  const soundsRef = useRef([]);
  const trackIndexRef = useRef(0);
  const mutedRef = useRef(false);
  const targetVolumeRef = useRef(0.48);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);

  useEffect(() => () => {
    soundsRef.current.forEach((sound) => sound.unload());
    soundsRef.current = [];
  }, []);

  const start = useCallback(async () => {
    if (!soundsRef.current.length) {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      soundsRef.current = TRACKS.map((track, index) => new Howl({
        src: [`${basePath}/audio/${track.file}`],
        html5: true,
        loop: false,
        preload: true,
        volume: index === 0 ? 0 : targetVolumeRef.current,
        onend: () => {
          const nextIndex = (index + 1) % TRACKS.length;
          const nextSound = soundsRef.current[nextIndex];
          if (!nextSound) return;
          trackIndexRef.current = nextIndex;
          setCurrentTrack(nextIndex);
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
  const getAudioCaptureStream = useCallback(() => {
    const node = soundRef.current?._sounds?.[0]?._node;
    return node?.captureStream?.() ?? node?.mozCaptureStream?.() ?? null;
  }, []);

  const selectTrack = useCallback((index) => {
    const nextSound = soundsRef.current[index];
    if (!nextSound || index === trackIndexRef.current) return;
    soundsRef.current.forEach((sound) => sound.stop());
    trackIndexRef.current = index;
    soundRef.current = nextSound;
    nextSound.mute(mutedRef.current);
    nextSound.volume(targetVolumeRef.current);
    nextSound.play();
    setCurrentTrack(index);
    setPlaying(true);
  }, []);

  const stop = useCallback(() => {
    soundsRef.current.forEach((sound) => sound.stop());
    trackIndexRef.current = 0;
    soundRef.current = soundsRef.current[0] ?? null;
    targetVolumeRef.current = 0.48;
    setCurrentTrack(0);
    setPlaying(false);
  }, []);

  return <AudioContext.Provider value={{ muted, playing, currentTrack, tracks: TRACKS, start, stop, selectTrack, toggleMute, fadeTo, pause, resume, seekAudio, getAudioCaptureStream }}>{children}</AudioContext.Provider>;
}

export const useAudio = () => useContext(AudioContext);
