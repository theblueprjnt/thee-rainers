/**
 * YouTube description updater — replaces old URL patterns with theerainers.com equivalents.
 * Uses YouTube Data API v3 via OAuth2 (your Google account that owns the channel).
 *
 * SETUP (one-time):
 *   1. Go to console.cloud.google.com → New project → Enable "YouTube Data API v3"
 *   2. APIs & Services → Credentials → Create OAuth 2.0 Client ID → Desktop app
 *   3. Download the JSON → save as scripts/oauth-client.json
 *   4. npm install googleapis open (run from repo root)
 *   5. node scripts/update-yt-descriptions.mjs --auth   ← first run, opens browser, saves token
 *   6. node scripts/update-yt-descriptions.mjs          ← subsequent runs use saved token
 *
 * WHAT IT DOES:
 *   - Fetches all videos from your channel (handles pagination)
 *   - Replaces old URL patterns in each description (see URL_REPLACEMENTS below)
 *   - Prints a diff preview, then asks you to confirm before writing
 *   - Writes updates in batches (YouTube quota: 1600 units/day; videos.update = 50 units each)
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OAUTH_CLIENT_FILE = path.join(__dirname, 'oauth-client.json');
const TOKEN_FILE        = path.join(__dirname, '.yt-token.json');  // gitignored
const CHANNEL_ID        = 'UCRainersChannelId';  // REPLACE: your channel ID (starts with UC...)

// ── URL replacements ─────────────────────────────────────────────────────────
// Order matters — more specific patterns first.
const URL_REPLACEMENTS = [
  // Old Gumroad links → vault
  { from: /https?:\/\/theerainers\.gumroad\.com\/[^\s)]*/gi, to: 'https://theerainers.com/vault' },
  { from: /https?:\/\/gumroad\.com\/l\/[^\s)]*/gi,           to: 'https://theerainers.com/vault' },

  // Old stepintoring domain → current
  { from: /https?:\/\/stepintoring\.com\/[^\s)]*/gi,         to: 'https://theerainers.com' },
  { from: /stepintoring\.com/gi,                             to: 'theerainers.com' },

  // Old linktree / beacons / similar bio links → /links
  { from: /https?:\/\/linktr\.ee\/[^\s)]*/gi,                to: 'https://theerainers.com/links' },
  { from: /https?:\/\/beacons\.ai\/[^\s)]*/gi,               to: 'https://theerainers.com/links' },

  // Free protocol references → current URL
  { from: /https?:\/\/theerainers\.com\/footwork\b/gi,       to: 'https://theerainers.com/footwork-foundation' },
];
// ─────────────────────────────────────────────────────────────────────────────

function applyReplacements(text) {
  let result = text;
  for (const { from, to } of URL_REPLACEMENTS) {
    result = result.replace(from, to);
  }
  return result;
}

async function getAuthClient() {
  if (!fs.existsSync(OAUTH_CLIENT_FILE)) {
    console.error(`Missing ${OAUTH_CLIENT_FILE}. Download it from Google Cloud Console → Credentials.`);
    process.exit(1);
  }
  const { installed } = JSON.parse(fs.readFileSync(OAUTH_CLIENT_FILE, 'utf8'));
  const client = new google.auth.OAuth2(installed.client_id, installed.client_secret, installed.redirect_uris[0]);

  if (fs.existsSync(TOKEN_FILE)) {
    client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8')));
    return client;
  }

  // First-time auth flow
  const authUrl = client.generateAuthUrl({ access_type: 'offline', scope: ['https://www.googleapis.com/auth/youtube'] });
  console.log('\nOpen this URL in your browser:\n');
  console.log(authUrl);
  console.log('');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise(resolve => rl.question('Paste the code from the redirect URL: ', resolve));
  rl.close();

  const { tokens } = await client.getToken(code.trim());
  client.setCredentials(tokens);
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens));
  console.log('Token saved.\n');
  return client;
}

async function getAllChannelVideos(youtube) {
  const videos = [];
  let pageToken = undefined;

  // Get uploads playlist ID
  const channelRes = await youtube.channels.list({ part: 'contentDetails', id: CHANNEL_ID });
  const uploadsId = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) { console.error('Channel not found. Check CHANNEL_ID.'); process.exit(1); }

  // Page through uploads playlist
  do {
    const res = await youtube.playlistItems.list({
      part: 'contentDetails',
      playlistId: uploadsId,
      maxResults: 50,
      pageToken,
    });
    const ids = res.data.items.map(i => i.contentDetails.videoId);

    // Fetch full snippet (description, title) for this batch
    const details = await youtube.videos.list({ part: 'snippet', id: ids.join(',') });
    videos.push(...details.data.items);
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  return videos;
}

async function main() {
  const dryRun = !process.argv.includes('--write');
  const auth   = await getAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  console.log(`Fetching all videos from channel ${CHANNEL_ID}...`);
  const videos = await getAllChannelVideos(youtube);
  console.log(`Found ${videos.length} videos.\n`);

  const toUpdate = [];

  for (const video of videos) {
    const { id, snippet } = video;
    const original = snippet.description ?? '';
    const updated  = applyReplacements(original);

    if (original !== updated) {
      toUpdate.push({ id, snippet, original, updated });
    }
  }

  if (toUpdate.length === 0) {
    console.log('No descriptions need updating. All clean.');
    return;
  }

  console.log(`${toUpdate.length} video(s) need updates:\n`);
  for (const { id, snippet, original, updated } of toUpdate) {
    console.log(`────────────────────────────────────────`);
    console.log(`Title: ${snippet.title}`);
    console.log(`ID:    ${id}`);
    console.log(`URL:   https://youtu.be/${id}`);

    // Show only changed lines
    const origLines = original.split('\n');
    const updLines  = updated.split('\n');
    origLines.forEach((line, i) => {
      if (line !== updLines[i]) {
        console.log(`  - ${line}`);
        console.log(`  + ${updLines[i]}`);
      }
    });
    console.log('');
  }

  if (dryRun) {
    console.log(`DRY RUN complete. ${toUpdate.length} video(s) would be updated.`);
    console.log(`Re-run with --write to apply changes.`);
    console.log(`Note: Each update costs 50 YouTube API quota units. Daily limit: 10,000 units (200 videos/day).`);
    return;
  }

  // Confirm before writing
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const confirm = await new Promise(resolve => rl.question(`Write changes to ${toUpdate.length} video(s)? (yes/no): `, resolve));
  rl.close();
  if (confirm.trim().toLowerCase() !== 'yes') { console.log('Aborted.'); return; }

  let updated = 0;
  for (const { id, snippet, updated: newDesc } of toUpdate) {
    try {
      await youtube.videos.update({
        part: 'snippet',
        requestBody: { id, snippet: { ...snippet, description: newDesc } },
      });
      console.log(`Updated: ${snippet.title} (${id})`);
      updated++;
    } catch (err) {
      console.error(`Failed: ${id} — ${err.message}`);
    }
  }

  console.log(`\nDone. ${updated}/${toUpdate.length} videos updated.`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
