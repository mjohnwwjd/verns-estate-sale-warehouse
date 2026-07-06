#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env.lightspeed.local');
const tokenPath = path.join(root, 'tmp', 'lightspeed-token.json');

const env = { ...parseEnv(path.join(root, '.env.lightspeed.example')), ...parseEnv(envPath), ...process.env };

for (const key of ['LIGHTSPEED_CLIENT_ID', 'LIGHTSPEED_CLIENT_SECRET']) {
  if (!env[key]) fail(`Missing ${key} in .env.lightspeed.local`);
}

if (!fs.existsSync(tokenPath)) fail(`Missing ${tokenPath}. Run scripts/lightspeed-exchange-code.mjs first.`);

const currentToken = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
if (!currentToken.refresh_token) fail('Missing refresh token. Re-authorize Lightspeed first.');

const tokenUrl = env.LIGHTSPEED_TOKEN_URL || 'https://cloud.lightspeedapp.com/auth/oauth/token';
const body = new URLSearchParams({
  client_id: env.LIGHTSPEED_CLIENT_ID,
  client_secret: env.LIGHTSPEED_CLIENT_SECRET,
  refresh_token: currentToken.refresh_token,
  grant_type: 'refresh_token',
});

const response = await fetch(tokenUrl, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body,
});

const text = await response.text();
if (!response.ok) {
  fail(`Token refresh failed ${response.status} ${response.statusText}: ${text}`);
}

let refreshed;
try {
  refreshed = JSON.parse(text);
} catch {
  fail(`Token refresh response was not JSON: ${text}`);
}

const nextToken = {
  ...currentToken,
  ...refreshed,
  refresh_token: refreshed.refresh_token || currentToken.refresh_token,
  createdAt: new Date().toISOString(),
};

fs.writeFileSync(tokenPath, JSON.stringify(nextToken, null, 2), { mode: 0o600 });
console.log(JSON.stringify({
  ok: true,
  saved: true,
  hasAccessToken: Boolean(nextToken.access_token),
  hasRefreshToken: Boolean(nextToken.refresh_token),
  expiresIn: nextToken.expires_in || null,
}, null, 2));

function parseEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const idx = line.indexOf('=');
        return idx === -1 ? [line, ''] : [line.slice(0, idx), line.slice(idx + 1)];
      }),
  );
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
