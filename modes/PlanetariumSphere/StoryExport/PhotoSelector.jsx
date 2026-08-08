"use client";
import { useMemo } from "react";

export function autoCurate(photos, count = 6) {
  const featured = photos.filter((photo) => photo.featured);
  const source = featured.length >= 4 ? featured : [...photos].sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
  const length = Math.min(count, source.length);
  return Array.from({ length }, (_, index) => source[Math.round(index * (source.length - 1) / Math.max(1, length - 1))]);
}

export default function PhotoSelector({ photos, selected, onChange }) {
  const selectedKeys = useMemo(() => new Set(selected.map((photo) => photo.image)), [selected]);
  const toggle = (photo) => {
    if (selectedKeys.has(photo.image)) onChange(selected.filter((item) => item.image !== photo.image));
    else if (selected.length < 8) onChange([...selected, photo]);
  };
  const move = (index, direction) => { const next = [...selected], target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; onChange(next); };
  return <div className="story-picker"><div className="story-picker-head"><span>PILIH 4–8 FOTO</span><small>{selected.length}/8 TERPILIH</small><button onClick={() => onChange(autoCurate(photos))}>AUTO CURATE</button></div><div className="story-selected">{selected.map((photo, index) => <figure key={photo.image}><img src={photo.thumbnail} alt={photo.event} /><figcaption>{index + 1}</figcaption><div><button onClick={() => move(index, -1)} disabled={!index}>←</button><button onClick={() => move(index, 1)} disabled={index === selected.length - 1}>→</button></div></figure>)}</div><div className="story-library">{photos.map((photo) => <button key={photo.image} className={selectedKeys.has(photo.image) ? "selected" : ""} onClick={() => toggle(photo)}><img src={photo.thumbnail} alt={photo.event} /><i>{selectedKeys.has(photo.image) ? "✓" : "+"}</i></button>)}</div></div>;
}
