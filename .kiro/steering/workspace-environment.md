---
inclusion: always
---

# Workspace environment

- The canonical working copy is the Ubuntu workspace at `/home/mani/projects/Poultry-Intelligence-Hub`.
- The current shell prompt and repository path describe this Linux workspace. Do not assume the user is working from a separate Windows checkout.
- Before claiming that files are inaccessible, inspect the current workspace with repository tools (`pwd`, `git status`, file search, or file reads).
- Do not suggest SSH, copying the repository, or cloning it to Windows unless the user explicitly says the active Kiro session is running on Windows or asks for remote access.
- When a user pastes a shell prompt or a previous assistant response, treat it as context to verify, not as proof that the current session runs on another machine.
- For this repository, use `AGENTS.md`, `PROJECT_STRUCTURE.md`, and `README.md` as the primary project guidance. The web app is under `apps/web/`, the API under `apps/api/`, the mobile app under `apps/mobile/`, and the worker under `apps/worker/`.
- If an error is reported without its command, stack trace, or relevant file, ask for that missing diagnostic context instead of concluding that the repository cannot be reached.
