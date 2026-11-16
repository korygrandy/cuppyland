const { state, fixedViewport, palette, sleeveTypes, sleeveFaceMap, sleeveAssetMap, sleevePalette, colorMap, worldClasses, gameplayConfig, defaultCupState } = window.CuppyLandGame;

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
const friendDragState = {
  active: false,
  pointerId: null,
  friendId: null,
  pointerOffsetX: 0,
  pointerOffsetY: 0,
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
  gameplayConfig,
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
  gameplayConfig,
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
  gameplayConfig,
  defaultCupState,
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
  getDefaultFriendDropPoint,
  getWorldDropPoint,
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

function getWorldFriendList(worldId = state.activeWorld) {
  if (!worldId || !state.worlds?.[worldId]) {
    return [];
  }
  if (!Array.isArray(state.worlds[worldId].friends)) {
    state.worlds[worldId].friends = [];
  }
  return state.worlds[worldId].friends;
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

function getElementDragScale(element) {
  if (!element) {
    return 1;
  }

  const rect = element.getBoundingClientRect();
  const baseWidth = element.offsetWidth || rect.width || 1;
  const derivedScale = rect.width / baseWidth;
  if (!Number.isFinite(derivedScale) || derivedScale <= 0) {
    return 1;
  }
  return derivedScale;
}

function getWorldPointFromClient(clientX, clientY) {
  const bounds = worldCanvas.getBoundingClientRect();
  const widthScale = bounds.width > 0 ? worldCanvas.offsetWidth / bounds.width : 1;
  const heightScale = bounds.height > 0 ? worldCanvas.offsetHeight / bounds.height : 1;
  return {
    worldX: (clientX - bounds.left) * widthScale,
    worldY: (clientY - bounds.top) * heightScale,
  };
}

function getWorldDropPoint(clientX, clientY) {
  const { worldX, worldY } = getWorldPointFromClient(clientX, clientY);

  return {
    worldX: Math.max(0, Math.min(worldCanvas.offsetWidth - 132, worldX - 66)),
    worldY: Math.max(0, Math.min(worldCanvas.offsetHeight - 132, worldY - 66)),
  };
}

function getDefaultFriendDropPoint() {
  const centerClientX = worldViewport.getBoundingClientRect().left + worldViewport.clientWidth / 2;
  const centerClientY = worldViewport.getBoundingClientRect().top + worldViewport.clientHeight / 2;
  return getWorldDropPoint(centerClientX, centerClientY);
}

function resolveFriendStateForElement(friendElement) {
  const friendId = friendElement?.dataset?.friendId;
  if (!friendId) {
    return null;
  }
  const worldFriends = getWorldFriendList(state.activeWorld);
  return worldFriends.find((friend) => friend.id === friendId) || null;
}

function removeFriendInstance(friendId) {
  if (!state.activeWorld || !friendId) {
    return;
  }
  const worldFriends = getWorldFriendList(state.activeWorld);
  const friendIndex = worldFriends.findIndex((friend) => friend.id === friendId);
  if (friendIndex < 0) {
    return;
  }
  worldFriends.splice(friendIndex, 1);
  renderWorldCups();
}

function onFriendPointerDown(event) {
  if (state.currentScreen !== "world") {
    return;
  }

  const friendElement = event.currentTarget.closest(".friend-character");
  const friendState = resolveFriendStateForElement(friendElement);
  if (!friendElement || !friendState) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const pointerScale = getElementDragScale(friendElement);
  const localPointerX = (event.clientX - friendElement.getBoundingClientRect().left) / pointerScale;
  const localPointerY = (event.clientY - friendElement.getBoundingClientRect().top) / pointerScale;
  friendDragState.active = true;
  friendDragState.pointerId = event.pointerId;
  friendDragState.friendId = friendState.id;
  friendDragState.pointerOffsetX = localPointerX;
  friendDragState.pointerOffsetY = localPointerY;
  trySetPointerCapture(friendElement, event.pointerId);
}

function onFriendPointerMove(event) {
  if (!friendDragState.active || event.pointerId !== friendDragState.pointerId) {
    return;
  }

  if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
    const friendId = friendDragState.friendId;
    friendDragState.active = false;
    friendDragState.pointerId = null;
    friendDragState.friendId = null;
    removeFriendInstance(friendId);
    return;
  }

  const friendElement = event.currentTarget.closest(".friend-character");
  const friendState = resolveFriendStateForElement(friendElement);
  if (!friendElement || !friendState) {
    return;
  }

  const { worldX, worldY } = getWorldPointFromClient(event.clientX, event.clientY);
  const nextX = worldX - friendDragState.pointerOffsetX;
  const nextY = worldY - friendDragState.pointerOffsetY;
  friendState.worldX = Math.max(0, Math.min(worldCanvas.offsetWidth - friendElement.offsetWidth, nextX));
  friendState.worldY = Math.max(0, Math.min(worldCanvas.offsetHeight - friendElement.offsetHeight, nextY));
  friendElement.style.left = `${friendState.worldX}px`;
  friendElement.style.top = `${friendState.worldY}px`;
}

function onFriendPointerUp(event) {
  if (!friendDragState.active || event.pointerId !== friendDragState.pointerId) {
    return;
  }

  if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
    removeFriendInstance(friendDragState.friendId);
  }

  friendDragState.active = false;
  friendDragState.pointerId = null;
  friendDragState.friendId = null;
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

  template.addEventListener("pointerdown", cupPointerController.onCupPointerDown);
  template.addEventListener("pointermove", cupPointerController.onCupPointerMove);
  template.addEventListener("pointerup", cupPointerController.onCupPointerUp);
  template.addEventListener("pointercancel", cupPointerController.onCupPointerUp);

  template.querySelector(".cup-base")?.addEventListener("pointerdown", cupPointerController.onCupPointerDown);
  template.querySelector(".cup-base")?.addEventListener("pointermove", cupPointerController.onCupPointerMove);
  template.querySelector(".cup-base")?.addEventListener("pointerup", cupPointerController.onCupPointerUp);
  template.querySelector(".cup-base")?.addEventListener("pointercancel", cupPointerController.onCupPointerUp);

  template.querySelector(".cup-lid")?.addEventListener("pointerdown", cupPointerController.onLidPointerDown);
  template.querySelector(".cup-lid")?.addEventListener("pointermove", cupPointerController.onLidPointerMove);
  template.querySelector(".cup-lid")?.addEventListener("pointerup", cupPointerController.onLidPointerUp);
  template.querySelector(".cup-lid")?.addEventListener("pointercancel", cupPointerController.onLidPointerUp);

  template.querySelector(".cup-sleeve")?.addEventListener("pointerdown", cupPointerController.onSleevePointerDown);
  template.querySelector(".cup-sleeve")?.addEventListener("pointermove", cupPointerController.onSleevePointerMove);
  template.querySelector(".cup-sleeve")?.addEventListener("pointerup", cupPointerController.onSleevePointerUp);
  template.querySelector(".cup-sleeve")?.addEventListener("pointercancel", cupPointerController.onSleevePointerUp);

  template.querySelector(".cup-hairstyle")?.addEventListener("pointerdown", cupPointerController.onHairstylePointerDown);
  template.querySelector(".cup-hairstyle")?.addEventListener("pointermove", cupPointerController.onHairstylePointerMove);
  template.querySelector(".cup-hairstyle")?.addEventListener("pointerup", cupPointerController.onHairstylePointerUp);
  template.querySelector(".cup-hairstyle")?.addEventListener("pointercancel", cupPointerController.onHairstylePointerUp);

  return template;
}

function createFriendElement(friendState) {
  const friendElement = document.createElement("div");
  friendElement.className = "friend-character";
  friendElement.dataset.friendId = friendState.id;
  friendElement.style.left = `${friendState.worldX || 0}px`;
  friendElement.style.top = `${friendState.worldY || 0}px`;
  friendElement.style.zIndex = String(Number.isFinite(friendState.zIndex) ? friendState.zIndex : 90);

  const art = document.createElement("span");
  art.className = "friend-character-art";
  art.style.backgroundImage = `url("${window.CuppyLandGame.friendAssetMap?.[friendState.type] || ""}")`;
  friendElement.appendChild(art);
  friendElement.addEventListener("pointerdown", onFriendPointerDown);
  friendElement.addEventListener("pointermove", onFriendPointerMove);
  friendElement.addEventListener("pointerup", onFriendPointerUp);
  friendElement.addEventListener("pointercancel", onFriendPointerUp);
  return friendElement;
}

function renderWorldFriends() {
  worldCanvas.querySelectorAll(".friend-character").forEach((node) => node.remove());
  const worldFriends = getWorldFriendList(state.activeWorld);
  if (!worldFriends.length) {
    return;
  }

  [...worldFriends]
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
    .forEach((friendState) => {
      worldCanvas.appendChild(createFriendElement(friendState));
    });
}

function renderWorldCups() {
  worldCanvas.querySelectorAll(".cup-character").forEach((node) => node.remove());
  const worldCups = getWorldCupList(state.activeWorld);
  if (worldCups.length) {
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
  renderWorldFriends();
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
  if (worldId === "olivia-room") {
    window.CuppyLandAudio?.playSfxClip?.("myNameIsOlivia");
  }
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

const gameRulesController = window.CuppyLandGameRulesController.createController({
  state,
  trashState,
  cupCharacter,
  lidLayer,
  sleeveLayer,
  faceLayer,
  hairstyleLayer,
  cupLayer,
  cupStateStore,
  getWorldCupList,
  getWorldFriendList,
  getActiveCupInstance,
  setActiveCupInstance,
  renderWorldCups,
  hideTrashCan,
  defaultCupState,
});

function addCupToWorld() {
  return gameRulesController.addCupToWorld();
}

function applyDrop(itemType, value, targetZone, targetCupId = state.activeCupId, dropPoint = null) {
  return gameRulesController.applyDrop(itemType, value, targetZone, targetCupId, dropPoint);
}

function applyInventorySelection(itemType, value, targetCupId = state.activeCupId, dropPoint = null) {
  return gameRulesController.applyInventorySelection(itemType, value, targetCupId, dropPoint);
}

function showInvalidFeedback() {
  gameRulesController.showInvalidFeedback();
}

function showTrashCan(target) {
  showTrashCanBase(target, trashState);
}

function hideTrashCan() {
  hideTrashCanBase(trashState);
}

function removeCupInstance(cupId) {
  gameRulesController.removeCupInstance(cupId);
}

function removeSelectedObject() {
  gameRulesController.removeSelectedObject();
}

const bootstrapController = window.CuppyLandBootstrapController.createController({
  documentRef: document,
  windowRef: window,
  audio: window.CuppyLandAudio,
  ui: {
    playBtn,
    backToSplashBtn,
    worldButtons,
    inventoryToggleBtn,
    closeWorldBtn,
    confirmCloseBtn,
    cancelCloseBtn,
    cupCharacter,
    cupLayer,
    lidLayer,
    hairstyleLayer,
    sleeveLayer,
    inventoryPanel,
    musicVolumeInput,
    sfxVolumeInput,
    musicMuteBtn,
    sfxMuteBtn,
    worldCanvas,
    trashCanBtn,
  },
  handlers: {
    onCupPointerDown: cupPointerController.onCupPointerDown,
    onCupPointerMove: cupPointerController.onCupPointerMove,
    onCupPointerUp: cupPointerController.onCupPointerUp,
    onLidPointerDown: cupPointerController.onLidPointerDown,
    onLidPointerMove: cupPointerController.onLidPointerMove,
    onLidPointerUp: cupPointerController.onLidPointerUp,
    onHairstylePointerDown: cupPointerController.onHairstylePointerDown,
    onHairstylePointerMove: cupPointerController.onHairstylePointerMove,
    onHairstylePointerUp: cupPointerController.onHairstylePointerUp,
    onSleevePointerDown: cupPointerController.onSleevePointerDown,
    onSleevePointerMove: cupPointerController.onSleevePointerMove,
    onSleevePointerUp: cupPointerController.onSleevePointerUp,
    onInventoryPointerDown: inventoryInteractionController.onPointerDown,
    onInventoryClick: inventoryInteractionController.onClick,
    onInventoryPointerMove: inventoryInteractionController.onPointerMove,
    onInventoryPointerEnd: inventoryInteractionController.onPointerEnd,
  },
  actions: {
    showScreen,
    openWorld,
    closeWorld,
    toggleInventory,
    showCloseModal,
    hideCloseModal,
    updateLandscapePrompt,
    updateGameViewportScale,
    buildInventoryItems,
    renderCup,
    loadTintAssets,
    safeClosest,
    hideTrashCan,
    removeSelectedObject,
  },
});

bootstrapController.init();
