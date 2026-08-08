import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'none'; upgrade-insecure-requests";
const securityMeta = `<meta http-equiv="Content-Security-Policy" content="${policy}"><meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), display-capture=()"><meta name="referrer" content="no-referrer">`;

async function visit(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return visit(path);
    if (!entry.name.endsWith(".html")) return;
    const html = await readFile(path, "utf8");
    if (html.includes('http-equiv="Content-Security-Policy"')) return;
    await writeFile(path, html.replace("<head>", `<head>${securityMeta}`));
  }));
}

await visit(fileURLToPath(new URL("../out", import.meta.url)));
