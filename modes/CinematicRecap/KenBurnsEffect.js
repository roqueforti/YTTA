"use client";

export default function KenBurnsEffect({ photo, direction = 0, duration = 3 }) {
  const variants = ["push-in", "pull-out", "pan-left", "pan-right", "drift-up", "drift-diagonal"];
  return (
    <figure key={photo.image} className={`cinematic-image ${variants[direction % variants.length]}`} style={{ "--scene-duration": `${duration + 0.8}s` }}>
      <img src={photo.image} alt={photo.quote} draggable="false" />
      <i className="cinematic-light-leak" />
    </figure>
  );
}
