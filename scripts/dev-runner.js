const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

function run(name, command, cwd) {
  const child = spawn(command, {
    cwd,
    shell: true,
    stdio: 'inherit'
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    } else {
      console.log(`[${name}] exited`);
    }
  });

  return child;
}

function runNpmScript(name, script, cwd) {
  return run(name, `npm run ${script}`, cwd);
}

const backend = runNpmScript(
  'backend',
  'start',
  path.join(root, 'backend')
);

const frontend = runNpmScript(
  'frontend',
  'start',
  path.join(root, 'frontend')
);

function shutdown() {
  if (!backend.killed) backend.kill();
  if (!frontend.killed) frontend.kill();
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});
