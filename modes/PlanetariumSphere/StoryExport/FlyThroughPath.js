import * as THREE from "three";

export const STORY_DURATION = 24;

export function buildStoryLayout(count) {
  const photos = Array.from({ length: count }, (_, index) => {
    const angle = index * .72 - .65;
    return new THREE.Vector3(Math.sin(angle) * 3.2, Math.cos(angle * .8) * 1.25, -7 - index * 7.5);
  });
  const cameraPoints = [new THREE.Vector3(0, 0, 1.5), ...photos.map((position, index) => position.clone().add(new THREE.Vector3(index % 2 ? -.45 : .45, .08, 5.2)))];
  return { photos, curve: new THREE.CatmullRomCurve3(cameraPoints, false, "catmullrom", .42) };
}
