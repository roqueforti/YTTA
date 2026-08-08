import { photos } from "@/data/photos";

export const OPENING_DURATION = 7;
export const TITLE_DURATION = 3.2;
export const ENDING_DURATION = 9;

export function buildChapters() {
  const grouped = new Map();
  [...photos].sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order).forEach((photo) => {
    if (!grouped.has(photo.event)) grouped.set(photo.event, { title: photo.event, date: photo.date, dateLabel: photo.dateLabel, photos: [] });
    grouped.get(photo.event).photos.push(photo);
  });
  return [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildScenes() {
  const chapters = buildChapters();
  const photoCount = chapters.reduce((sum, chapter) => sum + chapter.photos.length, 0);
  const fixedTime = OPENING_DURATION + ENDING_DURATION + chapters.length * (TITLE_DURATION + 0.8);
  const photoDuration = Math.max(1.25, Math.min(2.1, (238 - fixedTime) / photoCount));
  const scenes = [{ type: "opening", duration: OPENING_DURATION }];
  chapters.forEach((chapter, chapterIndex) => {
    scenes.push({ type: "chapter", chapter, duration: TITLE_DURATION });
    chapter.photos.forEach((photo, photoIndex) => {
      const impactful = photoIndex === Math.floor(chapter.photos.length / 2);
      scenes.push({
        type: "photo", photo, chapter, photoIndex, chapterIndex,
        impactful, duration: photoDuration + (impactful ? 0.8 : 0),
      });
    });
  });
  scenes.push({ type: "ending", duration: ENDING_DURATION });
  let cursor = 0;
  return scenes.map((scene, index) => {
    const result = { ...scene, index, start: cursor, end: cursor + scene.duration };
    cursor = result.end;
    return result;
  });
}
