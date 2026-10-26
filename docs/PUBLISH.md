# Share tuned changes on GitHub

Project: https://github.com/tyejcoleman/teleprompt

Use the existing checkout and `origin` remote. After tuning, review the files to make sure the project does not contain personal scripts, audio, video, or credentials. Preserve the MIT license and upstream attribution.

```bash
git status --short
# Stage only the source/configuration changes you intend to share.
git add src/config.ts src/theme.css
# Adapt that file list to your actual changes.
git diff --cached
npm test
npm run build
git commit -m "Tune teleprompter reading experience"
git push origin main
```

Use the user's authorized branch/PR workflow if they prefer one. Do not force-push over existing history. If authentication is needed, use the Mac's normal GitHub credentials or GitHub CLI login; do not put tokens in source files or remote URLs.

## Starting from an extracted ZIP

The source ZIP does not include `.git`. Prefer cloning the existing GitHub repository and copying the intended tuned source changes into that checkout. Review the diff before committing; do not overwrite unrelated changes or personal script files. The setup prompt is `START_HERE.md`; the next person's agent can start with `docs/AGENT_HANDOFF.md`.
