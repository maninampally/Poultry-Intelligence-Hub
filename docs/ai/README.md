# AI tool files

This repo keeps **human docs** under `docs/` and **agent/tool config** in the
locations tools actually discover.

## Canonical files

| File / folder | Role | Who reads it |
|---------------|------|--------------|
| [`AGENTS.md`](../../AGENTS.md) (repo root) | Product rules, stack, hard constraints, working style | Cursor, Codex, other agents that look for `AGENTS.md` |
| [`.cursor/rules/`](../../.cursor/rules/) | Cursor project rules (always-on product + workspace) | Cursor |
| [`.kiro/`](../../.kiro/) | Kiro steering + feature specs | Kiro |
| [`docs/`](../README.md) | Architecture, engineering, ops, product docs | Humans + agents (via links from `AGENTS.md`) |

## Rules of thumb

1. Put long-form design/engineering writing in `docs/<category>/`, not at repo root.
2. Keep `AGENTS.md` at the **repository root** so tools find it without path config.
3. Put Cursor-specific always-apply guidance in `.cursor/rules/*.mdc`.
4. Keep Kiro specs under `.kiro/specs/` and steering under `.kiro/steering/`.
5. Prefer linking to docs from `AGENTS.md` instead of duplicating large documents.

## Related docs

- [Project structure](../getting-started/PROJECT_STRUCTURE.md)
- [System design](../architecture/SYSTEM_DESIGN.md)
