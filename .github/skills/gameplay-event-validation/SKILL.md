# Gameplay Event Validation Skill

## Purpose

Validate trigger-driven gameplay behavior with deterministic evidence and explicit human checkpoints.

This skill covers:

- hitbox event activation
- sequence lifecycle and interruption behavior
- object-to-object interaction triggers
- object-state transitions that gate event eligibility
- canvas-edge and boundary behavior
- deterministic browser event traces

## Commands

Run from [cuppy-land/](/C:/dev/oliviaworld/cuppy-land).

### Static trigger and anchor validation

```powershell
npm run validate:events
```

### Deterministic gameplay-event matrix

```powershell
npm run validate:events:matrix
```

### Change-aware gameplay-event gate

```powershell
npm run validate:events:changed
```

Runs only when trigger-related files changed (use `-- --force` to run unconditionally).

### Full gameplay-event validation

```powershell
npm run validate:events:full
```

## What each command validates

### `validate:events`

- trigger manifest integrity
- world anchor hitbox geometry sanity
- trigger asset path presence
- required coverage file presence for edge and overlap behavior

### `validate:events:matrix`

- trigger manifest test coverage
- Tube Slide trigger wiring
- overlap helpers and edge drag behavior
- object drop and direct interaction coverage
- deterministic gameplay event capture and matrix runner checks

### `validate:events:changed`

- detects gameplay-trigger-related path changes
- runs `validate:events` and `validate:events:matrix` when relevant files changed
- skips cleanly when no relevant files changed
- used by GitHub Actions workflow `Gameplay Event Regression Gate`

### `validate:events:full`

- static validation + full repository test suite

## Human-in-the-loop checkpoints

Use this gate sequence:

1. **Checkpoint 1 (Static)**
   - run `validate:events`
   - confirm trigger manifest and anchor geometry checks
2. **Checkpoint 2 (Unit dispatch and state)**
   - run `validate:events:matrix`
   - confirm deterministic event start/step/complete/cancel behavior
3. **Checkpoint 3 (Instrumentation)**
   - inject gameplay event capture in live browser
   - confirm event trace and callback order
4. **Checkpoint 4 (Core matrix)**
   - execute repeated trigger flows in live app
   - compare normalized traces across runs
5. **Checkpoint 5 (Edge and interruption)**
   - validate canvas-edge clamp, temporary overlap loss, rapid reentry, and world-switch interruption
6. **Checkpoint 6 (Packaging and gate)**
   - verify command wiring, docs, and CI path-triggered enforcement

## Files used by this skill

- [scripts/validate-events-static.js](/C:/dev/oliviaworld/cuppy-land/scripts/validate-events-static.js)
- [scripts/capture-gameplay-events.js](/C:/dev/oliviaworld/cuppy-land/scripts/capture-gameplay-events.js)
- [scripts/validate-events-browser.js](/C:/dev/oliviaworld/cuppy-land/scripts/validate-events-browser.js)
- [scripts/validate-events-changed.js](/C:/dev/oliviaworld/cuppy-land/scripts/validate-events-changed.js)
- [tests/gameplay-event-validation.test.js](/C:/dev/oliviaworld/cuppy-land/tests/gameplay-event-validation.test.js)
- [tests/gameplay-event-capture.test.js](/C:/dev/oliviaworld/cuppy-land/tests/gameplay-event-capture.test.js)
- [tests/gameplay-event-browser-matrix.test.js](/C:/dev/oliviaworld/cuppy-land/tests/gameplay-event-browser-matrix.test.js)
- [tests/gameplay-event-edge-coverage.test.js](/C:/dev/oliviaworld/cuppy-land/tests/gameplay-event-edge-coverage.test.js)

## Determinism rules

- Assert event IDs and ordered lifecycle traces, not visuals.
- Reset capture state between matrix cases.
- Keep waits bounded and explicit.
- Assert edge and overlap behavior through state transitions.
- Verify interruption cleanup leaves no active event artifacts.
