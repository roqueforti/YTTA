"use client";

export default function KenBurnsEffect({ photo, direction = 0 }) {
  const variants = ["push-in", "pull-out", "pan-left", "pan-right"];
  return (
    <figure key={photo.image} className={`cinematic-image ${variants[direction % variants.length]}`}>
      <img src={photo.image} alt={photo.quote} draggable="false" />
    </figure>
  );
}
