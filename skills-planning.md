# Skills Planning: UI Testplay Simulations + Test Manager

## Objective

Deliver two new skills:

1. **ui-testplay-simulations**
   - simulate 100 realistic players building worlds and triggering events
   - produce deterministic, data-driven artifacts for human review
   - generate a risk log from simulation outcomes
2. **test-manager**
   - orchestrate and govern test infrastructure across feature/bug cycles
   - select and run the right validation suites based on change scope
   - centralize reporting, checkpoint tracking, and risk rollups

## Skill 1: ui-testplay-simulations

### Deliverables

- Script:
  - `scripts/run-ui-testplay-simulations.js`
- Skill doc:
  - `.github/skills/ui-testplay-simulations/SKILL.md`
- Tests:
  - `tests/ui-testplay-simulations.test.js`
- Artifacts (generated):
  - `reports/ui-testplay-simulations/latest/simulation-report.json`
  - `reports/ui-testplay-simulations/latest/simulation-dashboard.html`

### Core behavior

- Run deterministic pseudo-random simulation with a seed.
- Default to 100 player sessions.
- Build event sequences from gameplay primitives:
  - hitboxes
  - object-to-object drops
  - sequence interactions
  - edge/canvas-boundary interactions
- Emit:
  - per-player traces
  - aggregate event and failure metrics
  - top risk clusters with severity
  - recommended follow-up tests

### Risk log model

- Risk categories:
  - sequence interruption instability
  - boundary/edge clamp risk
  - overlap race conditions
  - repeated trigger-no-op behavior
  - object-state transition mismatch
- Each risk entry includes:
  - id
  - severity
  - frequency
  - impacted event types
  - representative trace IDs
  - recommendation

## Skill 2: test-manager

### Deliverables

- Script:
  - `scripts/test-manager.js`
- Skill doc:
  - `.github/skills/test-manager/SKILL.md`
- Tests:
  - `tests/test-manager.test.js`
- Workflow:
  - `.github/workflows/test-manager-cycle.yml`
- Artifacts (generated):
  - `reports/test-manager/latest/manager-report.json`
  - `reports/test-manager/latest/manager-dashboard.html`

### Core behavior

- Detect changed files and choose validation scope:
  - sfx-focused
  - gameplay-events-focused
  - full-cycle
- Integrate existing commands:
  - `validate:sfx*`
  - `validate:events*`
  - `validate:sfx:changed`
  - `validate:events:changed`
- Integrate simulation skill:
  - run simulation pass in full-cycle mode
  - ingest simulation risk log into manager report
- Publish a single manager report:
  - what ran
  - what passed/failed
  - unresolved risks
  - next checkpoint recommendation

## Checkpoints

1. **Checkpoint 1: Plan and scope**
   - `skills-planning.md` created and aligned
2. **Checkpoint 2: Simulation skill implementation**
   - scripts + tests + artifact generation pass
3. **Checkpoint 3: Test manager implementation**
   - orchestration script + tests + dashboard pass
4. **Checkpoint 4: Integration and packaging**
   - package scripts, skills docs, workflow, and full validation pass

## Extension: Test audit and visualization

Added audit scope in Test Manager:

- classify tests as keep / enhance / candidate-low-value
- produce test-audit JSON + HTML dashboard
- merge top audit candidates into manager cycle reporting

Outputs:

- `reports/test-manager/latest/test-audit-report.json`
- `reports/test-manager/latest/test-audit-dashboard.html`

## Determinism requirements

- Fixed-seed RNG default and explicit seed override.
- Stable ordering of generated events and risk entries.
- Snapshot-friendly artifact schema with predictable keys.
- Repeat runs with same seed must produce identical JSON output.

## Acceptance criteria

- Both skills are documented and runnable.
- Deterministic tests pass.
- Human-readable dashboards and JSON reports are generated.
- Risk log includes actionable severity and follow-up guidance.
- Test manager can be used as the cycle-level entry point.
