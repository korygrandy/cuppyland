# Olivia's World — LLM Hand-off

## 1) Project snapshot
- Platform: tablet-first web game, landscape-only.
- Runtime: plain HTML/CSS/JS (no bundler currently).
- Entry point: [index.html](C:/dev/oliviaworld/cuppy-land/index.html)
- Main gameplay orchestration: [app.js](C:/dev/oliviaworld/cuppy-land/app.js)

## 2) Current architecture (modularized slices completed)
- Cup/world state store: [cup-state-store.js](C:/dev/oliviaworld/cuppy-land/cup-state-store.js)
- Interaction helpers: [interaction-helpers.js](C:/dev/oliviaworld/cuppy-land/interaction-helpers.js)
- Cup drag/proximity helpers: [cup-drag-helpers.js](C:/dev/oliviaworld/cuppy-land/cup-drag-helpers.js)
- Cup pointer controller: [cup-pointer-controller.js](C:/dev/oliviaworld/cuppy-land/cup-pointer-controller.js)
- Inventory interaction controller: [inventory-interaction-controller.js](C:/dev/oliviaworld/cuppy-land/inventory-interaction-controller.js)
- Screen/world controller: [screen-world-controller.js](C:/dev/oliviaworld/cuppy-land/screen-world-controller.js)
- Render/tint controller: [render-controller.js](C:/dev/oliviaworld/cuppy-land/render-controller.js)
- Audio engine (bus-based): [audio-engine.js](C:/dev/oliviaworld/cuppy-land/audio-engine.js)
- Audio app facade/wiring: [audio.js](C:/dev/oliviaworld/cuppy-land/audio.js)
- Game config and defaults: [game-config.js](C:/dev/oliviaworld/cuppy-land/game-config.js)
- Inventory item builders: [inventory.js](C:/dev/oliviaworld/cuppy-land/inventory.js)

## 3) Core gameplay invariants
1. **Per-world isolation**  
   Cups are world-scoped. Changes in one world should never mutate another world.
2. **Per-cup state isolation**  
   Each cup has its own lid/sleeve/hair/expression/position state.
3. **Z-order behavior**  
   Active cup interaction should bring that cup to front.
4. **Accessory targeting rules**  
   - Click inventory applies to selected/active cup.
   - Drag inventory applies to hovered cup + valid zone.
5. **Removal rules**
   - Drag cup/parts off viewport => remove/hide per object rules.
   - Drag over trash => remove selected target.
6. **Hair/lid coupling rules**
   - Hair can be removed independently.
   - Dragging lid removes lid+hair together when removed.
   - Applying hairstyle to a lidless cup auto-restores lid and anchors hair.

## 4) Known behavior decisions (intentional)
- Duplicate sleeve apply is blocked with invalid feedback.
- Hair reapply restores visible + anchored defaults.
- Landscape prompt blocks play ergonomics in portrait mode.
- Audio may show warnings in `file:///` test mode depending on local codec/source support.

## 5) Suggested folder refactor (next major step)
Current files are flat; move to feature folders while keeping script load order stable:

```text
cuppy-land/
  src/
    core/
      app.js
      game-config.js
    state/
      cup-state-store.js
    controllers/
      cup-pointer-controller.js
      inventory-interaction-controller.js
      screen-world-controller.js
      render-controller.js
    interaction/
      interaction-helpers.js
      cup-drag-helpers.js
    audio/
      audio-engine.js
      audio.js
    ui/
      inventory.js
  assets/
  styles/
    styles.css
  index.html
```

If you do this without a bundler, update script tags carefully in [index.html](C:/dev/oliviaworld/cuppy-land/index.html) to preserve dependency order.

## 6) High-value next refactor slices
1. Extract event wiring/bootstrap from [app.js](C:/dev/oliviaworld/cuppy-land/app.js) into `bootstrap-controller`.
2. Replace remaining wrapper functions in [app.js](C:/dev/oliviaworld/cuppy-land/app.js) with direct module usage or smaller adapters.
3. Centralize constants (offsets, snap distances, thresholds) into config.
4. Add smoke tests for:
   - multi-cup accessory targeting
   - z-order fronting on drag
   - hair/lid edge cases
   - world isolation

## 7) Manual playtest checklist
- Splash -> world select -> world open.
- Add 2+ cups, drag each, verify active dragged cup on top.
- Remove hairstyle, reapply by click and drag.
- Remove lid+hair then click hairstyle; lid should auto-restore and hair anchor.
- Remove sleeve and ensure face behavior is correct.
- Move object off viewport and validate expected delete/hide behavior.
- Switch worlds and verify states do not leak.

## 8) Branch / workflow note
- Active branch for refactor work: `feat/modular-refactor`.
- Keep changes small and commit per slice to preserve rollback points.
