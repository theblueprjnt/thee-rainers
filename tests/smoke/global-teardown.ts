import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';

export default async function globalTeardown() {
  let commit = 'unknown';
  try {
    commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {}

  const lastRun = existsSync('tests/smoke/artifacts/last-run.json')
    ? JSON.parse(readFileSync('tests/smoke/artifacts/last-run.json', 'utf8'))
    : {};

  const artifact = {
    commit,
    timestamp: new Date().toISOString(),
    passed: lastRun.stats?.expected ?? 0,
    failed: lastRun.stats?.unexpected ?? 0,
    skipped: lastRun.stats?.skipped ?? 0,
    url: 'https://theerainers.com',
  };

  writeFileSync(`tests/smoke/artifacts/${commit}.json`, JSON.stringify(artifact, null, 2));
  console.log(`\nSmoke artifact written: tests/smoke/artifacts/${commit}.json`);
  console.log(JSON.stringify(artifact, null, 2));
}
