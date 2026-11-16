# Olivia's World (TocaBoca-style) - Game Design

## 1) Product Vision
Create a playful, tablet-friendly browser game for Olivia, inspired by Toca Boca interaction patterns (touch-first, drag-and-drop customization, simple world navigation, and expressive feedback).

## 2) Platform + Constraints
- Target platform: modern web browser on tablet.
- Orientation: **horizontal / landscape only**.
- Input: **touch-first** (tap, drag, drop), mouse support optional for desktop testing.
- Fixed gameplay viewport: **1280x800 virtual tablet canvas**, centered and scaled down on smaller windows.
- Initial release: single-player, offline-friendly assets loaded locally.

## 3) Core User Flow (MVP)
1. Player lands on Splash Screen with `cuppyland-splash-horizontal.jpg`.
2. A large animated **Play** button is overlaid (gentle pulse/bounce to signal tap target).
3. Tap **Play** -> World Selection Screen.
4. Player selects one world:
   - **Playground**
   - **Olivia's Room**
5. Selected world opens on World Canvas with:
   - Close button (**X**)
   - Inventory button (stylized icon)
6. Player opens inventory, drags items onto valid snap targets.
7. Player can close world only after confirm dialog (**Yes / No**).

## 4) Screen Specifications

### 4.1 Splash Screen
- Background image: `cuppy-land/assets/cuppyland-splash-horizontal.jpg`.
- Primary CTA: `Play Game`.
- CTA animation: subtle pulse (scale 1.0 -> 1.06 -> 1.0) loop.
- If not in landscape, show rotate-device prompt and block gameplay.

### 4.2 World Selection Screen
- Two world cards/buttons:
  - Playground
  - Olivia's Room
- Tap target must be large enough for tablet touch.
- Back option to return to splash.

### 4.3 World Canvas Screen
- World background is stationary at launch.
- World supports horizontal scrolling/panning as content expands left/right.
- Persistent UI controls:
  - **X** close button (top corner)
  - Inventory button/icon
- Close action requires confirmation modal:
  - Prompt: "Close world?"
  - Buttons: Yes / No

## 5) Inventory + Customization (MVP)
Inventory opens as a panel/tray.

### 5.1 Item Categories
- Lid color: any **primary color** option set.
- Cup base color: any **primary color** option set.
- Sleeve style (3):
  - `sleeve-child.jpg`
  - `sleeve-parent.jpg`
  - `sleeve-grandparent.jpg`

### 5.2 Interaction Rules
- Drag item from inventory.
- Drop only on valid snap targets (lid zone, cup zone, sleeve zone).
- Invalid action example:
  - Dragging `cuppy-child` sleeve onto cup that already has `cuppy-child` active -> reject.
- Valid action example:
  - Dragging a different sleeve type than currently active -> snap and apply.
- On invalid drop:
  - No state change.
  - Give visual feedback (shake or "not allowed" indicator).

### 5.3 Expression Swap Rule
- Sleeve selection changes post-it facial expression associated with the cup character.
- Exactly one sleeve style active at a time.

## 6) Data Model (MVP Draft)
```ts
type WorldId = "playground" | "olivia-room";
type PrimaryColor = "red" | "blue" | "yellow";
type SleeveType = "child" | "parent" | "grandparent";

interface CupState {
  lidColor: PrimaryColor;
  cupColor: PrimaryColor;
  sleeve: SleeveType;
}

interface GameState {
  currentScreen: "splash" | "world-select" | "world";
  activeWorld?: WorldId;
  inventoryOpen: boolean;
  cup: CupState;
}
```

## 7) MVP Asset Checklist
- Existing:
  - `cuppy-land/assets/cuppyland-splash-horizontal.jpg`
- Needed/verify:
  - `sleeve-child.jpg`
  - `sleeve-parent.jpg`
  - `sleeve-grandparent.jpg`
  - Inventory icon image(s)
  - World backgrounds for Playground and Olivia's Room
  - Cup layers (lid, base, sleeve overlays, expression variants)
  - Music tracks:
    - `cuppy-land/sfx/Kailua_Breeze.mp3` (menu music for splash + world select)
    - `cuppy-land/sfx/playgound.mp3` (Playground world music)
    - `cuppy-land/sfx/olivias-room.mp3` (Olivia's Room world music)

### 7.1 Grayscale Tint Pipeline (Implemented)
- The MVP now supports grayscale tinting for lid and cup via code so one grayscale asset can produce many colors.
- Expected files:
  - `cuppy-land/assets/lid-grayscale.png`
  - `cuppy-land/assets/cup-grayscale.png`
- Export guidance:
  - PNG with transparent background.
  - White/gray/black shading only (no baked-in color).
  - Match the current render box sizes:
    - Lid: `210 x 58`
    - Cup: `220 x 230`
- Runtime behavior:
  - If grayscale assets are missing, game falls back to flat color fills.
  - If provided, selected inventory color is multiplied with grayscale shading to preserve depth/highlights.

## 8) Technical Architecture (MVP)
- Front-end app: HTML/CSS/JavaScript (or TypeScript compiled to JS).
- Scene/state manager for screen transitions.
- Touch input layer using Pointer Events.
- Drag-drop system with explicit snap zones and validators.
- Audio engine with bus routing:
  - Master bus
  - Music bus (looped background tracks, screen/world-aware transitions)
  - SFX bus (UI and interaction feedback)
- Render strategy:
  - DOM/CSS layered sprites for simplicity, or
  - single canvas with retained object model.

## 9) MVP Acceptance Criteria
- Game only proceeds in landscape orientation.
- Splash screen displays background + animated Play button.
- Play button transitions to world selection.
- User can open either world canvas.
- Close X always prompts Yes/No before exit.
- Inventory opens/closes from inventory icon.
- Inventory includes music and SFX volume sliders.
- Drag/drop works for lid, cup color, and sleeve.
- Invalid duplicate sleeve drop is blocked with visible feedback.
- Valid sleeve drop updates sleeve + expression.

## 10) MVP Todo List

### Foundation
- [x] Create project scaffold under `cuppy-land/` (HTML, CSS, JS/TS, assets, config).
- [x] Add responsive layout locked to landscape gameplay with rotate prompt fallback.
- [x] Implement global game state store and screen routing.

### Splash + Navigation
- [x] Build splash screen using `cuppyland-splash-horizontal.jpg`.
- [x] Implement animated Play button and touch handler.
- [x] Build world selection screen with Playground + Olivia's Room cards.
- [x] Implement transitions between splash, world select, and world canvas.

### World Canvas UI
- [x] Build world canvas container with horizontal pan/scroll support.
- [x] Add close (X) button.
- [x] Add confirm modal (Yes/No) for world exit.
- [x] Add inventory icon button styled to match art direction.

### Inventory + Drag/Drop
- [x] Build inventory panel UI with categories (lid color, cup color, sleeve type).
- [x] Implement drag source behaviors for touch devices.
- [x] Implement snap targets on cup object (lid/base/sleeve zones).
- [x] Implement drop validation rules.
- [x] Add invalid-drop feedback animation/effect.

### Character Customization Logic
- [x] Implement primary color application for lid.
- [x] Implement primary color application for cup base.
- [x] Implement sleeve switching (`child`, `parent`, `grandparent`).
- [x] Bind sleeve selection to expression variant update.

### Assets + Polish
- [x] Export and add grayscale tint assets (`lid-grayscale.png`, `cup-grayscale.png`) to `cuppy-land/assets/`.
- [x] Gather/create missing sleeve and world assets.
- [x] Optimize image sizes for tablet performance.
- [x] Add basic transition/audio feedback hooks (optional, non-blocking).

### QA for MVP
- [ ] Validate touch interactions on tablet browser.
- [ ] Test landscape lock behavior and rotate prompt.
- [ ] Test invalid duplicate sleeve drag case.
- [ ] Test close confirmation flow from each world.
- [ ] Run quick performance pass for smooth dragging/panning.

## 11) Post-MVP Backlog (Next)
- Additional worlds and characters.
- Save/load outfit presets.
- Character animations and emotes.
- Sound effects and background music.
- Accessibility pass (contrast, larger touch targets, optional narration).
