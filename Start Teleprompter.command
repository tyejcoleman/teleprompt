#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  echo "Install Node.js 22 LTS or newer, then run this launcher again. See README.md."
  exit 1
fi
node -e 'const [major,minor]=process.versions.node.split(".").map(Number); if(major<22 || (major===22 && minor<12)){console.error("Node.js 22.12 or newer is required.");process.exit(1)}'
if [[ ! -f node_modules/.package-lock.json || package-lock.json -nt node_modules/.package-lock.json ]]; then
  npm ci
fi
node -e 'const net=require("node:net");const s=net.createServer();s.once("error",()=>{console.error("Port 5173 is already in use. Reuse the existing app terminal or stop it before launching again.");process.exit(1)});s.listen(5173,"127.0.0.1",()=>s.close())'
npm run dev &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT INT TERM
ready=false
for ((i=0; i<40; i++)); do
  if ! kill -0 "$server_pid" 2>/dev/null; then wait "$server_pid"; exit 1; fi
  if curl --silent --fail http://localhost:5173/ >/dev/null; then ready=true; break; fi
  sleep 0.25
done
if [[ "$ready" != true ]]; then echo "Server did not become ready. Review the messages above."; exit 1; fi
if [[ "$(uname -s)" == Darwin ]]; then
  open -a 'Google Chrome' http://localhost:5173/ || echo "Open http://localhost:5173/ in Google Chrome."
fi
echo "Teleprompter ready at http://localhost:5173/. Keep this terminal open. Press Control-C to stop."
wait "$server_pid"
