# Agent instructions

Repo-specific conventions for AI agents working in `setup-evolve`. These layer on top of any machine-global agent
instructions.

## Always run `npm run pr` when committing

Before creating any commit, run `npm run pr` and ensure it passes. Do not commit if it fails — fix the reported issues
and re-run until clean.

`npm run pr` is the full pre-commit gate (see `package.json`):

```sh
npm run check:fix   # biome check --write + markdownlint --fix (auto-formats and lints)
npm run format      # prettier --write on Markdown
npm run all         # biome check + markdownlint, tsc --noEmit, vitest run, rollup build
```

This auto-formats the tree, type-checks, runs the test suite, and rebuilds `dist/`. Because `check:fix` and `format` may
modify files, stage any resulting changes before committing so the commit reflects the formatted, built state.

The rebuilt `dist/` matters: this Action ships its bundled output, and CI enforces that the committed `dist/` reproduces
from `src/`. Running `npm run pr` keeps `dist/` in lockstep with `src/` so that gate stays green.
