# Olivia's World — LLM Hand-off

## 1) Project snapshot
- Platform: tablet-first web game, landscape-only.
- Runtime: plain HTML/CSS/JS (no bundler currently).
- Entry point: [index.html](C:/dev/oliviaworld/cuppy-land/index.html)
- Main orchestration: [app.js](C:/dev/oliviaworld/cuppy-land/src/core/app.js)

## 2) Current architecture
- Core:
  - [app.js](C:/dev/oliviaworld/cuppy-land/src/core/app.js)
  - [game-config.js](C:/dev/oliviaworld/cuppy-land/src/core/game-config.js)
- State:
  - [cup-state-store.js](C:/dev/oliviaworld/cuppy-land/src/state/cup-state-store.js)
- Interaction:
  - [interaction-helpers.js](C:/dev/oliviaworld/cuppy-land/src/interaction/interaction-helpers.js)
  - [cup-drag-helpers.js](C:/dev/oliviaworld/cuppy-land/src/interaction/cup-drag-helpers.js)
- Controllers:
  - [cup-pointer-controller.js](C:/dev/oliviaworld/cuppy-land/src/controllers/cup-pointer-controller.js)
  - [inventory-interaction-controller.js](C:/dev/oliviaworld/cuppy-land/src/controllers/inventory-interaction-controller.js)
  - [screen-world-controller.js](C:/dev/oliviaworld/cuppy-land/src/controllers/screen-world-controller.js)
  - [render-controller.js](C:/dev/oliviaworld/cuppy-land/src/controllers/render-controller.js)
  - [bootstrap-controller.js](C:/dev/oliviaworld/cuppy-land/src/controllers/bootstrap-controller.js)
  - [game-rules-controller.js](C:/dev/oliviaworld/cuppy-land/src/controllers/game-rules-controller.js)
- Audio:
  - [audio-engine.js](C:/dev/oliviaworld/cuppy-land/src/audio/audio-engine.js)
  - [audio.js](C:/dev/oliviaworld/cuppy-land/src/audio/audio.js)
- UI:
  - [inventory.js](C:/dev/oliviaworld/cuppy-land/src/ui/inventory.js)

## 3) Core gameplay invariants
1. Per-world isolation.
2. Per-cup state isolation.
3. Active dragged/selected cup is brought to front.
4. Inventory click targets selected cup; drag targets hovered cup + valid zone.
5. Duplicate sleeve apply is invalid.
6. Hair/lid coupling:
   - Hair can be removed independently.
   - Removing lid removes lid + hair.
   - Applying hair to lidless cup auto-restores lid and anchors hair.

## 4) Folder structure (implemented)
```text
cuppy-land/
  src/
    core/
      app.js
      game-config.js
    state/
      cup-state-store.js
    interaction/
      interaction-helpers.js
      cup-drag-helpers.js
    controllers/
      cup-pointer-controller.js
      inventory-interaction-controller.js
      screen-world-controller.js
      render-controller.js
      bootstrap-controller.js
      game-rules-controller.js
    audio/
      audio-engine.js
      audio.js
    ui/
      inventory.js
  assets/
  styles.css
  index.html
```

`index.html` script order is dependency-sensitive in this no-bundler setup.

## 5) Manual playtest checklist
- Splash -> world select -> world open.
- Multi-cup drag order (active cup stays on top).
- Hair remove/reapply by click and drag.
- Lid removed then hair apply (auto lid restore).
- Sleeve apply/remove + expression behavior.
- Trash/out-of-bounds removal behavior.
- World switching with no state leakage.
