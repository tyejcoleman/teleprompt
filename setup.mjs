#!/usr/bin/env node
// One-command setup for agents and people. No dependencies; runs before `npm ci`.
//
//   node setup.mjs                                   check, install, start the app, open Chrome
//   node setup.mjs --script <file>                   ...and load <file> as the user's script
//   node setup.mjs --script <file> --cued <cued>     verify cues added to <file>, then load <cued>
//   node setup.mjs --check                           only check requirements; change nothing
//   node setup.mjs --no-open                         do not open Chrome
//   node setup.mjs --stop                            stop the background app
//
// Output lines start with OK:, FAIL:, or NEXT:. Exit code 0 means ready.
import { spawn, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const root = dirname(fileURLToPath(import.meta.url))
const url = 'http://127.0.0.1:5173/'
const stateDir = join(root, '.local')
const pidFile = join(stateDir, 'server.pid')
const logFile = join(stateDir, 'server.log')
const scriptTarget = join(root, 'public', 'local', 'script.txt')
const MAX_SCRIPT_BYTES = 500_000

const args = process.argv.slice(2)
const flag = name => args.includes(name)
const value = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }
const expand = path => resolve(process.cwd(), path.replace(/^~(?=$|\/)/, os.homedir()))
const ok = message => console.log(`OK: ${message}`)
const next = message => console.log(`NEXT: ${message}`)
const fail = message => { console.log(`FAIL: ${message}`); process.exit(1) }

async function serving() {
  try { return (await (await fetch(url, { signal: AbortSignal.timeout(1500) })).text()).includes('Voice Follow') } catch { return false }
}
function portFree() {
  const probe = spawnSync(process.execPath, ['-e', 'const s=require("node:net").createServer();s.once("error",()=>process.exit(1));s.listen(5173,"127.0.0.1",()=>s.close())'])
  return probe.status === 0
}

if (flag('--stop')) {
  try { process.kill(-Number(readFileSync(pidFile, 'utf8')), 'SIGTERM'); rmSync(pidFile); ok('Stopped the teleprompter app.') }
  catch { ok('No background app was running from setup.mjs.') }
  process.exit(0)
}

// 1. Requirements
const [major, minor] = process.versions.node.split('.').map(Number)
if (major < 22 || (major === 22 && minor < 12)) fail(`Node ${process.versions.node} is too old. Install Node.js 22 LTS or newer (https://nodejs.org or \`brew install node@22\`), then rerun.`)
ok(`Node ${process.versions.node}`)
const chrome = process.platform === 'darwin'
  ? ['/Applications/Google Chrome.app', join(os.homedir(), 'Applications/Google Chrome.app')].some(existsSync)
  : true
if (!chrome) fail('Google Chrome is not installed. Voice tracking needs desktop Chrome: https://www.google.com/chrome/ then rerun.')
ok(process.platform === 'darwin' ? 'Google Chrome is installed' : 'Not macOS: open the app in desktop Google Chrome')

// 2. Script (validated before anything is changed)
const scriptPath = value('--script'), cuedPath = value('--cued')
if (cuedPath && !scriptPath) fail('--cued needs --script <original> so spoken words can be compared.')
let source
if (scriptPath) {
  source = expand(cuedPath ?? scriptPath)
  for (const path of [expand(scriptPath), source]) {
    if (!existsSync(path)) fail(`No file at ${path}. Ask the user for the script's exact location.`)
    if (statSync(path).size > MAX_SCRIPT_BYTES) fail(`${path} is larger than ${MAX_SCRIPT_BYTES} bytes. Use a plain .txt script.`)
    const text = readFileSync(path, 'utf8')
    if (!text.trim()) fail(`${path} is empty.`)
    if (text.includes('\u0000')) fail(`${path} is not plain text. Export it as a UTF-8 .txt file first (for .docx: \`textutil -convert txt <file>\` on macOS).`)
  }
  if (cuedPath) {
    const check = spawnSync(process.execPath, [join(root, 'checks', 'cues.mjs'), expand(scriptPath), source], { encoding: 'utf8' })
    process.stdout.write(check.stdout.replace(/^PASS:/gm, 'OK: cues'))
    if (check.status !== 0) fail(`Cue check failed:\n${check.stderr.trim().replace(/^FAIL: /gm, "  ")}\nFix the cued file; spoken words must match the original exactly.`)
  }
}
if (flag('--check')) { ok('Requirements met. Nothing was changed (--check).'); process.exit(0) }

// 3. Install
const installed = existsSync(join(root, 'node_modules', '.package-lock.json')) && statSync(join(root, 'node_modules', '.package-lock.json')).mtimeMs >= statSync(join(root, 'package-lock.json')).mtimeMs
if (!installed) {
  const install = spawnSync('npm', ['ci', '--no-audit', '--no-fund'], { cwd: root, stdio: 'inherit' })
  if (install.status !== 0) fail('npm ci failed. See the messages above.')
}
ok('Dependencies installed')

// 4. Load the script into the app's drop-in slot (gitignored)
if (source) {
  mkdirSync(dirname(scriptTarget), { recursive: true })
  copyFileSync(source, scriptTarget)
  ok(`Script ready: ${source} (the app loads it on open; your original file is unchanged)`)
}

// 5. Start the app in the background, or reuse the running one
if (await serving()) ok(`App already running at ${url}`)
else {
  if (!portFree()) fail('Port 5173 is used by another program. Stop it, then rerun.')
  mkdirSync(stateDir, { recursive: true })
  const log = openSync(logFile, 'a')
  const server = spawn('npm', ['run', 'dev'], { cwd: root, detached: true, stdio: ['ignore', log, log] })
  server.unref()
  writeFileSync(pidFile, String(server.pid))
  let ready = false
  for (let i = 0; i < 60 && !ready; i++) { await new Promise(r => setTimeout(r, 250)); ready = await serving() }
  if (!ready) fail(`App did not start. Log: ${logFile}`)
  ok(`App running at ${url} (background; stop with: node setup.mjs --stop)`)
}

// 6. Open Chrome
if (!flag('--no-open') && process.platform === 'darwin') {
  spawnSync('open', ['-a', 'Google Chrome', url])
  ok('Opened in Google Chrome')
}
if (flag('--no-open') || process.platform !== 'darwin') next(`Open ${url} in desktop Google Chrome.`)
next('In Chrome: click Start listening and allow the microphone. If an existing script is open, click "Load it" on the prompt.')
next('Press F for full screen. Space pauses. Esc exits full screen. Record in your own app (QuickTime, OBS).')
