import { build } from 'esbuild'
import { spawnSync } from 'node:child_process'
import { unlinkSync } from 'node:fs'
const output = new URL('./.smoke.cjs', import.meta.url)
try {
  await build({ entryPoints: ['checks/smoke.ts'], bundle: true, platform: 'node', format: 'cjs', packages: 'external', tsconfig: 'tsconfig.app.json', outfile: output.pathname, logLevel: 'warning' })
  const result = spawnSync(process.execPath, [output.pathname], { stdio: 'inherit' })
  process.exitCode = result.status ?? 1
} finally { try { unlinkSync(output) } catch {} }
