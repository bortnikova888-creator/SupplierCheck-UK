````md
# KYS Pack Generator

Web app that generates a “KYS pack”: structured Markdown docs (spec, strategy, architecture, agents) optimized for fast handoff to LLM tooling (Google AI Studio / Claude / Codex).

## Outputs
- `spec.md`
- `strategy.md`
- `architecture.md`
- `agents.md`
- optional: `prompts/` (front-end + handoff bundles)

## Run
```bash
npm install
npm run dev
````

## Build

```bash
npm run build
npm run start
```

## Notes

* Docs are intentionally short, stable-headed, and constraint-heavy to reduce model drift.
* Generated files typically go in `out/` (gitignore it).
