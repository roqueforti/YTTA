"use client";
import { useMemo, useState } from "react";

export function autoCurate(photos, count = 6) {
  const featured = photos.filter((photo) => photo.featured);
  const source = featured.length >= 4 ? featured : [...photos].sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
  const length = Math.min(count, source.length);
  return Array.from({ length }, (_, index) => source[Math.round(index * (source.length - 1) / Math.max(1, length - 1))]);
}

export function randomCurate(photos, count) {
  const pool = [...photos];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

export default function PhotoSelector({ photos, selected, onChange }) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const selectedKeys = useMemo(() => new Set(selected.map((photo) => photo.image)), [selected]);
  const toggle = (photo) => {
    if (selectedKeys.has(photo.image)) onChange(selected.filter((item) => item.image !== photo.image));
    else if (selected.length < 8) onChange([...selected, photo]);
  };
  const move = (index, direction) => { const next = [...selected], target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; onChange(next); };
  return <div className="story-picker"><div className="story-picker-head"><span>FOTO STORY</span><small>{selected.length}/8 TERPILIH</small><button onClick={() => onChange(autoCurate(photos))}>PILIH OTOMATIS</button></div><div className="story-template-picker"><div><span>MAU BERAPA FOTO?</span><small>Langsung dipilih acak</small></div>{[4, 5, 6, 8].map((count) => <button key={count} className={selected.length === count ? "active" : ""} onClick={() => onChange(randomCurate(photos, count))}><b>{count}</b><small>FOTO</small></button>)}</div><div className="story-selection-toolbar"><span>URUTAN FOTO</span><button onClick={() => onChange(randomCurate(photos, Math.max(4, selected.length)))}>↻ Acak Ulang {Math.max(4, selected.length)} Foto</button></div><div className="story-selected">{selected.map((photo, index) => <figure key={photo.image}><img src={photo.thumbnail} alt={photo.event} /><figcaption>{index + 1}</figcaption><button className="remove-photo" onClick={() => toggle(photo)} aria-label="Hapus foto">×</button><div><button onClick={() => move(index, -1)} disabled={!index}>←</button><button onClick={() => move(index, 1)} disabled={index === selected.length - 1}>→</button></div></figure>)}</div><button className="manual-picker-toggle" onClick={() => setLibraryOpen((open) => !open)}>{libraryOpen ? "Selesai Memilih" : "+ Pilih Foto Manual"}</button>{libraryOpen && <div className="story-library">{photos.map((photo) => <button key={photo.image} className={selectedKeys.has(photo.image) ? "selected" : ""} onClick={() => toggle(photo)}><img src={photo.thumbnail} alt={photo.event} /><i>{selectedKeys.has(photo.image) ? "✓" : "+"}</i></button>)}</div>}</div>;
}
