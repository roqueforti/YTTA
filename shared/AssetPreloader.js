import { photos } from "@/data/photos";

const audioFiles = ["ambient.mp3", "ambient 2.mp3", "ambient 3.mp3"];
let preparationPromise = null;
let completed = 0;
let total = 0;
const listeners = new Set();

function report() {
  const snapshot = { completed, total, progress: total ? completed / total : 0 };
  listeners.forEach((listener) => listener(snapshot));
}

function preloadImage(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = image.onerror = resolve;
    image.src = url;
  });
}

async function runQueue(tasks, concurrency = 8) {
  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const task = tasks[cursor++];
      await task();
      completed += 1;
      report();
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
}

export function prepareExperienceAssets(onProgress) {
  if (onProgress) {
    listeners.add(onProgress);
    onProgress({ completed, total, progress: total ? completed / total : 0 });
  }
  if (!preparationPromise) {
    const imageUrls = [...new Set(photos.flatMap((photo) => [photo.thumbnail, photo.image]))];
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const tasks = [
      ...imageUrls.map((url) => () => preloadImage(url)),
      ...audioFiles.map((file) => () => fetch(`${basePath}/audio/${file}`).then((response) => {
        if (!response.ok) throw new Error(`Failed to preload ${file}`);
        return response.blob();
      }).catch(() => undefined)),
    ];
    total = tasks.length;
    report();
    preparationPromise = runQueue(tasks);
  }
  return preparationPromise;
}

export function unsubscribeAssetProgress(listener) {
  listeners.delete(listener);
}
