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
];

export default function ModeSelector({ onSelect }) {
  return (
    <main className="mode-selector">
      <div className="selector-grain" />
      <header className="selector-header"><span>YTTA</span><small>THE MEMORY ARCHIVE</small></header>
      <section className="selector-intro">
        <span className="eyebrow">CHOOSE YOUR JOURNEY</span>
        <h1>Dua cara untuk<br /><em>mengingat kembali.</em></h1>
        <p>Pilih bagaimana kamu ingin menyusuri cerita kita.</p>
      </section>
      <section className="mode-grid">
        {modes.map((mode) => (
          <button key={mode.id} className={`mode-card ${mode.id}`} onClick={() => onSelect(mode.id)}>
            <span className="mode-number">{mode.number}</span>
            <div className="mode-preview" aria-hidden="true">
              {mode.id === "galaxy" ? <GalaxyPreview /> : <WallPreview />}
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
