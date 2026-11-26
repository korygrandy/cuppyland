# Test Manager Skill

## Purpose

Coordinate and govern validation across SFX, gameplay-event, and simulation infrastructure through each feature/bug cycle.

This skill:

- scopes validation from changed files
- runs selected validation suites
- integrates simulation risk output
- writes consolidated manager reports for checkpoint review

## Commands

Run from [cuppy-land/](/C:/dev/oliviaworld/cuppy-land).

### Build plan and generate reports (no command execution)

```powershell
npm run test-manager:plan
```

### Execute managed cycle

```powershell
npm run test-manager:run
```

### Execute with custom simulation profile

```powershell
npm run test-manager:run -- --players=100 --seed=20261126
```

## Artifacts

- JSON: [manager-report.json](/C:/dev/oliviaworld/cuppy-land/reports/test-manager/latest/manager-report.json)
- HTML dashboard: [manager-dashboard.html](/C:/dev/oliviaworld/cuppy-land/reports/test-manager/latest/manager-dashboard.html)

## Human checkpoints

1. Confirm scoped command plan from changed files.
2. Confirm command pass/fail outcomes.
3. Review simulation risk log merged into manager report.
4. Confirm next-cycle actions (add tests, refine gates, or accept risk).

## Cycle policy

- Use `validate:*:changed` gates for scoped PR checks.
- Use `test-manager:run` for release/branch quality sweeps.
- Preserve report artifacts for cross-cycle trend review.
