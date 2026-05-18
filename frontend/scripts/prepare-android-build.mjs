import { rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(currentDir, '..');
const buildDir = join(frontendDir, 'build');
const excludedFiles = [
  'salsamixlive-android.tar.gz',
  'salsamixlive-code.tar.gz',
];

await Promise.all(
  excludedFiles.map((fileName) => rm(join(buildDir, fileName), { force: true })),
);

console.log('Removed non-app archives from Android web assets');
