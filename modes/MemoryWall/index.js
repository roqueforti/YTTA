"use client";

import { useEffect, useRef, useState } from "react";
import { photos } from "@/data/photos";

export default function MemoryWall({ active }) {
  const railRef = useRef(null);
  const cardRefs = useRef([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [spotlight, setSpotlight] = useState(null);
  const [loaded, setLoaded] = useState(0);
  const [autoOpen, setAutoOpen] = useState(true);

  useEffect(() => {
    if (!active) return;
    const reveal = setInterval(() => setVisibleCount((count) => Math.min(photos.length, count + 10)), 700);
    return () => clearInterval(reveal);
  }, [active]);

  useEffect(() => {
    if (!active || !visibleCount || !autoOpen) return;
    const cycle = setInterval(() => {
      setSpotlight((current) => {
        const next = current == null ? Math.floor(Math.random() * visibleCount) : (current + 1) % visibleCount;
        cardRefs.current[next]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "center" });
        return next;
      });
    }, 7800);
    return () => clearInterval(cycle);
  }, [active, visibleCount, autoOpen]);

  useEffect(() => {
    const rail = railRef.current;
    if (!active || !rail) return;
    const wheel = (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      rail.scrollLeft += event.deltaY;
    };
    rail.addEventListener("wheel", wheel, { passive: false });
    return () => rail.removeEventListener("wheel", wheel);
  }, [active]);

  const closeSpotlight = () => setSpotlight(null);
  const selected = spotlight == null ? null : photos[spotlight];

  return (
    <section className={`wall-mode ${selected ? "has-spotlight" : ""}`}>
      <div className="warm-light" /><Dust />
      <div className="wall-rail" ref={railRef}>
        <div className="memory-thread" />
        {photos.slice(0, visibleCount).map((photo, index) => {
          const lane = index % 3, depth = index % 4, tilt = ((index * 17) % 11) - 5;
          return (
            <button
              key={photo.image}
              ref={(node) => { cardRefs.current[index] = node; }}
              className="polaroid"
              style={{ "--lane": lane, "--depth": depth, "--tilt": `${tilt}deg`, "--delay": `${-(index % 13) * 0.37}s` }}
              onClick={() => setSpotlight(index)}
            >
              <i className="pin" /><img src={photo.thumbnail} alt={photo.title} loading={index < 12 ? "eager" : "lazy"} onLoad={() => setLoaded((value) => value + 1)} /><span>{photo.title}</span>
            </button>
          );
        })}
      </div>
      {active && loaded < visibleCount && <div className="asset-progress warm"><span style={{ width: `${Math.round(loaded / visibleCount * 100)}%` }} /></div>}
      {active && (
        <button
          className={`auto-spotlight-toggle ${autoOpen ? "on" : ""}`}
          onClick={() => setAutoOpen((current) => !current)}
          aria-pressed={autoOpen}
          title={autoOpen ? "Spotlight terbuka otomatis" : "Klik polaroid untuk membuka spotlight"}
        >
          <i /> <span>{autoOpen ? "AUTO" : "MANUAL"}</span>
        </button>
      )}
      {selected && (
        <div className="polaroid-focus" onClick={closeSpotlight}>
          <article onClick={(event) => event.stopPropagation()} key={selected.image}>
            <img src={selected.thumbnail} alt={selected.title} />
            <blockquote>{selected.quote}</blockquote>
            <small>{selected.title} · {String(spotlight + 1).padStart(2, "0")}</small>
            <button onClick={closeSpotlight}>×</button>
          </article>
        </div>
      )}
      {active && <div className="mode-instruction wall-hint">↔ &nbsp; SWIPE UNTUK MENYUSURI · KLIK POLAROID</div>}
    </section>
  );
}

function Dust() {
  return <div className="dust" aria-hidden="true">{Array.from({ length: 28 }, (_, index) => <i key={index} style={{ "--x": `${(index * 37) % 100}%`, "--y": `${(index * 61) % 100}%`, "--d": `${8 + index % 9}s` }} />)}</div>;
}
