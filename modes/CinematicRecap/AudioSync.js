"use client";

import { useEffect } from "react";
import { useAudio } from "@/shared/AudioManager";

export function useAudioSync(scene, playing) {
  const { fadeTo } = useAudio();
  useEffect(() => {
    if (!playing) return;
    fadeTo(scene?.impactful ? 0.27 : 0.48, 650);
  }, [scene?.index, scene?.impactful, playing, fadeTo]);
}
