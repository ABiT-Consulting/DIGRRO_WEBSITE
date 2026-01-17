import { spawn } from 'node:child_process';

const userAgent = process.env.npm_config_user_agent || '';
const packageManager = userAgent.split('/')[0] || 'npm';
const npmExecPath = process.env.npm_execpath;
const isWindows = process.platform === 'win32';
const useNodeRunner = Boolean(npmExecPath);
const command = useNodeRunner
  ? process.execPath
  : isWindows && packageManager !== 'bun'
    ? `${packageManager}.cmd`
    : packageManager;
const argsPrefix = useNodeRunner ? [npmExecPath] : [];
const useShell = isWindows && !useNodeRunner;
const spawnOptions = { stdio: 'inherit', shell: useShell };

const scripts = ['dev:client', 'ai:server'];
const children = scripts.map((script) =>
  spawn(command, [...argsPrefix, 'run', script], spawnOptions),
);

let exiting = false;

const exitCodeFromSignal = (signal) => {
  if (signal === 'SIGINT') {
    return 130;
  }
  if (signal === 'SIGTERM') {
    return 143;
  }
  return 1;
};

const shutdown = (signal) => {
  if (exiting) {
    return;
  }
  exiting = true;
  process.exitCode = exitCodeFromSignal(signal);
  for (const child of children) {
    if (child.exitCode === null) {
      child.kill(signal);
    }
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

children.forEach((child) => {
  child.on('error', (error) => {
    if (exiting) {
      return;
    }
    exiting = true;
    console.error('Failed to start dev process:', error);
    for (const other of children) {
      if (other.exitCode === null) {
        other.kill('SIGTERM');
      }
    }
    process.exit(1);
  });
  child.on('exit', (code, signal) => {
    if (exiting) {
      return;
    }
    exiting = true;
    for (const other of children) {
      if (other.exitCode === null) {
        other.kill('SIGTERM');
      }
    }
    if (typeof code === 'number') {
      process.exit(code);
    }
    process.exit(exitCodeFromSignal(signal));
  });
});
