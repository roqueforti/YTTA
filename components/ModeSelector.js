"use client";

const modes = [
  {
    id: "galaxy",
    number: "01",
    title: "Galaksi Kenangan",
    subtitle: "Planetarium Sphere",
    description: "Melayang di pusat semesta kecil yang dibangun dari potongan waktu kita.",
  },
  {
    id: "wall",
    number: "02",
    title: "Lorong Kenangan",
    subtitle: "Polaroid Memory Wall",
    description: "Menyusuri dinding hangat berisi foto, catatan, dan cerita yang pernah tinggal.",
  },
  {
    id: "cinematic",
    number: "03",
    title: "Cinematic Recap",
    subtitle: "A Guided Memory Film",
    description: "Menonton perjalanan kenangan secara kronologis, seperti sebuah film dokumenter pendek.",
  },
];

const people = [
  ["adristhi.webp", "Adristhi"],
  ["hilman.webp", "Hilman"],
  ["wiesye.webp", "Wiesye"],
  ["doni.webp", "Doni"],
  ["salwa.webp", "Salwa"],
  ["marsha.webp", "Marsha"],
];

export default function ModeSelector({ onSelect }) {
  return (
    <main className="mode-selector">
      <div className="selector-grain" />
      <header className="selector-header"><span>YTTA</span><small>THE MEMORY ARCHIVE</small></header>
      <section className="selector-intro">
        <span className="eyebrow">CHOOSE YOUR JOURNEY</span>
        <h1>Tiga cara untuk<br /><em>mengingat kembali.</em></h1>
        <p>Pilih bagaimana kamu ingin menyusuri cerita kita.</p>
        <p className="device-note">Untuk experience terbaik, gunakan iPad/tablet atau laptop/komputer.</p>
      </section>
      <section className="archive-cast" aria-label="Orang-orang dalam arsip kenangan">
        <small>THE PEOPLE IN THESE MEMORIES</small>
        <div className="portrait-reel">
          {people.map(([file, name], index) => (
            <figure key={file} style={{ "--portrait-index": index }}>
              <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/img/individual/${file}`} alt={name} />
              <figcaption>{name}</figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section className="mode-grid">
        {modes.map((mode) => (
          <button key={mode.id} className={`mode-card ${mode.id}`} onClick={() => onSelect(mode.id)}>
            <span className="mode-number">{mode.number}</span>
            <div className="mode-preview" aria-hidden="true">
              {mode.id === "galaxy" ? <GalaxyPreview /> : mode.id === "wall" ? <WallPreview /> : <CinematicPreview />}
            </div>
            <div className="mode-copy"><small>{mode.subtitle}</small><h2>{mode.title}</h2><p>{mode.description}</p></div>
            <i className="mode-arrow">↗</i>
          </button>
        ))}
      </section>
      <footer className="selector-footer">A COLLECTION OF US · 2022—2025</footer>
    </main>
  );
}

function GalaxyPreview() {
  return <div className="galaxy-preview"><span /><span /><span /><span /><div className="orbit-ring" /></div>;
}

function WallPreview() {
  return <div className="wall-preview"><span /><span /><span /><i /><b /></div>;
}

function CinematicPreview() {
  return <div className="cinematic-preview"><div className="clapper"><i /><i /><i /></div><span>YTTA</span><small>A MEMORY FILM</small></div>;
}
