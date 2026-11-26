# SFX Validation Skill Implementation Plan

## Goal

Create a repeatable Copilot skill that validates as much of Cuppy Land's SFX behavior as possible in code:

- static configuration and file integrity
- registry and controller wiring
- deterministic browser-trigger coverage
- muted, hidden-tab, missing-media, rapid-trigger, and interrupted-sequence behavior
- human-readable pass/fail reporting

The skill must distinguish deterministic code evidence from manual playtest requirements. Browser automation should report exact clip names and trigger conditions rather than using screenshots or timing guesses as the primary assertion.

## Target layout

```text
.github/
  skills/
    sfx-validation/
      SKILL.md
      scripts/
        validate-sfx-static.js
        validate-sfx-browser.js
        capture-sfx-events.js
tests/
  sfx-validation.test.js
  sfx-browser-validation.test.js
SFX-VALIDATION-SKILL-PLAN.md
```

The skill should expose focused commands:

- `validate-sfx` - static and unit validation
- `validate-sfx --browser` - add Playwright browser validation
- `validate-sfx --world playground`
- `validate-sfx --world olivia-room`
- `validate-sfx --clip <clipName>`
- `validate-sfx --full` - complete validation plus edge cases

## Existing implementation surfaces

- `src/core/game-config.js`
- `src/core/object-sfx-trigger-registry.js`
- `src/core/trigger-manifest.js`
- `src/core/interaction-rule-registry.js`
- `src/audio/audio.js`
- `src/controllers/background-object-controller.js`
- `src/controllers/friend-pointer-controller.js`
- `src/controllers/world-friend-controller.js`
- `src/controllers/tube-slide-controller.js`
- `src/controllers/cup-pointer-controller.js`
- `src/controllers/puppy-sequence-controller.js`
- `src/controllers/chocolate-milk-sequence-controller.js`
- `src/controllers/parmesan-cheese-sequence-controller.js`
- `tests/*.test.js`

## Phase 1: SFX manifest and static validation

Create a manifest utility that derives clip metadata from `audioConfig.sfxClips` and the object SFX trigger registries.

Implement:

- every registry clip name has a corresponding `sfxClips` entry
- every configured SFX file exists
- every referenced file is loadable as an audio asset
- no referenced `.ogg` path is duplicated with conflicting configuration
- world themes and world introduction clips exist
- snap, hitbox, double-tap, and bounce registries cover their intended types
- removal and cup-part clip names resolve

Deliverables:

- `sfx-validation.test.js`
- manifest extraction helper
- static validation command

## Phase 2: Controller and dispatch unit coverage

Add deterministic tests that load the browser scripts in the existing Node test harness.

Cover:

- snap dispatch by character type
- double-tap dispatch by character type
- hitbox dispatch by character type
- bounce activation dispatch
- Barbie and Barbie Baby Tube Slide dispatch
- Rabbit and Turtle stop-motion and reanchor hooks
- duplicate inventory items preserve independent IDs
- rapid re-entry does not create duplicate active sequences
- hidden-tab and muted-volume guards call completion callbacks where required
- missing-media and failed-playback fallbacks do not leave sequences blocked
- completion-controlled Uke behavior

Tests should assert state and returned clip names. They must not rely on wall-clock timing for sequence correctness unless the timing is the behavior under test.

## Phase 3: Browser audio instrumentation

Instrument the browser before each interaction:

```javascript
window.CuppyLandAudio.playSfxClip
window.CuppyLandAudio.playLoopingSfxClip
window.CuppyLandAudio.stopSfxClip
```

Record structured events:

- clip name
- timestamp
- active world
- SFX volume
- document visibility
- sequence or element ID
- success or failure
- completion callback fired
- duplicate start count

Do not infer success only from DOM or audio presence. A test passes only when the expected clip event and state transition both occur.

## Phase 4: Deterministic browser interaction helpers

Create reusable helpers that read live anchor configuration rather than hardcoding world coordinates.

Required operations:

- enter Playground or Olivia’s Room
- add a character or friend through inventory
- drag a friend to exact world coordinates
- drag or overlap a friend at a configured hitbox
- double-tap an element with stable pointer events
- add a cup
- detach and reattach a lid
- detach and reattach a sleeve
- remove an object
- switch worlds
- wait for an element or sequence state using bounded retries

The browser harness must clean state between cases and avoid depending on inventory animation delays.

## Phase 5: Trigger matrix coverage

### World and menu audio

- menu
- welcome
- Play/Hi
- Playground intro and theme
- Olivia Room intro and theme

### Character snaps

- Rocket Man
- SpongeBob
- Hairy Guy
- Furball Guy
- Golden Puppy
- Barbie
- Barbie Baby

### Double-tap activations

- Golden Puppy
- Barbie
- Barbie Baby
- Pumpkin Man
- Turkey
- Fishbowl
- Parmesan Cheese
- Water Bowl
- Rocket Man
- Ukulele

### Hitboxes and sequences

- trampoline
- bed
- Tube Slide
- Merry-Go-Round
- drinking fountain
- fishbowl
- dog bowl and puppy toys
- Chocolate Milk
- Parmesan Cheese
- Ukulele

## Phase 6: Edge-case validation

Automate:

- SFX volume at 0
- SFX volume raised from 0
- music muted while SFX remains active
- hidden document
- missing clip configuration
- failed media playback
- rapid repeated activation
- repeated double-tap before timeout
- expired first tap
- temporary overlap loss
- overlap re-entry
- duplicate inventory items
- removal during an active sequence
- world switching during a clip
- completion callback invoked once
- looping SFX stopped on release
- stale sequence callbacks after interrupted interaction

## Phase 7: Reporting

The command should output:

- static pass/fail count
- unit pass/fail count
- browser pass/fail count
- expected clip
- observed clip
- trigger action
- active world
- element/friend/cup ID
- console warnings
- failed media URLs
- sequence state left active
- screenshots or browser snapshots only for failures

CI mode should return a nonzero exit code for any failure.
Manual-only checks should be labeled as manual rather than represented as automated passes.

## Human-in-the-loop checkpoints

No phase will advance without explicit confirmation at a checkpoint.

### Checkpoint 1: Static manifest

Confirm:

- all existing clip paths are discovered
- missing or orphaned clips are reported correctly
- existing valid assets produce no false positives

**Pause for human confirmation before browser work begins.**

### Checkpoint 2: Unit dispatch

Confirm:

- each registry category dispatches the intended clip
- Barbie and Barbie Baby follow the same registered behavior
- Rabbit and Turtle activation/reanchor behavior is represented
- the test suite is deterministic across repeated runs

**Pause for human confirmation before browser automation.**

### Checkpoint 3: Audio instrumentation

Confirm in the live app:

- clip events are recorded exactly once
- muted and hidden-tab behavior is observable
- missing-media errors do not stop the app
- event order matches actual interactions

**Pause for human confirmation before full trigger automation.**

### Checkpoint 4: Core browser matrix

Confirm live:

- world audio
- character snaps
- double-tap activations
- trampoline, bed, and Tube Slide
- at least one repeated run is identical

**Pause for human confirmation before edge-case automation.**

### Checkpoint 5: Edge cases

Confirm live and by test:

- rapid activation
- temporary overlap loss
- interrupted sequences
- duplicate items
- world switching
- muted and hidden-tab behavior

**Pause for human confirmation before skill packaging.**

### Checkpoint 6: Skill packaging

Confirm:

- commands work from the repository
- focused runs and full runs are documented
- failures are actionable
- CI exit behavior is correct
- no temporary diagnostics remain in production code

## Determinism controls

- no random inventory IDs in assertions
- reset audio settings and world state before each browser case
- wait on explicit DOM/active-sequence state instead of fixed delays
- use configured anchors rather than copied viewport coordinates
- use unique element and friend IDs
- retry only bounded DOM/layout synchronization
- separate observed clip events from DOM sequence events
- run each browser matrix case repeatedly before marking it stable

## Completion criteria

The implementation is complete only when:

- static validation passes on main
- unit validation passes repeatedly
- browser matrices pass with no console playback errors
- all edge-case failures are explicitly classified
- human checkpoints 1-6 are confirmed
- temporary instrumentation and diagnostics are removed
- the skill is documented and committed
