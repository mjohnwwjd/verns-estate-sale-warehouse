#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env.lightspeed.local');
const outPath = path.join(root, 'tmp', 'lightspeed-token.json');

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

const env = { ...parseEnv(path.join(root, '.env.lightspeed.example')), ...parseEnv(envPath), ...process.env };
const redirectOrCode = process.argv[2];

if (!redirectOrCode) {
  console.error('Usage: node scripts/lightspeed-exchange-code.mjs "<redirect URL or code>"');
  process.exit(1);
}

const code = redirectOrCode.startsWith('http')
  ? new URL(redirectOrCode).searchParams.get('code')
  : redirectOrCode;

if (!code) {
  console.error('No OAuth code found.');
  process.exit(1);
}

for (const key of ['LIGHTSPEED_CLIENT_ID', 'LIGHTSPEED_CLIENT_SECRET', 'LIGHTSPEED_REDIRECT_URI']) {
  if (!env[key]) {
    console.error(`Missing ${key} in .env.lightspeed.local`);
    process.exit(1);
  }
}

const body = new URLSearchParams({
  client_id: env.LIGHTSPEED_CLIENT_ID,
  client_secret: env.LIGHTSPEED_CLIENT_SECRET,
  code,
  grant_type: 'authorization_code',
});

if (env.LIGHTSPEED_TOKEN_INCLUDE_REDIRECT_URI === 'true') {
  body.set('redirect_uri', env.LIGHTSPEED_REDIRECT_URI);
}

const tokenUrl = env.LIGHTSPEED_TOKEN_URL || 'https://cloud.merchantos.com/oauth/access_token.php';
const response = await fetch(tokenUrl, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body,
});

const text = await response.text();
if (!response.ok) {
  console.error(`Token exchange failed: ${response.status} ${response.statusText}`);
  console.error(text);
  process.exit(1);
}

let token;
try {
  token = JSON.parse(text);
} catch {
  console.error('Token response was not JSON:');
  console.error(text);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ createdAt: new Date().toISOString(), ...token }, null, 2));

console.log(`Saved token response to ${outPath}`);
console.log('Do not commit or share that file.');
