import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const serverRoot = path.join(workspaceRoot, 'academy-server');
const distRoot = path.join(workspaceRoot, 'dist');

async function main() {
  await mkdir(path.join(distRoot, 'academy', 'api'), { recursive: true });
  await mkdir(path.join(distRoot, 'academy-data'), { recursive: true });

  await cp(path.join(serverRoot, 'api'), path.join(distRoot, 'academy', 'api'), {
    recursive: true,
    force: true
  });

  await cp(path.join(serverRoot, 'academy-data'), path.join(distRoot, 'academy-data'), {
    recursive: true,
    force: true
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
