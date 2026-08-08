import * as THREE from "three";

export const STORY_DURATION = 24;

export function buildStoryLayout(count) {
  const photos = Array.from({ length: count }, (_, index) => {
    const side = index % 2 ? 1 : -1;
    return new THREE.Vector3(side * (1.05 + index % 3 * .18), Math.sin(index * 1.1) * .62, -10 - index * 13);
  });
  const views = photos.map((position, index) => position.clone().add(new THREE.Vector3(index % 2 ? -.18 : .18, .04, 9.2)));
  return { photos, views };
}
