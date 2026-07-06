#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const baseDir = path.join(root, 'output', 'lightspeed-estatesales');

if (!fs.existsSync(baseDir)) {
  console.error(`No Lightspeed staging output found at ${baseDir}`);
  console.error('Run: npm run lightspeed:stage -- --limit 25');
  process.exit(1);
}

const latest = fs.readdirSync(baseDir)
  .map((name) => path.join(baseDir, name))
  .filter((entryPath) => fs.statSync(entryPath).isDirectory())
  .map((entryPath) => ({ entryPath, mtimeMs: fs.statSync(entryPath).mtimeMs }))
  .sort((a, b) => b.mtimeMs - a.mtimeMs)[0];

if (!latest) {
  console.error(`No Lightspeed staging folders found at ${baseDir}`);
  process.exit(1);
}

const htmlPath = path.join(latest.entryPath, 'lightspeed-estatesales-review.html');
const checklistPath = path.join(latest.entryPath, 'estate-sales-upload-checklist.md');
const uploadDir = path.join(latest.entryPath, 'upload-by-category');
const relativeHtml = path.relative(root, htmlPath).split(path.sep).map(encodeURIComponent).join('/');

console.log(JSON.stringify({
  latestDir: latest.entryPath,
  reviewHtml: htmlPath,
  uploadChecklist: checklistPath,
  uploadByCategoryDir: uploadDir,
  localReviewUrlIfServingRepoOn8090: `http://127.0.0.1:8090/${relativeHtml}`,
}, null, 2));
