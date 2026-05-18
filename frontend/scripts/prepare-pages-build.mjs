import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(currentDir, '..');
const buildDir = join(frontendDir, 'build');
const pagesDir = resolve(frontendDir, '..', 'pages-deploy');
const excludedFiles = new Set([
  'salsamixlive-android.tar.gz',
  'salsamixlive-code.tar.gz',
]);

await rm(pagesDir, { recursive: true, force: true });
await mkdir(pagesDir, { recursive: true });

await cp(buildDir, pagesDir, {
  recursive: true,
  filter: (source) => !excludedFiles.has(source.split(/[\\/]/).pop()),
});

console.log('Prepared Cloudflare Pages assets in ../pages-deploy');
