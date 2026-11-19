// Cover Coast v8 — hand-in for the gta6-cover-art-01 bounty (Node 22, stdlib only).
// The app is this directory's app/ folder: plain static files a desktop browser
// loads offline (app/index.html and its ES modules, no library, no network
// request). This program copies app/ and screenshots/ beside it to /output and
// writes /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. It also sanity-checks the hand-in first: every screenshot
// must exist and fit the scorer's caps, and app/ must fit its own caps, so a
// bad bundle fails loudly here instead of silently at the gate.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const MAX_SCREENSHOT_BYTES = 262144;
const MAX_SCREENSHOTS = 4;
const MAX_APP_FILES = 993;
const MAX_APP_BYTES = 50331648;

function fail(message) {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

function walk(dir) {
  let files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

// --- pre-flight: README carries the three live make.fun badges ---
const readmePath = join(here, 'README.md');
if (!existsSync(readmePath)) fail('README.md is missing');
const readme = readFileSync(readmePath, 'utf8');
const BADGES = [
  'https://make.fun/badge/gta6-cover-art-01.svg',
  'https://make.fun/badge/gta6-cover-art-01/zesty-pika-87/gta6-cover-art-01-v8/rank.svg',
  'https://make.fun/badge/gta6-cover-art-01/zesty-pika-87/gta6-cover-art-01-v8/reward.svg',
];
for (const badge of BADGES) {
  if (!readme.includes(badge)) fail(`README.md is missing badge ${badge}`);
}

// --- pre-flight: screenshots exist and fit the caps ---
const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir)) fail('screenshots/ is missing');
const shots = readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort();
if (shots.length === 0) fail('no screenshots in screenshots/');
if (shots.length > MAX_SCREENSHOTS) fail(`${shots.length} screenshots, max is ${MAX_SCREENSHOTS}`);
for (const shot of shots) {
  const size = statSync(join(shotsDir, shot)).size;
  if (size > MAX_SCREENSHOT_BYTES) fail(`${shot} is ${size} bytes, over the ${MAX_SCREENSHOT_BYTES} cap`);
}

// --- pre-flight: app/ fits its caps ---
const appDir = join(here, 'app');
if (!existsSync(appDir)) fail('app/ is missing');
const appFiles = walk(appDir);
if (appFiles.length > MAX_APP_FILES) fail(`${appFiles.length} files under app/, max is ${MAX_APP_FILES}`);
const appBytes = appFiles.reduce((sum, f) => sum + statSync(f).size, 0);
if (appBytes > MAX_APP_BYTES) fail(`app/ is ${appBytes} bytes, over the ${MAX_APP_BYTES} cap`);
if (!existsSync(join(appDir, 'index.html'))) fail('app/index.html is missing');

mkdirSync(out, { recursive: true });
cpSync(appDir, join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: MAX_SCREENSHOTS, max_bytes: MAX_SCREENSHOT_BYTES },
    app_max_files: MAX_APP_FILES,
    app_max_bytes: MAX_APP_BYTES,
    app_path_max_bytes: 1000,
  }),
);

console.log(`Cover Coast v8: ${appFiles.length} app files (${appBytes} bytes), ${shots.length} screenshots -> ${out}`);
