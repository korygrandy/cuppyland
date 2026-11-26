# SFX Validation Skill

## Purpose

Validate Cuppy Land SFX behavior with deterministic, code-driven checks and explicit human checkpoints.

This skill combines:

- static clip/config/file validation
- deterministic unit coverage for dispatch and guard behavior
- browser matrix logic and instrumentation helpers
- edge-case automation

## Commands

Run from [cuppy-land/](/C:/dev/oliviaworld/cuppy-land).

### Static manifest check

```powershell
npm run validate:sfx
```

### Deterministic SFX-focused test matrix

```powershell
npm run validate:sfx:matrix
```

### SFX-change regression gate

```powershell
npm run validate:sfx:changed
```

Runs only when files in `sfx/` changed (use `-- --force` to run unconditionally).

### Full packaged validation

```powershell
npm run validate:sfx:full
```

## What each command validates

### `validate:sfx`

- clip keys in `audioConfig.sfxClips`
- clip file presence on disk
- direct `playSfxClip("...")` references map to configured keys
- world music and intro paths exist
- registry-level validation from `CuppyLandObjectSfxTriggerRegistry`

### `validate:sfx:matrix`

- Tube Slide deterministic dispatch for Barbie and Barbie Baby
- Rabbit/Turtle motion-stop sequencing hooks
- hidden-tab, mute, missing-source, and rejected-playback guard behavior
- SFX event capture wrapping (`play`, `loop`, `stop`, `onEnded`)
- browser matrix runner pass/fail reporting behavior
- Tube Slide edge cases:
  - rapid reentry duplicate prevention
  - temporary overlap-loss retention
  - world-switch interruption cleanup

### `validate:sfx:full`

- static + complete suite validation together

### `validate:sfx:changed`

- detects `sfx/` file additions/changes
- runs `validate:sfx` and `validate:sfx:matrix` when changed
- exits cleanly without running the suite when no `sfx/` change is detected
- used by GitHub Actions workflow `SFX Regression Gate`

## Human-in-the-loop checkpoints

Use this exact gate sequence:

1. **Checkpoint 1 (Static)**
   - run `validate:sfx`
   - confirm no missing/orphaned clips remain
2. **Checkpoint 2 (Unit dispatch)**
   - run `validate:sfx:matrix`
   - confirm deterministic pass/fail behavior
3. **Checkpoint 3 (Instrumentation)**
   - inject capture in live browser
   - confirm recorded event order and callback behavior
4. **Checkpoint 4 (Core browser matrix)**
   - run repeated core actions in live app
   - compare event sequences across runs
5. **Checkpoint 5 (Edge cases)**
   - validate overlap-loss, rapid reentry, world-switch interruption, mute/hidden behavior
6. **Checkpoint 6 (Packaging)**
   - verify command entry points, docs, and CI-friendly exit codes

Do not advance to the next checkpoint without explicit human confirmation.

## Files used by this skill

- [scripts/validate-sfx-static.js](/C:/dev/oliviaworld/cuppy-land/scripts/validate-sfx-static.js)
- [scripts/capture-sfx-events.js](/C:/dev/oliviaworld/cuppy-land/scripts/capture-sfx-events.js)
- [scripts/validate-sfx-browser.js](/C:/dev/oliviaworld/cuppy-land/scripts/validate-sfx-browser.js)
- [tests/sfx-validation.test.js](/C:/dev/oliviaworld/cuppy-land/tests/sfx-validation.test.js)
- [tests/sfx-dispatch-determinism.test.js](/C:/dev/oliviaworld/cuppy-land/tests/sfx-dispatch-determinism.test.js)
- [tests/audio-sfx-guards.test.js](/C:/dev/oliviaworld/cuppy-land/tests/audio-sfx-guards.test.js)
- [tests/sfx-event-capture.test.js](/C:/dev/oliviaworld/cuppy-land/tests/sfx-event-capture.test.js)
- [tests/sfx-browser-matrix.test.js](/C:/dev/oliviaworld/cuppy-land/tests/sfx-browser-matrix.test.js)
- [tests/sfx-edge-cases.test.js](/C:/dev/oliviaworld/cuppy-land/tests/sfx-edge-cases.test.js)

## Determinism rules

- Assert clip keys and event order, not screenshots.
- Prefer ID/state assertions over visual-only checks.
- Reset or isolate capture state between cases.
- Keep retries bounded and explicit.
- Avoid unbounded timers in test assertions.
