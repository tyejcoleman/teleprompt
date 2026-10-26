# Publish the source to GitHub

The initial development connection could not create a new GitHub repository: GitHub returned `CreateRepository` permission denied. The downloadable source bundle is complete, but a repository URL is not proof that a repository exists.

You can tune locally from the ZIP before publishing. Your Mac agent can use your locally authenticated GitHub account, or you can create an empty public repository at https://github.com/new and give its URL to the agent. Preserve the MIT license and upstream attribution.

## From an extracted source ZIP

After tuning, review the files to make sure the project does not contain personal scripts, audio, video, or credentials. The ZIP does not include the original `.git` directory.

```bash
git init -b main
git add .
git status --short
# Review the staged files before committing.
git commit -m "Add voice-follow teleprompter"
```

If Git requires your author identity, configure the identity you want on the repository. Do not copy an agent's identity without reviewing it.

With GitHub CLI installed and authenticated on the Mac:

```bash
gh auth status
gh repo create voice-follow-teleprompter --public --source . --remote origin --push
```

If an empty GitHub repository already exists instead:

```bash
git remote add origin https://github.com/YOUR-USERNAME/voice-follow-teleprompter.git
git push -u origin main
```

Use your actual repository URL. Do not force-push over an existing project's history. If a remote or existing repository is already configured, inspect and reuse it safely.

The README/setup prompt currently uses `tyejcoleman/voice-follow-teleprompter` as the intended destination; update those links if you choose a different account or name. After publishing, verify the repository URL and the Check workflow, then share `START_HERE.md` or `docs/AGENT_HANDOFF.md` with the next agent.
