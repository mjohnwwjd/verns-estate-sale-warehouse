#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const root = process.cwd();
const configPath = path.resolve(root, process.env.ESTATE_WORKFLOW_CONFIG || 'data/estate-sales-workflow.json');
const statePath = path.resolve(root, process.env.ESTATE_MONITOR_STATE || 'tmp/estate-sales-monitor-state.json');
const reportRoot = path.resolve(root, process.env.ESTATE_MONITOR_OUTPUT || 'output/estate-sales-monitor');
const latestDir = path.join(reportRoot, 'latest');
const timestampDir = path.join(reportRoot, timestampSlug());

const workflow = loadWorkflow();
const previous = readJson(statePath, {});
const report = {
  checkedAt: new Date().toISOString(),
  saleStatus: workflow.saleStatus,
  saleId: workflow.saleId || estateSalesNumericIdFromUrl(workflow.saleWizardUrl) || estateSalesNumericIdFromUrl(workflow.liveSaleUrl),
  lightspeedCategoryCode: workflow.lightspeedCategoryCode,
  saleWizardUrl: workflow.saleWizardUrl,
  liveSaleUrl: workflow.liveSaleUrl,
  checks: {},
  alerts: []
};

if (!workflow.lightspeedCategoryCode) report.alerts.push('Lightspeed category code is missing.');
if (!workflow.saleWizardUrl && workflow.saleStatus !== 'live') report.alerts.push('Not-live sale-wizard URL is missing.');
if (workflow.saleStatus === 'live' && !workflow.liveSaleUrl) report.alerts.push('Sale is marked live, but live public URL is missing.');

if (workflow.liveSaleUrl) {
  report.checks.livePublicUrl = await checkUrl(workflow.liveSaleUrl);
  if (workflow.saleStatus !== 'live' && report.checks.livePublicUrl.ok) {
    report.alerts.push('Public EstateSales.NET URL appears live. Update the workflow status to Live / published.');
  }
}

if (workflow.saleWizardUrl) {
  report.checks.saleWizardUrl = await checkUrl(workflow.saleWizardUrl);
  if (!report.checks.saleWizardUrl.ok) {
    report.alerts.push(`Sale-wizard URL did not respond cleanly (${report.checks.saleWizardUrl.status || 'no status'}).`);
  }
}

if (workflow.lightspeedCategoryCode) {
  report.checks.lightspeed = runLightspeedStage(workflow);
  const itemCount = Number(report.checks.lightspeed.itemCount || 0);
  const previousCount = Number(previous?.checks?.lightspeed?.itemCount || 0);
  if (Number.isFinite(previousCount) && itemCount > previousCount) {
    report.alerts.push(`${itemCount - previousCount} new Lightspeed item${itemCount - previousCount === 1 ? '' : 's'} ready for EstateSales.NET review.`);
  }
  if (itemCount === 0) {
    report.alerts.push('No qualifying Lightspeed items found for this category. Check category code, quantity, price, and pictures.');
  }
}

report.checks.estateSalesPostedCount = {
  status: 'manual',
  message: 'Exact EstateSales.NET posted-photo count needs an approved API or logged-in browser automation. Compare the generated review count with the sale picture manager before publishing.'
};

writeReport(report);
notifyIfNeeded(report);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.alerts.length ? 2 : 0;

function loadWorkflow() {
  const fromFile = readJson(configPath, null);
  const fromStarter = fromFile || workflowFromStarterData() || {};
  return normalizeWorkflow({
    ...fromStarter,
    lightspeedCategoryCode: process.env.LIGHTSPEED_CATEGORY_CODE || fromStarter.lightspeedCategoryCode,
    saleWizardUrl: process.env.ESTATESALES_SALE_WIZARD_URL || fromStarter.saleWizardUrl,
    liveSaleUrl: process.env.ESTATESALES_LIVE_URL || fromStarter.liveSaleUrl,
    saleStatus: process.env.ESTATESALES_SALE_STATUS || fromStarter.saleStatus
  });
}

function workflowFromStarterData() {
  const file = path.join(root, 'assets/js/site-data.js');
  if (!fs.existsSync(file)) return null;
  const source = fs.readFileSync(file, 'utf8');
  const match = source.match(/estateSalesWorkflow:\s*(\{[\s\S]*?\n\s{4}\})/);
  if (!match) return null;
  try {
    return Function(`return (${match[1]});`)();
  } catch {
    return null;
  }
}

function normalizeWorkflow(raw = {}) {
  const saleWizardUrl = String(raw.saleWizardUrl || (isSaleWizardPicturesUrl(raw.estateSalesUrl) ? raw.estateSalesUrl : '') || '').trim();
  const liveSaleUrl = String(raw.liveSaleUrl || (raw.estateSalesUrl && !isSaleWizardPicturesUrl(raw.estateSalesUrl) ? raw.estateSalesUrl : '') || '').trim();
  const saleStatus = raw.saleStatus === 'live' ? 'live' : 'not-live';
  const saleId = String(raw.saleId || estateSalesNumericIdFromUrl(saleWizardUrl) || estateSalesNumericIdFromUrl(liveSaleUrl) || '').trim();
  const lightspeedCategoryCode = String(raw.lightspeedCategoryCode || '').trim().toUpperCase();
  return {
    saleStatus,
    saleId,
    lightspeedCategoryCode,
    saleWizardUrl,
    liveSaleUrl,
    outputSlug: raw.outputSlug || safeSlug(`${saleId || 'current-sale'}-${lightspeedCategoryCode || 'category'}`)
  };
}

async function checkUrl(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: { 'user-agent': 'VernsEstateSaleMonitor/1.0' }
    });
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: response.url
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message
    };
  }
}

function runLightspeedStage(workflow) {
  const outDir = path.join(timestampDir, 'lightspeed-stage');
  const args = [
    'scripts/lightspeed-stage-estatesales.mjs',
    '--category-code', workflow.lightspeedCategoryCode,
    '--min-qoh', '1',
    '--require-price',
    '--require-images',
    '--skip-images',
    '--limit', process.env.ESTATE_MONITOR_LIMIT || '1000',
    '--clean',
    '--out', outDir
  ];

  try {
    const raw = execFileSync(process.execPath, args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const parsed = JSON.parse(raw);
    return {
      ok: true,
      itemCount: parsed.itemCount,
      imageCount: parsed.imageCount,
      reviewUrl: parsed.htmlPath,
      manifestPath: path.join(outDir, 'manifest.json'),
      outDir
    };
  } catch (error) {
    return {
      ok: false,
      itemCount: 0,
      imageCount: 0,
      error: error.stderr?.toString().trim() || error.message,
      outDir
    };
  }
}

function writeReport(report) {
  fs.mkdirSync(timestampDir, { recursive: true });
  fs.mkdirSync(latestDir, { recursive: true });
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(path.join(timestampDir, 'estate-sales-monitor-report.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(timestampDir, 'estate-sales-monitor-report.md'), toMarkdown(report));
  fs.writeFileSync(path.join(latestDir, 'estate-sales-monitor-report.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(latestDir, 'estate-sales-monitor-report.md'), toMarkdown(report));
  fs.writeFileSync(statePath, JSON.stringify(report, null, 2));
}

function toMarkdown(report) {
  return [
    '# EstateSales.NET Monitor Report',
    '',
    `- Checked: ${report.checkedAt}`,
    `- Sale ID: ${report.saleId || 'not set'}`,
    `- Status: ${report.saleStatus}`,
    `- Lightspeed category: ${report.lightspeedCategoryCode || 'not set'}`,
    `- Lightspeed ready items: ${report.checks.lightspeed?.itemCount ?? 'not checked'}`,
    `- Sale wizard: ${statusLine(report.checks.saleWizardUrl)}`,
    `- Live URL: ${report.liveSaleUrl ? statusLine(report.checks.livePublicUrl) : 'not set'}`,
    '',
    '## Alerts',
    '',
    ...(report.alerts.length ? report.alerts.map((item) => `- ${item}`) : ['- No alerts.']),
    '',
    '## EstateSales.NET Count',
    '',
    `- ${report.checks.estateSalesPostedCount.message}`,
    ''
  ].join('\n');
}

function statusLine(value) {
  if (!value) return 'not checked';
  return `${value.ok ? 'OK' : 'Needs attention'}${value.status ? ` (${value.status})` : ''}`;
}

function notifyIfNeeded(report) {
  if (!report.alerts.length || process.env.ESTATE_MONITOR_NOTIFY === 'off') return;
  if (process.platform !== 'darwin') return;
  const title = 'Vern Estate Sale Monitor';
  const message = report.alerts.slice(0, 2).join(' ');
  spawnSync('osascript', ['-e', `display notification ${JSON.stringify(message)} with title ${JSON.stringify(title)}`], {
    stdio: 'ignore'
  });
}

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function estateSalesNumericIdFromUrl(value) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts.findLast((part) => /^\d{5,}$/.test(part)) || '';
  } catch {
    return '';
  }
}

function isSaleWizardPicturesUrl(value) {
  try {
    const url = new URL(value);
    return /\/account\/sale-wizard\/pictures\/\d+/i.test(url.pathname);
  } catch {
    return false;
  }
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function safeSlug(value) {
  return String(value || 'estate-sale')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'estate-sale';
}
