"use client";

import { useEffect } from "react";

export default function SecurityGuard() {
  useEffect(() => {
    const protect = () => document.documentElement.classList.add("privacy-obscured");
    const reveal = () => document.documentElement.classList.remove("privacy-obscured");
    const visibility = () => document.hidden ? protect() : reveal();
    const contextMenu = (event) => event.preventDefault();
    const dragStart = (event) => { if (event.target instanceof HTMLImageElement) event.preventDefault(); };
    const keyboard = (event) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && ["s", "u", "p"].includes(key)) event.preventDefault();
      if (event.key === "PrintScreen") {
        event.preventDefault();
        protect();
        window.setTimeout(reveal, 900);
      }
    };
    document.addEventListener("contextmenu", contextMenu);
    document.addEventListener("dragstart", dragStart);
    document.addEventListener("keydown", keyboard);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", protect);
    window.addEventListener("focus", reveal);
    return () => {
      document.removeEventListener("contextmenu", contextMenu);
      document.removeEventListener("dragstart", dragStart);
      document.removeEventListener("keydown", keyboard);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", protect);
      window.removeEventListener("focus", reveal);
      reveal();
    };
  }, []);

  return <div className="privacy-shield" aria-hidden="true"><span>YTTA</span><small>CONTENT PROTECTED</small></div>;
}
