import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.env.DISABLE_HMR === undefined) {
  process.env.DISABLE_HMR = 'true';
}

const isTsxRunning =
  process.execArgv.some((arg) => arg.includes('tsx')) ||
  process.env.__TSX_RUNNING__ === '1';

if (!isTsxRunning) {
  process.env.__TSX_RUNNING__ = '1';
  const currentFilePath = fileURLToPath(import.meta.url);
  const child = spawn(
    process.execPath,
    ['--import', 'tsx', currentFilePath, ...process.argv.slice(2)],
    {
      stdio: 'inherit',
      env: process.env,
    }
  );

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });

  const forwardSignal = (sig: NodeJS.Signals) => {
    if (child.pid) {
      try {
        process.kill(child.pid, sig);
      } catch {}
    }
  };

  process.on('SIGINT', () => forwardSignal('SIGINT'));
  process.on('SIGTERM', () => forwardSignal('SIGTERM'));
} else {
  // Dynamically import application server when tsx resolution is active
  const { startServer } = await import('./server/serverApp');
  startServer().catch((err: unknown) => {
    console.error('[ShopPOS Server] Fatal server startup error:', err);
    process.exit(1);
  });
}
