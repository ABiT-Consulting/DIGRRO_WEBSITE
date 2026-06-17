import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

function parseEnvContent(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((values, line) => {
      const delimiterIndex = line.indexOf('=');
      if (delimiterIndex === -1) {
        return values;
      }

      const key = line.slice(0, delimiterIndex).trim();
      let value = line.slice(delimiterIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      values[key] = value;
      return values;
    }, {});
}

function loadLocalEnv() {
  return ['.env', '.env.local'].reduce((values, fileName) => {
    const filePath = path.join(workspaceRoot, fileName);
    if (!existsSync(filePath)) {
      return values;
    }

    return {
      ...values,
      ...parseEnvContent(readFileSync(filePath, 'utf8')),
    };
  }, {});
}

function frontendDefaults(env) {
  const configuredUrl = env.FRONTEND_URL || env.ACADEMY_BASE_URL || '';
  const fallbackPort = env.VITE_DEV_PORT || '5176';
  const configuredHost = env.VITE_DEV_HOST || env.DEV_HOST || '';
  if (configuredHost) {
    return { host: configuredHost, port: fallbackPort };
  }

  if (!configuredUrl) {
    return { host: '127.0.0.1', port: fallbackPort };
  }

  try {
    const url = new URL(configuredUrl);
    if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
      return { host: '127.0.0.1', port: url.port || fallbackPort };
    }

    return {
      host: url.hostname || '127.0.0.1',
      port: url.port || fallbackPort,
    };
  } catch (error) {
    return { host: '127.0.0.1', port: fallbackPort };
  }
}

const localEnv = loadLocalEnv();
const env = { ...localEnv, ...process.env };
if (!env.FRONTEND_URL && env.ACADEMY_BASE_URL) {
  env.FRONTEND_URL = env.ACADEMY_BASE_URL;
}
if (!env.ACADEMY_ENV) {
  env.ACADEMY_ENV = 'development';
}
const viteBin = path.join(
  workspaceRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'vite.cmd' : 'vite',
);
const { host, port } = frontendDefaults(env);
const viteArgs = [
  '--config',
  'vite.academy.config.js',
  '--host',
  host,
  '--port',
  port,
  ...process.argv.slice(2),
];

const children = [];

if (env.ACADEMY_START_LEGACY_API === '1') {
  children.push(spawn(process.execPath, ['server.cjs'], {
    cwd: workspaceRoot,
    env,
    stdio: 'inherit',
  }));
}

children.push(spawn(viteBin, viteArgs, {
  cwd: workspaceRoot,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
}));

let isShuttingDown = false;

function shutdown(exitCode = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exit(exitCode);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => shutdown(0));
}

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      shutdown(code ?? (signal ? 1 : 0));
    }
  });
}
