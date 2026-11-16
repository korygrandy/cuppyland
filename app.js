const { state, fixedViewport, palette, sleeveTypes, sleeveFaceMap, sleeveAssetMap, sleevePalette, colorMap, worldClasses } = window.CuppyLandGame;

const screenEls = {
  splash: document.getElementById("splashScreen"),
  worldSelect: document.getElementById("worldSelectScreen"),
  world: document.getElementById("worldScreen"),
};

const playBtn = document.getElementById("playBtn");
const backToSplashBtn = document.getElementById("backToSplashBtn");
const worldButtons = Array.from(document.querySelectorAll(".world-card"));
const closeWorldBtn = document.getElementById("closeWorldBtn");
const inventoryToggleBtn = document.getElementById("inventoryToggleBtn");
const inventoryPanel = document.getElementById("inventoryPanel");
const worldBackground = document.getElementById("worldBackground");
const worldViewport = document.getElementById("worldViewport");
const closeModal = document.getElementById("closeModal");
const confirmCloseBtn = document.getElementById("confirmCloseBtn");
const cancelCloseBtn = document.getElementById("cancelCloseBtn");
const rotatePrompt = document.getElementById("rotatePrompt");
const worldCanvas = document.getElementById("worldCanvas");
const cupCharacter = document.getElementById("cupCharacter");
const lidLayer = document.getElementById("lidLayer");
const cupLayer = document.getElementById("cupLayer");
const hairstyleLayer = document.getElementById("hairstyleLayer");
const sleeveLayer = document.getElementById("sleeveLayer");
const faceLayer = document.getElementById("faceLayer");
const lidItems = document.getElementById("lidItems");
const cupItems = document.getElementById("cupItems");
const sleeveItems = document.getElementById("sleeveItems");
const dragGhost = document.getElementById("dragGhost");
const trashCanBtn = document.getElementById("trashCanBtn");
const dropZoneLid = document.getElementById("dropZoneLid");
const dropZoneCup = document.getElementById("dropZoneCup");
const dropZoneSleeve = document.getElementById("dropZoneSleeve");
const musicVolumeInput = document.getElementById("musicVolumeInput");
const sfxVolumeInput = document.getElementById("sfxVolumeInput");
const musicVolumeValue = document.getElementById("musicVolumeValue");
const sfxVolumeValue = document.getElementById("sfxVolumeValue");
const musicMuteBtn = document.getElementById("musicMuteBtn");
const sfxMuteBtn = document.getElementById("sfxMuteBtn");
const { defaultSleeveAsset } = window.CuppyLandGame;

const dragState = {
  active: false,
  type: "",
  value: "",
  pointerId: null,
};
const lidDragState = {
  active: false,
  pointerId: null,
  initialLeft: 17,
  initialTop: 0,
  anchorX: 0,
  anchorY: 0,
};
const sleeveDragState = {
  active: false,
  pointerId: null,
  initialLeft: 30,
  initialTop: 164,
  anchorX: 0,
  anchorY: 0,
};
const hairstyleDragState = {
  active: false,
  pointerId: null,
  initialLeft: 17,
  initialTop: -22,
  anchorX: 0,
  anchorY: 0,
  moved: false,
};
const cupDragState = {
  active: false,
  pointerId: null,
  startClientX: 0,
  startClientY: 0,
  startWorldX: 0,
  startWorldY: 0,
};
const trashState = {
  active: false,
  target: null,
};
const cupStateStore = window.CuppyLandCupState.createStore({
  gameConfig: window.CuppyLandGame,
  state,
});
const interactionHelpers = window.CuppyLandInteraction.createHelpers({
  documentRef: document,
  worldViewport,
  trashCanBtn,
  dropZones: [dropZoneLid, dropZoneCup, dropZoneSleeve],
  onHoveredCup: (cupId) => {
    if (cupId) {
      setActiveCupInstance(cupId);
    }
  },
});
const {
  safeClosest,
  trySetPointerCapture,
  getCupElementAtPoint,
  zoneForPoint,
  setZoneHighlight,
  clearZoneHighlights,
  showTrashCan: showTrashCanBase,
  hideTrashCan: hideTrashCanBase,
  isPointerOverTrashCan,
  isPointerOutsideWorldCanvas,
} = interactionHelpers;
const cupDragHelpers = window.CuppyLandCupDrag.createHelpers({
  cupLayer,
  lidLayer,
  sleeveLayer,
  hairstyleLayer,
});
const {
  clampDetachedOffset,
  isLidNearCup,
  isSleeveNearCup,
  isHairstyleNearLid,
} = cupDragHelpers;
const cupPointerController = window.CuppyLandCupPointerController.createController({
  state,
  cupCharacter,
  worldCanvas,
  trashCanBtn,
  cupDragState,
  lidDragState,
  hairstyleDragState,
  sleeveDragState,
  safeClosest,
  trySetPointerCapture,
  isPointerOutsideWorldCanvas,
  isPointerOverTrashCan,
  setActiveCupInstance,
  bringCupElementToFront,
  resolveCupStateForElement,
  showTrashCan,
  removeCupInstance,
  removeSelectedObject,
  renderWorldCups,
  syncCupWorldPosition,
  syncLidPosition,
  syncSleevePosition,
  syncFacePosition,
  clampDetachedOffset,
  isLidNearCup,
  isSleeveNearCup,
  isHairstyleNearLid,
});
const inventoryInteractionController = window.CuppyLandInventoryInteraction.createController({
  state,
  dragState,
  dragGhost,
  trySetPointerCapture,
  setZoneHighlight,
  clearZoneHighlights,
  getCupElementAtPoint,
  zoneForPoint,
  applyDrop,
  applyInventorySelection,
  showInvalidFeedback,
  renderWorldCups,
  getActiveCupId: () => state.activeCupId,
  getActiveCupInstance,
});

function syncAudioForCurrentScreen() {
  if (window.CuppyLandAudio && typeof window.CuppyLandAudio.syncAudioForCurrentScreen === "function") {
    window.CuppyLandAudio.syncAudioForCurrentScreen();
  }
}

function createDefaultCupState() {
  return cupStateStore.createDefaultCupState();
}

function cloneCupState(source = state.cup) {
  return cupStateStore.cloneCupState(source);
}

function getWorldCupList(worldId = state.activeWorld) {
  return cupStateStore.getWorldCupList(worldId);
}

function ensureCupLayerOrder(cupState, fallbackOrder = 1) {
  return cupStateStore.ensureCupLayerOrder(cupState, fallbackOrder);
}

function bringCupElementToFront(cupElement) {
  if (!cupElement) {
    return;
  }

  const cupState = resolveCupStateForElement(cupElement);
  const nextZIndex = cupStateStore.bringCupToFront(cupState);
  if (Number.isFinite(nextZIndex)) {
    cupElement.style.zIndex = String(nextZIndex);
  }
}

function syncCupSelectionVisualState() {
  document.querySelectorAll(".cup-character[data-cup-id]").forEach((cupNode) => {
    const isSelected = cupNode.dataset.cupId === state.activeCupId;
    cupNode.classList.toggle("is-selected", isSelected);
  });
}

function setActiveCupInstance(cupId) {
  const nextActiveCup = cupStateStore.setActiveCupInstance(cupId);
  if (nextActiveCup) {
    syncCupSelectionVisualState();
  }
}

function getActiveCupInstance() {
  return cupStateStore.getActiveCupInstance();
}

function syncWorldCupSelection() {
  cupStateStore.syncWorldCupSelection();
}

function getTargetCupState() {
  return cupStateStore.getTargetCupState();
}

function createCupElement(cupId, cupState) {
  const template = cupCharacter.cloneNode(true);
  template.dataset.cupId = cupId;
  template.id = `cupCharacter-${cupId}`;
  template.classList.remove("hidden-object");
  template.style.left = `${cupState.worldX}px`;
  template.style.top = `${cupState.worldY}px`;
  template.style.zIndex = String(ensureCupLayerOrder(cupState));

  template.querySelectorAll("[id]").forEach((node) => {
    const nextId = `${cupId}-${node.id}`;
    node.id = nextId;
    node.dataset.cupId = cupId;
  });

  const cupNode = template.querySelector(".cup-base");
  if (cupNode) {
    cupNode.dataset.cupId = cupId;
  }

  const lidNode = template.querySelector(".cup-lid");
  if (lidNode) {
    lidNode.dataset.cupId = cupId;
  }

  const sleeveNode = template.querySelector(".cup-sleeve");
  if (sleeveNode) {
    sleeveNode.dataset.cupId = cupId;
  }

  const hairstyleNode = template.querySelector(".cup-hairstyle");
  if (hairstyleNode) {
    hairstyleNode.dataset.cupId = cupId;
  }

  const faceNode = template.querySelector(".cup-face");
  if (faceNode) {
    faceNode.dataset.cupId = cupId;
  }

  template.addEventListener("pointerdown", (event) => onCupPointerDown(event, template));
  template.addEventListener("pointermove", (event) => onCupPointerMove(event, template));
  template.addEventListener("pointerup", (event) => onCupPointerUp(event, template));
  template.addEventListener("pointercancel", (event) => onCupPointerUp(event, template));

  template.querySelector(".cup-base")?.addEventListener("pointerdown", (event) => onCupPointerDown(event, template));
  template.querySelector(".cup-base")?.addEventListener("pointermove", (event) => onCupPointerMove(event, template));
  template.querySelector(".cup-base")?.addEventListener("pointerup", (event) => onCupPointerUp(event, template));
  template.querySelector(".cup-base")?.addEventListener("pointercancel", (event) => onCupPointerUp(event, template));

  template.querySelector(".cup-lid")?.addEventListener("pointerdown", (event) => onLidPointerDown(event, template));
  template.querySelector(".cup-lid")?.addEventListener("pointermove", (event) => onLidPointerMove(event, template));
  template.querySelector(".cup-lid")?.addEventListener("pointerup", (event) => onLidPointerUp(event, template));
  template.querySelector(".cup-lid")?.addEventListener("pointercancel", (event) => onLidPointerUp(event, template));

  template.querySelector(".cup-sleeve")?.addEventListener("pointerdown", (event) => onSleevePointerDown(event, template));
  template.querySelector(".cup-sleeve")?.addEventListener("pointermove", (event) => onSleevePointerMove(event, template));
  template.querySelector(".cup-sleeve")?.addEventListener("pointerup", (event) => onSleevePointerUp(event, template));
  template.querySelector(".cup-sleeve")?.addEventListener("pointercancel", (event) => onSleevePointerUp(event, template));

  template.querySelector(".cup-hairstyle")?.addEventListener("pointerdown", (event) => onHairstylePointerDown(event, template));
  template.querySelector(".cup-hairstyle")?.addEventListener("pointermove", (event) => onHairstylePointerMove(event, template));
  template.querySelector(".cup-hairstyle")?.addEventListener("pointerup", (event) => onHairstylePointerUp(event, template));
  template.querySelector(".cup-hairstyle")?.addEventListener("pointercancel", (event) => onHairstylePointerUp(event, template));

  return template;
}

function renderWorldCups() {
  worldCanvas.querySelectorAll(".cup-character").forEach((node) => node.remove());
  const worldCups = getWorldCupList(state.activeWorld);
  if (!worldCups.length) {
    return;
  }

  worldCups.forEach((cupInfo, index) => ensureCupLayerOrder(cupInfo.state, index + 1));

  [...worldCups]
    .sort((a, b) => ensureCupLayerOrder(a.state) - ensureCupLayerOrder(b.state))
    .forEach((cupInfo) => {
    const cupElement = createCupElement(cupInfo.id, cupInfo.state);
    cupElement.classList.toggle("is-selected", cupInfo.id === state.activeCupId);
    worldCanvas.appendChild(cupElement);
    renderCupInstance(cupInfo.state, cupElement);
    });

  syncWorldCupSelection();
  syncCupSelectionVisualState();
}

const screenWorldController = window.CuppyLandScreenWorldController.createController({
  state,
  screenEls,
  worldBackground,
  worldViewport,
  closeModal,
  rotatePrompt,
  fixedViewport,
  worldClasses,
  documentRef: document,
  ensureWorldCupState,
  cloneCupState,
  renderWorldCups,
  toggleInventory,
  onScreenChanged: syncAudioForCurrentScreen,
});

function showScreen(screen) {
  screenWorldController.showScreen(screen);
}

function updateWorldBackground() {
  screenWorldController.updateWorldBackground();
}

function resolveCupStateForElement(cupElement) {
  if (cupElement && cupElement.dataset && cupElement.dataset.cupId && state.activeWorld) {
    const matchingCup = getWorldCupList(state.activeWorld).find((cup) => cup.id === cupElement.dataset.cupId);
    if (matchingCup) {
      return matchingCup.state;
    }
  }
  return state.cup;
}

function syncCupWorldPosition(cupElement = cupCharacter) {
  const cupState = resolveCupStateForElement(cupElement);
  if (!cupElement) {
    return;
  }

  const worldX = Number.isFinite(cupState.worldX) ? cupState.worldX : 920;
  const worldY = Number.isFinite(cupState.worldY) ? cupState.worldY : 430;
  cupElement.style.left = `${worldX}px`;
  cupElement.style.top = `${worldY}px`;
  cupElement.style.bottom = "auto";
}

function syncLidPosition(cupElement = cupCharacter) {
  const cupState = resolveCupStateForElement(cupElement);
  const lidLayerElement = cupElement.querySelector(".cup-lid") || lidLayer;
  const hairstyleLayerElement = cupElement.querySelector(".cup-hairstyle") || hairstyleLayer;
  const left = cupState.lidDetached ? cupState.lidOffsetX : 17;
  const top = cupState.lidDetached ? cupState.lidOffsetY : 0;
  lidLayerElement.style.left = `${left}px`;
  lidLayerElement.style.top = `${top}px`;
  if (hairstyleLayerElement) {
    const hairLeft = cupState.hairstyleDetached ? cupState.hairstyleOffsetX : left + 10;
    const hairTop = cupState.hairstyleDetached ? cupState.hairstyleOffsetY : top - 22;
    hairstyleLayerElement.style.left = `${hairLeft}px`;
    hairstyleLayerElement.style.top = `${hairTop}px`;
  }
}

function syncSleevePosition(cupElement = cupCharacter) {
  const cupState = resolveCupStateForElement(cupElement);
  const sleeveLayerElement = cupElement.querySelector(".cup-sleeve") || sleeveLayer;
  const left = cupState.sleeveDetached ? cupState.sleeveOffsetX : 32;
  const top = cupState.sleeveDetached ? cupState.sleeveOffsetY : 160;
  sleeveLayerElement.style.left = `${left}px`;
  sleeveLayerElement.style.top = `${top}px`;
}

function syncFacePosition(cupElement = cupCharacter) {
  const cupState = resolveCupStateForElement(cupElement);
  const sleeveLayerElement = cupElement.querySelector(".cup-sleeve") || sleeveLayer;
  const faceLayerElement = cupElement.querySelector(".cup-face") || faceLayer;
  if (!faceLayerElement) {
    return;
  }

  const left = cupState.sleeveDetached ? cupState.sleeveOffsetX : 32;
  const top = cupState.sleeveDetached ? cupState.sleeveOffsetY : 160;
  const faceOffsetX = cupState.faceOffsetX ?? 10;
  const faceOffsetY = cupState.faceOffsetY ?? 18;

  const sleeveAnchorX = left + (sleeveLayerElement.offsetWidth || 200) * 0.5;
  const sleeveAnchorY = top + (sleeveLayerElement.offsetHeight || 110) * 0.45;
  const faceCenterX = (faceLayerElement.offsetWidth || 120) * 0.5;
  const faceCenterY = (faceLayerElement.offsetHeight || 90) * 0.5;

  faceLayerElement.style.left = `${sleeveAnchorX - faceCenterX + faceOffsetX}px`;
  faceLayerElement.style.top = `${sleeveAnchorY - faceCenterY + faceOffsetY}px`;
}

const renderController = window.CuppyLandRenderController.createController({
  state,
  gameConfig: window.CuppyLandGame,
  cupCharacter,
  lidLayer,
  cupLayer,
  sleeveLayer,
  hairstyleLayer,
  faceLayer,
  colorMap,
  sleeveAssetMap,
  defaultSleeveAsset,
  syncCupWorldPosition,
  syncLidPosition,
  syncSleevePosition,
  syncFacePosition,
  resolveCupStateForElement,
});

function renderCupInstance(cupState, cupElement = cupCharacter) {
  renderController.renderCupInstance(cupState, cupElement);
}

function renderCup() {
  renderController.renderCup();
}

function renderTintedPart(part, colorName) {
  renderController.renderTintedPart(part, colorName);
}

function renderTintedPartForCanvas(part, colorName, targetCanvas) {
  renderController.renderTintedPartForCanvas(part, colorName, targetCanvas);
}

async function loadTintAssets() {
  await renderController.loadTintAssets();
}

function buildInventoryItems() {
  window.CuppyLandInventory.buildInventoryItems();
}

function toggleInventory(forceOpen) {
  state.inventoryOpen = typeof forceOpen === "boolean" ? forceOpen : !state.inventoryOpen;
  inventoryPanel.classList.toggle("open", state.inventoryOpen);
}

function ensureWorldCupState(worldId) {
  return cupStateStore.ensureWorldCupState(worldId);
}

function openWorld(worldId) {
  screenWorldController.openWorld(worldId);
}

function closeWorld() {
  screenWorldController.closeWorld();
}

function showCloseModal() {
  screenWorldController.showCloseModal();
}

function hideCloseModal() {
  screenWorldController.hideCloseModal();
}

function updateLandscapePrompt() {
  screenWorldController.updateLandscapePrompt();
}

function updateGameViewportScale() {
  screenWorldController.updateGameViewportScale();
}

function addCupToWorld() {
  const newCup = cupStateStore.addCupToWorld();
  if (!newCup) {
    return false;
  }
  renderWorldCups();
  return true;
}

function applyDrop(itemType, value, targetZone, targetCupId = state.activeCupId) {
  if (itemType === "cup-create") {
    return addCupToWorld() ? { valid: true } : { valid: false, reason: "no-world" };
  }

  if (!state.activeWorld) {
    return { valid: false, reason: "no-world" };
  }

  const worldCups = getWorldCupList(state.activeWorld);
  const selectedCup = worldCups.find((cup) => cup.id === targetCupId) || getActiveCupInstance() || worldCups[0];
  if (!selectedCup) {
    return { valid: false, reason: "no-cup" };
  }

  setActiveCupInstance(selectedCup.id);
  const activeCupState = selectedCup.state;
  const isHairstyleDrop = itemType === "hairstyle" && (targetZone === "lid" || targetZone === "hairstyle");

  if (itemType !== targetZone && !isHairstyleDrop) {
    return { valid: false, reason: "wrong-zone" };
  }

  if (itemType === "lid") {
    activeCupState.lidColor = value;
    return { valid: true };
  }

  if (itemType === "cup") {
    activeCupState.cupColor = value;
    return { valid: true };
  }

  if (itemType === "sleeve") {
    if (activeCupState.sleeve === value) {
      return { valid: false, reason: "duplicate-sleeve" };
    }
    activeCupState.sleeve = value;
    return { valid: true };
  }

  if (itemType === "expression") {
    activeCupState.expression = value;
    return { valid: true };
  }

  if (itemType === "hairstyle") {
    if (activeCupState.lidVisible === false) {
      activeCupState.lidVisible = true;
      activeCupState.lidDetached = false;
      activeCupState.lidOffsetX = 17;
      activeCupState.lidOffsetY = 0;
    }
    activeCupState.hairstyle = value;
    activeCupState.hairstyleVisible = true;
    activeCupState.hairstyleDetached = false;
    activeCupState.hairstyleOffsetX = 17;
    activeCupState.hairstyleOffsetY = -22;
    return { valid: true };
  }

  return { valid: false, reason: "unknown-item" };
}

function applyInventorySelection(itemType, value, targetCupId = state.activeCupId) {
  const result = applyDrop(itemType, value, itemType, targetCupId);
  if (result.valid) {
    renderWorldCups();
    return true;
  }

  if (result.reason === "duplicate-sleeve") {
    showInvalidFeedback();
  }
  return false;
}

function showInvalidFeedback() {
  sleeveLayer.classList.remove("invalid-shake");
  cupLayer.classList.remove("invalid-shake");
  lidLayer.classList.remove("invalid-shake");
  void sleeveLayer.offsetWidth;
  sleeveLayer.classList.add("invalid-shake");
}

function showTrashCan(target) {
  showTrashCanBase(target, trashState);
}

function hideTrashCan() {
  hideTrashCanBase(trashState);
}

function removeCupInstance(cupId) {
  const result = cupStateStore.removeCupInstance(cupId);
  if (!result.removed) {
    return;
  }
  renderWorldCups();
}

function removeSelectedObject() {
  if (!trashState.target) {
    return;
  }

  const selectedCup = getActiveCupInstance();

  if (trashState.target === "cup") {
    if (selectedCup) {
      removeCupInstance(selectedCup.id);
    } else {
      cupCharacter.classList.add("hidden-object");
    }
    return;
  }

  if (trashState.target === "lid") {
    if (selectedCup) {
      selectedCup.state.lidVisible = false;
      selectedCup.state.hairstyleVisible = false;
    }
    lidLayer.style.display = "none";
    hairstyleLayer.style.display = "none";
  }

  if (trashState.target === "sleeve") {
    if (selectedCup) {
      selectedCup.state.sleeveVisible = false;
      selectedCup.state.faceVisible = false;
    }
    sleeveLayer.style.display = "none";
    faceLayer.style.display = "none";
  }

  if (trashState.target === "hairstyle") {
    if (selectedCup) {
      selectedCup.state.hairstyleVisible = false;
    }
    hairstyleLayer.style.display = "none";
  }

  hideTrashCan();
  renderWorldCups();
}

function onCupPointerDown(event) {
  cupPointerController.onCupPointerDown(event);
}

function onCupPointerMove(event) {
  cupPointerController.onCupPointerMove(event);
}

function onCupPointerUp(event) {
  cupPointerController.onCupPointerUp(event);
}

function onLidPointerDown(event) {
  cupPointerController.onLidPointerDown(event);
}

function onLidPointerMove(event) {
  cupPointerController.onLidPointerMove(event);
}

function onLidPointerUp(event) {
  cupPointerController.onLidPointerUp(event);
}

function onHairstylePointerDown(event) {
  cupPointerController.onHairstylePointerDown(event);
}

function onHairstylePointerMove(event) {
  cupPointerController.onHairstylePointerMove(event);
}

function onHairstylePointerUp(event) {
  cupPointerController.onHairstylePointerUp(event);
}

function onSleevePointerDown(event) {
  cupPointerController.onSleevePointerDown(event);
}

function onSleevePointerMove(event) {
  cupPointerController.onSleevePointerMove(event);
}

function onSleevePointerUp(event) {
  cupPointerController.onSleevePointerUp(event);
}

function onInventoryPointerDown(event) {
  inventoryInteractionController.onPointerDown(event);
}

function onInventoryClick(event) {
  inventoryInteractionController.onClick(event);
}

function onInventoryPointerMove(event) {
  inventoryInteractionController.onPointerMove(event);
}

function onInventoryPointerEnd(event) {
  inventoryInteractionController.onPointerEnd(event);
}

function wireEvents() {
  document.addEventListener("pointerdown", () => window.CuppyLandAudio.unlockAudio(), { once: true });
  document.addEventListener("keydown", () => window.CuppyLandAudio.unlockAudio(), { once: true });

  playBtn.addEventListener("click", () => {
    window.CuppyLandAudio.playSfx("standard");
    showScreen("worldSelect");
  });
  backToSplashBtn.addEventListener("click", () => {
    window.CuppyLandAudio.playSfx("standard");
    showScreen("splash");
  });
  worldButtons.forEach((button) => {
    button.addEventListener("click", () => {
      window.CuppyLandAudio.playSfx("standard");
      openWorld(button.dataset.world);
    });
  });
  inventoryToggleBtn.addEventListener("click", () => {
    window.CuppyLandAudio.playSfx("standard");
    toggleInventory();
  });
  closeWorldBtn.addEventListener("click", () => {
    window.CuppyLandAudio.playSfx("close");
    showCloseModal();
  });
  confirmCloseBtn.addEventListener("click", () => {
    window.CuppyLandAudio.playSfx("yes");
    hideCloseModal();
    closeWorld();
  });
  cancelCloseBtn.addEventListener("click", () => {
    window.CuppyLandAudio.playSfx("no");
    hideCloseModal();
  });
  window.addEventListener("resize", () => {
    updateLandscapePrompt();
    updateGameViewportScale();
  });

  cupCharacter.addEventListener("pointerdown", onCupPointerDown);
  cupCharacter.addEventListener("pointermove", onCupPointerMove);
  cupCharacter.addEventListener("pointerup", onCupPointerUp);
  cupCharacter.addEventListener("pointercancel", onCupPointerUp);

  cupLayer.addEventListener("pointerdown", onCupPointerDown);
  cupLayer.addEventListener("pointermove", onCupPointerMove);
  cupLayer.addEventListener("pointerup", onCupPointerUp);
  cupLayer.addEventListener("pointercancel", onCupPointerUp);

  lidLayer.addEventListener("pointerdown", onLidPointerDown);
  lidLayer.addEventListener("pointermove", onLidPointerMove);
  lidLayer.addEventListener("pointerup", onLidPointerUp);
  lidLayer.addEventListener("pointercancel", onLidPointerUp);

  hairstyleLayer.addEventListener("pointerdown", onHairstylePointerDown);
  hairstyleLayer.addEventListener("pointermove", onHairstylePointerMove);
  hairstyleLayer.addEventListener("pointerup", onHairstylePointerUp);
  hairstyleLayer.addEventListener("pointercancel", onHairstylePointerUp);

  sleeveLayer.addEventListener("pointerdown", onSleevePointerDown);
  sleeveLayer.addEventListener("pointermove", onSleevePointerMove);
  sleeveLayer.addEventListener("pointerup", onSleevePointerUp);
  sleeveLayer.addEventListener("pointercancel", onSleevePointerUp);

  inventoryPanel.addEventListener("pointerdown", onInventoryPointerDown);
  inventoryPanel.addEventListener("click", onInventoryClick);
  inventoryPanel.addEventListener("pointermove", onInventoryPointerMove);
  inventoryPanel.addEventListener("pointerup", onInventoryPointerEnd);
  inventoryPanel.addEventListener("pointercancel", onInventoryPointerEnd);
  musicVolumeInput.addEventListener("input", window.CuppyLandAudio.handleMusicVolumeChange);
  sfxVolumeInput.addEventListener("input", window.CuppyLandAudio.handleSfxVolumeChange);
  musicMuteBtn.addEventListener("click", window.CuppyLandAudio.toggleMusicMute);
  sfxMuteBtn.addEventListener("click", window.CuppyLandAudio.toggleSfxMute);
  worldCanvas.addEventListener("pointerdown", (event) => {
    if (
      !safeClosest(event.target, "#trashCanBtn") &&
      !safeClosest(event.target, ".cup-lid") &&
      !safeClosest(event.target, ".cup-sleeve") &&
      !safeClosest(event.target, ".cup-character")
    ) {
      hideTrashCan();
    }
  });
  trashCanBtn.addEventListener("click", () => {
    removeSelectedObject();
  });
}

function init() {
  window.CuppyLandAudio.loadAudioSettings();
  window.CuppyLandAudio.applyMusicVolume();
  window.CuppyLandAudio.syncAudioControlsUi();
  buildInventoryItems();
  renderCup();
  wireEvents();
  updateLandscapePrompt();
  updateGameViewportScale();
  showScreen("splash");
  loadTintAssets();
}

init();
