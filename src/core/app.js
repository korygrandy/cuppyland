const {
  state,
  fixedViewport,
  palette,
  sleeveTypes,
  sleeveFaceMap,
  sleeveAssetMap,
  sleevePalette,
  colorMap,
  worldClasses,
  worldHeadlineConfig,
  gameplayConfig,
  defaultCupState,
  chocolateMilkSequence,
} = window.CuppyLandGame;

const dom = window.CuppyLandDomElements.createDomElements(document);
const {
  screenEls,
  playBtn,
  backToSplashBtn,
  worldButtons,
  closeWorldBtn,
  inventoryToggleBtn,
  inventoryPanel,
  worldBackground,
  worldBackgroundObjects,
  worldHeadlineOverlay,
  worldViewport,
  closeModal,
  confirmCloseBtn,
  cancelCloseBtn,
  rotatePrompt,
  worldCanvas,
  cupCharacter,
  lidLayer,
  cupLayer,
  hairstyleLayer,
  sleeveLayer,
  faceLayer,
  dragGhost,
  dropZoneLid,
  dropZoneCup,
  dropZoneSleeve,
  musicVolumeInput,
  sfxVolumeInput,
  musicVolumeValue,
  sfxVolumeValue,
  musicMuteBtn,
  sfxMuteBtn,
} = dom;
const { defaultSleeveAsset } = window.CuppyLandGame;

const {
  dragState,
  lidDragState,
  sleeveDragState,
  hairstyleDragState,
  cupDragState,
  friendDragState,
} = window.CuppyLandDragState.createDragStates();
let friendWorldController = null;
let worldCupController = null;
const cupStateStore = window.CuppyLandCupState.createStore({
  gameConfig: window.CuppyLandGame,
  state,
  worldCanvas,
  worldViewport,
});
const worldCoordinateController = window.CuppyLandWorldCoordinateController.createController({
  state,
  worldCanvas,
  worldViewport,
});
const cupPositionController = window.CuppyLandCupPositionController.createController({
  state,
  cupCharacter,
  lidLayer,
  sleeveLayer,
  hairstyleLayer,
  faceLayer,
  getWorldCupList: (worldId = state.activeWorld) => getWorldCupList(worldId),
  defaultCupState,
  gameplayConfig,
});
const worldLayerController = window.CuppyLandWorldLayerController.createController({
  state,
  documentRef: document,
  cupStateStore,
  getWorldCupList: (worldId = state.activeWorld) => getWorldCupList(worldId),
  getWorldFriendList: (worldId = state.activeWorld) => getWorldFriendList(worldId),
  resolveCupStateForElement: (cupElement) => resolveCupStateForElement(cupElement),
});
const interactionHelpers = window.CuppyLandInteraction.createHelpers({
  documentRef: document,
  worldViewport,
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
  cupDragState,
  lidDragState,
  hairstyleDragState,
  sleeveDragState,
  safeClosest,
  trySetPointerCapture,
  isPointerOutsideWorldCanvas,
  setActiveCupInstance,
  bringCupElementToFront,
  resolveCupStateForElement,
  removeCupInstance,
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
  getCupInstanceById,
  getDefaultFriendDropPoint,
  getWorldDropPoint,
  onChocolateMilkFillStart,
  onChocolateMilkFillTick,
  onChocolateMilkFillCancel,
  onChocolateMilkFillComplete,
  onChocolateMilkFillEnd,
});
const sparkleEffectController = window.CuppyLandSparkleEffectController.createController({
  worldCanvas,
  getCupStateById: (cupId) => findCupById(cupId)?.state || null,
  playSfxClip: (clipName) => window.CuppyLandAudio?.playSfxClip?.(clipName),
});
const chocolateMilkFillController = window.CuppyLandChocolateMilkFillController.createController({
  worldCanvas,
  getCupStateById: (cupId) => findCupById(cupId)?.state || null,
  getSequenceConfig: () => getChocolateMilkSequenceConfig(),
  playLoopingSfxClip: (clipName) => window.CuppyLandAudio?.playLoopingSfxClip?.(clipName),
  stopSfxClip: (clipName) => window.CuppyLandAudio?.stopSfxClip?.(clipName),
  onComplete: (cupId) => triggerCupSparkle(cupId),
});
const chocolateMilkSequenceController = window.CuppyLandChocolateMilkSequenceController.createController({
  getWorldFriendList: () => getWorldFriendList(state.activeWorld),
  findFriendById: (friendId) => findFriendById(friendId, state.activeWorld),
  isCupOpen: (cupId) => {
    const cupState = findCupById(cupId, state.activeWorld)?.state;
    return Boolean(cupState && cupState.lidVisible === false);
  },
  getSequenceConfig: () => getChocolateMilkSequenceConfig(),
  syncAttachedFriendPosition: (friendState) => {
    const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendState.id}"]`);
    syncAttachedFriendPosition(friendState, friendElement);
  },
  updateFriendElementAsset: (friendId) => updateFriendElementAsset(friendId),
  onCompleted: (cupId) => triggerCupSparkle(cupId),
});
const worldHeadlineController = window.CuppyLandWorldHeadlineController.createController({
  overlay: worldHeadlineOverlay,
  config: worldHeadlineConfig,
});
worldHeadlineController.syncCardHeadlines();
const backgroundObjectController = window.CuppyLandBackgroundObjectController.createController({
  container: worldBackgroundObjects,
  playSfxClip: (clipName, onEnded) => window.CuppyLandAudio?.playSfxClip?.(clipName, onEnded),
});
const friendMotionController = window.CuppyLandFriendMotionController.createController({
  state,
  worldCanvas,
  findFriendById: (friendId) => findFriendById(friendId, state.activeWorld),
  playSfxClip: (clipName) => window.CuppyLandAudio?.playSfxClip?.(clipName),
});
const friendPointerController = window.CuppyLandFriendPointerController.createController({
  state,
  worldCanvas,
  friendDragState,
  trySetPointerCapture,
  isPointerOutsideWorldCanvas,
  resolveFriendStateForElement,
  getElementDragScale,
  getWorldPointFromClient,
  getCupElementAtPoint,
  zoneForPoint,
  getCupStateById: (cupId) => findCupById(cupId)?.state || null,
  getSequenceConfig: () => getChocolateMilkSequenceConfig(),
  removeFriendInstance,
  stopChocolateMilkSequence: (friendId) => chocolateMilkSequenceController.stop(friendId),
  bringFriendElementToFront,
  triggerTurkeyAnimation: (friendId) => friendWorldController?.triggerTurkeyAnimation?.(friendId),
  startRabbitAnimation: (friendId) => friendMotionController.startRabbitAnimation(friendId),
  stopRabbitAnimation: (friendId) => friendMotionController.stopRabbitAnimation(friendId),
  startTriceratopsAnimation: (friendId) => friendMotionController.startTriceratopsAnimation(friendId),
  stopTriceratopsAnimation: (friendId) => friendMotionController.stopTriceratopsAnimation(friendId),
  startRocketManAnimation: (friendId) => friendMotionController.startRocketManAnimation(friendId),
  stopRocketManAnimation: (friendId) => friendMotionController.stopRocketManAnimation(friendId),
  triggerRocketManAnimation: (friendId) => friendMotionController.triggerRocketManAnimation(friendId),
  playGoldenPuppyWithBone: (friendId) => friendMotionController.playGoldenPuppyWithBone(friendId),
  playGoldenPuppyWithRope: (friendId) => friendMotionController.playGoldenPuppyWithRope(friendId),
  syncBarbieActivationState: (friendState) => friendWorldController?.syncBarbieActivationState?.(friendState),
  updateFriendElementAsset: (friendId) => friendWorldController?.updateFriendElementAsset?.(friendId),
  syncBackgroundObjectActivation: (friendState, friendElement) => backgroundObjectController.syncFriend(friendState, friendElement),
  syncMerryGoRoundActivations: () => friendWorldController?.syncMerryGoRoundActivations?.(),
  syncDoghouseActivations: (commitAttachment, draggedFriendState) => (
    friendWorldController?.syncDoghouseActivations?.(commitAttachment, draggedFriendState)
  ),
  cancelPuppyExtraction: (puppyState) => friendWorldController?.cancelPuppyExtraction?.(puppyState),
  pauseFishbowlSequence: (friendId) => friendWorldController?.pauseFishbowlSequence?.(friendId),
  resumeFishbowlSequence: (friendId) => friendWorldController?.startFishbowlSequence?.(friendId),
  toggleFishbowlSequence: (friendId) => friendWorldController?.toggleFishbowlSequence?.(friendId),
  onChocolateMilkFillStart,
  onChocolateMilkFillTick,
  onChocolateMilkFillCancel,
  onChocolateMilkFillComplete,
  onChocolateMilkFillEnd,
});
friendWorldController = window.CuppyLandWorldFriendController.createController({
  state,
  worldCanvas,
  getWorldFriendList: (worldId = state.activeWorld) => getWorldFriendList(worldId),
  findCupById: (cupId) => findCupById(cupId, state.activeWorld),
  getSequenceConfig: () => getChocolateMilkSequenceConfig(),
  getFriendAssetMap: () => window.CuppyLandGame.friendAssetMap,
  onFriendPointerDown: friendPointerController.onPointerDown,
  onFriendPointerMove: friendPointerController.onPointerMove,
  onFriendPointerUp: friendPointerController.onPointerUp,
  playSfxClip: (clipName) => window.CuppyLandAudio?.playSfxClip?.(clipName),
  stopChocolateMilkSequence: (friendId) => chocolateMilkSequenceController.stop(friendId),
  onRenderWorldCups: () => renderWorldCups(),
  onRefreshChocolateMilkSequences: () => refreshChocolateMilkSequences(),
  onFlowerPlaced: (friendState, friendElement) => sparkleEffectController.triggerFriendSparkle(friendState, friendElement),
  motionController: friendMotionController,
  syncBackgroundObjectActivation: (friendState, friendElement) => backgroundObjectController.syncFriend(friendState, friendElement),
  removeBackgroundObjectActivation: (friendId) => backgroundObjectController.removeFriend(friendId),
  getWorldPointFromClient,
  onDoghousePointerDown: (doghouseState, event) => {
    const puppyState = friendWorldController.extractPuppyFromDoghouse(doghouseState, event);
    if (!puppyState) {
      return;
    }
    window.CuppyLandAudio?.playSfxClip?.("goldenPuppyActivated");
    requestAnimationFrame(() => {
      const puppyElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${puppyState.id}"]`);
      if (puppyElement) {
        friendPointerController.onPointerDown(event, { friendElement: puppyElement, friendState: puppyState });
      }
    });
  },
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

function findCupById(cupId, worldId = state.activeWorld) {
  return getWorldCupList(worldId).find((cup) => cup.id === cupId) || null;
}

function findFriendById(friendId, worldId = state.activeWorld) {
  return getWorldFriendList(worldId).find((friend) => friend.id === friendId) || null;
}

function getChocolateMilkSequenceConfig() {
  return {
    durationMs: chocolateMilkSequence?.durationMs ?? 5000,
    frameIntervalMs: chocolateMilkSequence?.frameIntervalMs ?? 320,
    frame2Asset: chocolateMilkSequence?.frameAssets?.frame2 || "./assets/chocolate-milk-sequence2.png",
    frame3Asset: chocolateMilkSequence?.frameAssets?.frame3 || "./assets/chocolate-milk-sequence3.png",
    preview: {
      width: chocolateMilkSequence?.preview?.width ?? 188,
      height: chocolateMilkSequence?.preview?.height ?? 188,
      offsetX: chocolateMilkSequence?.preview?.offsetX ?? 132,
      offsetY: chocolateMilkSequence?.preview?.offsetY ?? 18,
      rotationDeg: chocolateMilkSequence?.preview?.rotationDeg ?? -8,
      opacity: chocolateMilkSequence?.preview?.opacity ?? 0.96,
    },
  };
}

function clearChocolateMilkDragFillPreview() {
  chocolateMilkFillController.clearPreview();
}

function onChocolateMilkFillStart(cupId) {
  chocolateMilkFillController.onFillStart(cupId);
}

function onChocolateMilkFillTick(cupId) {
  chocolateMilkFillController.onFillTick(cupId);
}

function onChocolateMilkFillCancel() {
  chocolateMilkFillController.onFillCancel();
}

function onChocolateMilkFillComplete(cupId) {
  chocolateMilkFillController.onFillComplete(cupId);
}

function onChocolateMilkFillEnd() {
  chocolateMilkFillController.onFillEnd();
}

function updateFriendElementAsset(friendId) {
  friendWorldController?.updateFriendElementAsset(friendId);
}

function triggerCupSparkle(cupId) {
  sparkleEffectController.triggerCupSparkle(cupId);
}

function refreshChocolateMilkSequences() {
  chocolateMilkSequenceController.refresh();
}

function stopAllChocolateMilkSequences() {
  chocolateMilkSequenceController.stopAll();
}

function hideWorldHeadlineOverlay() {
  worldHeadlineController.hide();
}

function showWorldHeadlineOverlay(worldId) {
  worldHeadlineController.show(worldId);
}

function ensureCupLayerOrder(cupState, fallbackOrder = 1) {
  return worldLayerController.ensureCupLayerOrder(cupState, fallbackOrder);
}

function getWorldMaxZIndex(worldId = state.activeWorld) {
  return worldLayerController.getWorldMaxZIndex(worldId);
}

function getNextWorldZIndex(worldId = state.activeWorld) {
  return worldLayerController.getNextWorldZIndex(worldId);
}

function bringCupElementToFront(cupElement) {
  worldLayerController.bringCupElementToFront(cupElement);
}

function bringFriendElementToFront(friendElement, friendState) {
  worldLayerController.bringFriendElementToFront(friendElement, friendState);
}

function syncCupSelectionVisualState() {
  worldLayerController.syncCupSelectionVisualState();
}

function setActiveCupInstance(cupId) {
  worldLayerController.setActiveCupInstance(cupId);
}

function getActiveCupInstance() {
  return worldLayerController.getActiveCupInstance();
}

function getCupInstanceById(cupId, worldId = state.activeWorld) {
  return worldLayerController.getCupInstanceById(cupId, worldId);
}

function syncWorldCupSelection() {
  worldLayerController.syncWorldCupSelection();
}

function getElementDragScale(element) {
  return worldCoordinateController.getElementDragScale(element);
}

function getWorldPointFromClient(clientX, clientY) {
  return worldCoordinateController.getWorldPointFromClient(clientX, clientY);
}

function getWorldDropPoint(clientX, clientY) {
  return worldCoordinateController.getWorldDropPoint(clientX, clientY);
}

function getDefaultFriendDropPoint() {
  return worldCoordinateController.getDefaultFriendDropPoint();
}

function resolveFriendStateForElement(friendElement) {
  return friendWorldController?.resolveFriendStateForElement(friendElement) || null;
}

function syncAttachedFriendPosition(friendState, friendElement = null) {
  friendWorldController?.syncAttachedFriendPosition(friendState, friendElement);
}

function removeFriendInstance(friendId, options = {}) {
  return friendWorldController?.removeFriendInstance(friendId, options) || false;
}

function renderWorldFriends() {
  friendWorldController?.renderWorldFriends();
}

function renderWorldCups() {
  worldCupController?.renderWorldCups();
}

const screenWorldController = window.CuppyLandScreenWorldController.createController({
  state,
  screenEls,
  worldBackground,
  worldCanvas,
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
  return cupPositionController.resolveCupStateForElement(cupElement);
}

function syncCupWorldPosition(cupElement = cupCharacter) {
  cupPositionController.syncCupWorldPosition(cupElement);
}

function syncLidPosition(cupElement = cupCharacter) {
  cupPositionController.syncLidPosition(cupElement);
}

function syncSleevePosition(cupElement = cupCharacter) {
  cupPositionController.syncSleevePosition(cupElement);
}

function syncFacePosition(cupElement = cupCharacter) {
  cupPositionController.syncFacePosition(cupElement);
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

async function loadTintAssets() {
  await renderController.loadTintAssets();
}

worldCupController = window.CuppyLandWorldCupController.createController({
  state,
  worldCanvas,
  cupCharacter,
  getWorldCupList: (worldId = state.activeWorld) => getWorldCupList(worldId),
  ensureCupLayerOrder,
  renderCupInstance,
  renderWorldFriends,
  syncWorldCupSelection,
  syncCupSelectionVisualState,
  cupPointerHandlers: {
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
  },
});

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
  backgroundObjectController.render(worldId);
  screenWorldController.openWorld(worldId);
  showWorldHeadlineOverlay(worldId);
  if (worldId === "playground") {
    window.CuppyLandAudio?.playSfxClip?.("playgroundIntroFx");
  } else if (worldId === "olivia-room") {
    window.CuppyLandAudio?.playSfxClip?.("myNameIsOlivia");
  }
}

function closeWorld() {
  window.CuppyLandAudio?.stopSfxClip?.("milkPour");
  hideWorldHeadlineOverlay();
  clearChocolateMilkDragFillPreview();
  stopAllChocolateMilkSequences();
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
  defaultCupState,
  getNextWorldZIndex,
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

function removeCupInstance(cupId) {
  gameRulesController.removeCupInstance(cupId);
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
  },
});

bootstrapController.init();
