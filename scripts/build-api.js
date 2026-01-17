import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

await esbuild.build({
  entryPoints: [path.join(rootDir, 'api/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: path.join(rootDir, 'api/index.mjs'),
  external: [
    // Keep these as external (they'll be installed by Vercel)
    'express',
    'express-session',
    'connect-pg-simple',
    'pg',
    'drizzle-orm',
    'drizzle-orm/pg-core',
    'drizzle-orm/node-postgres',
    'drizzle-zod',
    'zod',
    'crypto',
    'stream',
    'pdfkit',
    'fluent-ffmpeg',
    'openai',
    'multer',
    '@vercel/node'
  ],
  alias: {
    '@shared': path.join(rootDir, 'shared'),
    '@': path.join(rootDir, 'client/src'),
  },
  define: {
    'import.meta.dirname': '__dirname',
  },
  banner: {
    js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`
  }
});

console.log('API bundle built successfully!');
