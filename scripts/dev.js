import { spawn } from 'node:child_process';

const userAgent = process.env.npm_config_user_agent || '';
const packageManager = userAgent.split('/')[0] || 'npm';
const command =
  process.platform === 'win32' ? `${packageManager}.cmd` : packageManager;

const scripts = ['dev:client', 'ai:server'];
const children = scripts.map((script) =>
  spawn(command, ['run', script], { stdio: 'inherit' }),
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
