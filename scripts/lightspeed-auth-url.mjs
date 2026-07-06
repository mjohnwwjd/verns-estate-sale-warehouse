#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env.lightspeed.local');

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
const clientId = env.LIGHTSPEED_CLIENT_ID;
const redirectUri = env.LIGHTSPEED_REDIRECT_URI || 'https://estatesbyvern.com/lightspeed/callback';
const scope = env.LIGHTSPEED_SCOPE || 'employee:inventory_read';
const authUrl = env.LIGHTSPEED_AUTH_URL || 'https://cloud.lightspeedapp.com/oauth/authorize.php';

if (!clientId) {
  console.error('Missing LIGHTSPEED_CLIENT_ID. Register the API client, then copy .env.lightspeed.example to .env.lightspeed.local and fill it in.');
  process.exit(1);
}

const state = crypto.randomBytes(16).toString('hex');
const url = new URL(authUrl);
url.searchParams.set('response_type', 'code');
url.searchParams.set('client_id', clientId);
url.searchParams.set('redirect_uri', redirectUri);
url.searchParams.set('scope', scope);
url.searchParams.set('state', state);

console.log('Open this URL while logged into Lightspeed:');
console.log(url.toString());
console.log('');
console.log('State value to verify after redirect:');
console.log(state);
