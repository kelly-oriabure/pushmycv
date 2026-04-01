const { spawnSync } = require('child_process');

const nextBin = require.resolve('next/dist/bin/next');

const result = spawnSync(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  env: { ...process.env, NEXT_DISABLE_TURBOPACK: '1' },
});

if (result.error) {
  console.error(result.error);
}

process.exit(typeof result.status === 'number' ? result.status : 1);
