# UI Testplay Simulations Skill

## Purpose

Run deterministic gameplay simulations that mimic realistic player behavior and generate human-reviewable artifacts.

This skill provides:

- 100-player simulation runs (configurable)
- event trace generation across triggers/sequences/object interactions
- data-driven risk log extraction
- dashboard artifacts for human-in-the-loop review

## Commands

Run from [cuppy-land/](/C:/dev/oliviaworld/cuppy-land).

### Default simulation (100 players)

```powershell
npm run simulate:ui:testplay
```

### Custom simulation seed/size

```powershell
npm run simulate:ui:testplay -- --players=100 --seed=20261126
```

## Artifacts

- JSON: [simulation-report.json](/C:/dev/oliviaworld/cuppy-land/reports/ui-testplay-simulations/latest/simulation-report.json)
- HTML dashboard: [simulation-dashboard.html](/C:/dev/oliviaworld/cuppy-land/reports/ui-testplay-simulations/latest/simulation-dashboard.html)

## Human checkpoints

1. Confirm simulation size and seed.
2. Review aggregate event counts and failure distribution.
3. Review risk log severities and recommendations.
4. Confirm whether risks are accepted, mitigated, or escalated into deterministic tests.

## Determinism rules

- Same seed and same player count must produce identical JSON summary and traces.
- Risk log ordering is stable by frequency and event id tie-break.
- Artifact schema remains stable for downstream automation.
