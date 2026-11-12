# AGENTS.md

This repo holds one skill, `skills/supcoflow/` (`SKILL.md` plus `referencias/`), and the tests that guard it. The skill text is in English; the README and the tests are in Spanish.

## Test

```
npm ci
npm test
```

Keep `npm test` green.

## Fingerprint (huella)

The text the person receives (`SKILL.md` and everything in `referencias/`) is tied to `metadata.version` by a hash. Changing that text without bumping the version leaves a test red.

- `npm run huella` prints the current hash.
- `npm run huella -- --escribir` records it in `test/vectores/huella-de-la-skill.json`. It refuses if the text changed and the version is the one already recorded: bump `metadata.version` in `SKILL.md` first.

## Vectors

`describe-<version>.json`, `guia-de-ejemplo.md` and `motivos-del-motor.json` are copies from other repos (the terminal and the engine). Do not write them by hand; re-sync them from their source when it changes. `motivos-de-la-guia.json` takes its `motivo` fields from the engine copy, but its `queHacer` text is the skill's own: sync the motives, then review that text.

## Terminal version

The skill pins an exact terminal version (`npx -y supcoflow@<version>`). The tests check that every pin in the skill matches the version in `test/vectores/describe-*.json`, and that every command and flag the skill mentions exists there. Moving to a new terminal version means a new describe vector and a new skill version together.
