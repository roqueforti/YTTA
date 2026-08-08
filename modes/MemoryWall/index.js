"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { photos } from "@/data/photos";

export default function MemoryWall({ active }) {
  const displayPhotos = useMemo(() => shufflePhotos(photos), []);
  const railRef = useRef(null);
  const cardRefs = useRef([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [spotlight, setSpotlight] = useState(null);
  const [loaded, setLoaded] = useState(0);
  const [autoOpen, setAutoOpen] = useState(true);
  const spotlightBag = useRef([]);
  const lastSpotlight = useRef(null);

  useEffect(() => {
    if (!active) return;
    const reveal = setInterval(() => setVisibleCount((count) => Math.min(displayPhotos.length, count + 10)), 700);
    return () => clearInterval(reveal);
  }, [active, displayPhotos.length]);

  useEffect(() => {
    if (!active || visibleCount < displayPhotos.length || !autoOpen) return;
    const cycle = setInterval(() => {
      const next = takeFromShuffleBag(spotlightBag.current, displayPhotos.length, lastSpotlight.current);
      lastSpotlight.current = next;
      cardRefs.current[next]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "center" });
      setSpotlight(next);
    }, 7800);
    return () => clearInterval(cycle);
  }, [active, visibleCount, autoOpen, displayPhotos.length]);

  const selectSpotlight = (index) => {
    if (!spotlightBag.current.length) spotlightBag.current.push(...shufflePhotos(Array.from({ length: displayPhotos.length }, (_, item) => item)));
    spotlightBag.current = spotlightBag.current.filter((item) => item !== index);
    lastSpotlight.current = index;
    setSpotlight(index);
  };

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
  const selected = spotlight == null ? null : displayPhotos[spotlight];

  return (
    <section className={`wall-mode ${selected ? "has-spotlight" : ""}`}>
      <div className="warm-light" /><Dust />
      <div className="wall-rail" ref={railRef}>
        <div className="memory-thread" />
        {displayPhotos.slice(0, visibleCount).map((photo, index) => {
          const lane = index % 3, depth = index % 4, tilt = ((index * 17) % 11) - 5;
          return (
            <button
              key={photo.image}
              ref={(node) => { cardRefs.current[index] = node; }}
              className="polaroid"
              style={{ "--lane": lane, "--depth": depth, "--tilt": `${tilt}deg`, "--delay": `${-(index % 13) * 0.37}s` }}
              onClick={() => selectSpotlight(index)}
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

function shufflePhotos(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled;
}

function takeFromShuffleBag(bag, count, previous) {
  if (!bag.length) {
    bag.push(...shufflePhotos(Array.from({ length: count }, (_, index) => index)));
    if (count > 1 && bag.at(-1) === previous) [bag[0], bag[bag.length - 1]] = [bag.at(-1), bag[0]];
  }
  return bag.pop();
}

function Dust() {
  return <div className="dust" aria-hidden="true">{Array.from({ length: 28 }, (_, index) => <i key={index} style={{ "--x": `${(index * 37) % 100}%`, "--y": `${(index * 61) % 100}%`, "--d": `${8 + index % 9}s` }} />)}</div>;
}
