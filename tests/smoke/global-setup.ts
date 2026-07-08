import { mkdirSync } from 'fs';

export default async function globalSetup() {
  mkdirSync('tests/smoke/artifacts', { recursive: true });
}
