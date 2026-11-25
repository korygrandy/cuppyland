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
const timerLifecycleController = window.CuppyLandTimerLifecycle.createController();

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
const cupPartDragController = window.CuppyLandCupPartDragController.createController({
  worldCanvas,
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
  getWorldPointFromClient,
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
  cupPartDragController,
  findFriendById: (friendId) => findFriendById(friendId, state.activeWorld),
  refreshChocolateMilkSequences: () => refreshChocolateMilkSequences(),
  startChocolateMilkSpill: (friendId, cupId) => chocolateMilkSequenceController.startForCup(friendId, cupId),
  ensureChocolateMilkForCup: (cupId) => ensureChocolateMilkForCup(cupId),
  removeFriendInstance,
  syncTrampolineActivation: (cupState, cupElement) => {
    backgroundObjectController?.syncCup?.(cupState, cupElement);
  },
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
  refreshChocolateMilkSequences: () => refreshChocolateMilkSequences(),
  onChocolateMilkFillEnd,
  worldCanvas,
  onDirectObjectHairstyle: (friendId, itemType, value) => {
    const friendState = findFriendById(friendId, state.activeWorld);
    if (!friendState) {
      return false;
    }
    const profile = window.CuppyLandObjectOverlayRegistry?.getProfile(friendState);
    if (!profile) {
      return false;
    }
    friendState.hairstyle = value;
    friendState.hairstyleVisible = true;
    friendState.hairstyleDetached = false;
    friendState.hairstyleOffsetX = profile.offsetX;
    friendState.hairstyleOffsetY = profile.offsetY;
    updateFriendElementAsset(friendId);
    return true;
  },
  onDirectBabyMilkPart: (babyId, itemType, value) => {
    const babyState = findFriendById(babyId, state.activeWorld);
    if (!babyState || babyState.type !== "baby-mr-chocolate-milk") {
      return false;
    }
    if (itemType === "lid") {
      babyState.lidColor = value;
    } else if (itemType === "cup") {
      babyState.cupColor = value;
    } else if (itemType === "sleeve") {
      babyState.sleeve = value;
      babyState.sleeveVisible = true;
    } else if (itemType === "expression") {
      babyState.expression = value;
      babyState.faceVisible = true;
    } else if (itemType === "hairstyle") {
      babyState.hairstyle = value;
      babyState.hairstyleVisible = true;
      babyState.hairstyleDetached = false;
      babyState.hairstyleOffsetX = 17;
      babyState.hairstyleOffsetY = -14;
    } else {
      return false;
    }
    updateFriendElementAsset(babyId);
    return true;
  },
  onDirectObjectHairstyle: (friendId, itemType, value) => {
    const friendState = findFriendById(friendId, state.activeWorld);
    if (!friendState) {
      return false;
    }
    const profile = window.CuppyLandObjectOverlayRegistry?.getProfile(friendState);
    if (!profile) {
      return false;
    }
    friendState.hairstyle = value;
    friendState.hairstyleVisible = true;
    friendState.hairstyleDetached = false;
    friendState.hairstyleOffsetX = profile?.offsetX ?? 0;
    friendState.hairstyleOffsetY = profile?.offsetY ?? -57;
    updateFriendElementAsset(friendId);
    return true;
  },
  onDirectPuppyToy: (toyType, puppyId) => {
    if (toyType === "dogbone") {
      return puppySequenceController?.playWithBone(puppyId) || false;
    }
    if (toyType === "rope-dogtoy") {
      return puppySequenceController?.playWithRope(puppyId) || false;
    }
    if (toyType === "dogtoy-ball") {
      return puppySequenceController?.playWithBall(puppyId) || false;
    }
    if (toyType === "squirrel") {
      return puppySequenceController?.playWithSquirrel(puppyId) || false;
    }
    return false;
  },
  onDirectDogFood: (bowlId) => {
    const bowlState = findFriendById(bowlId, state.activeWorld);
    if (!bowlState || (bowlState.type !== "dogbowl" && bowlState.type !== "dogbowl-with-food")) {
      return false;
    }
    bowlState.type = "dogbowl-with-food";
    bowlState.hasFood = true;
    updateFriendElementAsset(bowlId);
    window.CuppyLandAudio?.playSfxClip?.("dogfoodPour");
    return true;
  },
  onDirectWaterSource: (bowlId, sourceType) => {
    const bowlState = findFriendById(bowlId, state.activeWorld);
    if (!bowlState || bowlState.type !== "water-bowl") {
      return false;
    }
    bowlState.full = true;
    bowlState.type = "water-bowl";
    syncBackgroundObjectActivation(bowlState, worldCanvas.querySelector(`.friend-character[data-friend-id="${bowlId}"]`));
    updateFriendElementAsset(bowlId);
    window.CuppyLandAudio?.playSfxClip?.("drinkingFountainActivated");
    if (sourceType === "fishbowl") {
      window.CuppyLandAudio?.playSfxClip?.("fishbowlActivated");
    }
    return true;
  },
  onDirectPuppyToBed: (bedId, puppyId = null) => {
    const bedState = findFriendById(bedId, state.activeWorld);
    if (!bedState || bedState.type !== "dogbed") {
      return false;
    }
    const puppyState = puppyId ? findFriendById(puppyId, state.activeWorld) : null;
    bedState.activated = true;
    bedState.attachedPuppyId = null;
    bedState.bedPuppySnapshot = {
      hasBall: Boolean(puppyState?.hasBall),
      hasRope: Boolean(puppyState?.hasRope),
      hasBone: Boolean(puppyState?.hasBone),
      hasSquirrel: Boolean(puppyState?.hasSquirrel),
      hasCollar: Boolean(puppyState?.hasCollar),
      hasLeash: Boolean(puppyState?.hasLeash),
    };
    if (puppyState) {
      removeFriendInstance(puppyState.id, { playRemovedSfx: false });
    }
    if (bedState.sleepTimer) {
      clearTimeout(bedState.sleepTimer);
    }
    updateFriendElementAsset(bedId);
    bedState.sleepTimer = setTimeout(() => {
      bedState.sleeping = true;
      updateFriendElementAsset(bedId);
    }, 4000);
    return true;
  },
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
  onComplete: (cupId, characterType) => {
    triggerCupSparkle(cupId);
    ensureChocolateMilkForCup(cupId, characterType);
  },
});
const chocolateMilkSequenceController = window.CuppyLandChocolateMilkSequenceController.createController({
  getWorldFriendList: () => getWorldFriendList(state.activeWorld),
  findFriendById: (friendId) => findFriendById(friendId, state.activeWorld),
  isCupOpen: (cupId) => {
    const cupState = findCupById(cupId, state.activeWorld)?.state;
    return Boolean(cupState && (cupState.lidVisible === false || cupState.lidDetached === true));
  },
  getSequenceConfig: () => getChocolateMilkSequenceConfig(),
  syncAttachedFriendPosition: (friendState) => {
    const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendState.id}"]`);
    syncAttachedFriendPosition(friendState, friendElement);
  },
  updateFriendElementAsset: (friendId) => updateFriendElementAsset(friendId),
  getCupElementById: (cupId) => worldCanvas.querySelector(`.cup-character[data-cup-id="${cupId}"]`),
  removeFriendInstance,
  onCompleted: (cupId) => triggerCupSparkle(cupId),
});
const worldHeadlineController = window.CuppyLandWorldHeadlineController.createController({
  overlay: worldHeadlineOverlay,
  config: worldHeadlineConfig,
});
worldHeadlineController.syncCardHeadlines();
const backgroundObjectController = window.CuppyLandBackgroundObjectController.createController({
  container: worldBackgroundObjects,
  worldCanvas,
  playSfxClip: (clipName, onEnded) => window.CuppyLandAudio?.playSfxClip?.(clipName, onEnded),
});
const tubeSlideController = window.CuppyLandTubeSlideController.createController({
  container: worldBackgroundObjects,
  worldCanvas,
  findFriendById: (friendId) => findFriendById(friendId, state.activeWorld),
});
const friendMotionController = window.CuppyLandFriendMotionController.createController({
  state,
  worldCanvas,
  findFriendById: (friendId) => findFriendById(friendId, state.activeWorld),
  playSfxClip: (clipName) => window.CuppyLandAudio?.playSfxClip?.(clipName),
});
const puppySequenceController = window.CuppyLandPuppySequenceController.createController({
  state,
  worldCanvas,
  findFriendById: (friendId) => findFriendById(friendId, state.activeWorld),
  playSfxClip: (clipName) => window.CuppyLandAudio?.playSfxClip?.(clipName),
  getFriendAssetMap: () => window.CuppyLandGame.friendAssetMap,
  timerLifecycle: timerLifecycleController,
  removeFriendInstance,
});
const puppyRequestController = window.CuppyLandPuppyRequestController.createController({
  timerLifecycle: timerLifecycleController,
  worldCanvas,
  triggerCelebration: (puppyState, puppyElement) => {
    sparkleEffectController.triggerFriendSparkle(puppyState, puppyElement);
  },
});
const friendProximityController = window.CuppyLandFriendProximityController.createController({
  state,
  worldCanvas,
  resolveFriendStateForElement,
  removeFriendInstance,
  playGoldenPuppyWithBall: (friendId, options) => puppySequenceController.playWithBall(friendId, options),
  playLoopingSfxClip: (clipName) => window.CuppyLandAudio?.playLoopingSfxClip?.(clipName),
  stopSfxClip: (clipName) => window.CuppyLandAudio?.stopSfxClip?.(clipName),
  getFriendAssetMap: () => window.CuppyLandGame.friendAssetMap,
  syncFriendActivation: (friendState, friendElement) => backgroundObjectController.syncFriend(friendState, friendElement),
});
const friendReleaseController = window.CuppyLandFriendReleaseController.createController({
  worldCanvas,
  resolveFriendStateForElement,
  removeFriendInstance,
  playGoldenPuppyWithBone: (friendId) => puppySequenceController.playWithBone(friendId),
  playGoldenPuppyWithRope: (friendId) => puppySequenceController.playWithRope(friendId),
  playGoldenPuppyWithLeash: (friendId) => puppySequenceController.playWithLeash(friendId),
  playGoldenPuppyWithBall: (friendId, options) => puppySequenceController.playWithBall(friendId, options),
  playGoldenPuppyWithSquirrel: (friendId) => puppySequenceController.playWithSquirrel(friendId),
  startRabbitAnimation: (friendId) => friendMotionController.startRabbitAnimation(friendId),
  startTriceratopsAnimation: (friendId) => friendMotionController.startTriceratopsAnimation(friendId),
  startRocketManAnimation: (friendId) => friendMotionController.startRocketManAnimation(friendId),
  startPizzaManAnimation: (friendId) => friendMotionController.startPizzaManAnimation(friendId),
});
const petAssetController = window.CuppyLandPetAssetController.createController({
  state,
  getFriendAssetMap: () => window.CuppyLandGame.friendAssetMap,
  getWorldFriendList,
});
const doghouseController = window.CuppyLandDoghouseController.createController({
  state,
  worldCanvas,
  getWorldFriendList,
  getWorldPointFromClient,
  onRenderWorldCups: () => renderWorldCups(),
  updateFriendElementAsset: (friendId) => friendWorldController?.updateFriendElementAsset?.(friendId),
  triggerFriendCelebration: (friendState, friendElement) => {
    sparkleEffectController.triggerFriendSparkle(friendState, friendElement);
  },
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
  startPizzaManAnimation: (friendId) => friendMotionController.startPizzaManAnimation(friendId),
  stopPizzaManAnimation: (friendId) => friendMotionController.stopPizzaManAnimation(friendId),
  startRocketManAnimation: (friendId) => friendMotionController.startRocketManAnimation(friendId),
  stopRocketManAnimation: (friendId) => friendMotionController.stopRocketManAnimation(friendId),
  triggerRocketManAnimation: (friendId) => friendMotionController.triggerRocketManAnimation(friendId),
  triggerBarbieActivation: (friendId) => friendWorldController?.triggerBarbieActivation?.(friendId),
  playGoldenPuppyWithBone: (friendId) => puppySequenceController.playWithBone(friendId),
  playGoldenPuppyWithRope: (friendId) => puppySequenceController.playWithRope(friendId),
  playGoldenPuppyWithLeash: (friendId) => puppySequenceController.playWithLeash(friendId),
  playGoldenPuppyWithBall: (friendId, options) => puppySequenceController.playWithBall(friendId, options),
  syncBarbieActivationState: (friendState) => friendWorldController?.syncBarbieActivationState?.(friendState),
  updateFriendElementAsset: (friendId) => friendWorldController?.updateFriendElementAsset?.(friendId),
  syncBackgroundObjectActivation: (friendState, friendElement) => {
    backgroundObjectController.syncFriend(friendState, friendElement);
    tubeSlideController.syncFriend(friendState, friendElement);
  },
  syncMerryGoRoundActivations: () => friendWorldController?.syncMerryGoRoundActivations?.(),
  syncDoghouseActivations: (commitAttachment, draggedFriendState) => (
    friendWorldController?.syncDoghouseActivations?.(commitAttachment, draggedFriendState)
  ),
  syncBallAvoidance: (friendElement, friendState) => friendProximityController.syncBallAvoidance(friendElement, friendState),
  syncSquirrelProximity: (friendElement, friendState) => friendProximityController.syncSquirrelAvoidance(friendElement, friendState),
  resetSquirrelProximity: () => friendProximityController.resetSquirrelRunningSfx(),
  cancelPuppyExtraction: (puppyState) => friendWorldController?.cancelPuppyExtraction?.(puppyState),
  pauseFishbowlSequence: (friendId) => friendWorldController?.pauseFishbowlSequence?.(friendId),
  resumeFishbowlSequence: (friendId) => friendWorldController?.startFishbowlSequence?.(friendId),
  toggleFishbowlSequence: (friendId) => friendWorldController?.toggleFishbowlSequence?.(friendId),
  onDirectPuppyToBed: (bedId, puppyId) => {
    const bedState = findFriendById(bedId, state.activeWorld);
    const puppyState = puppyId ? findFriendById(puppyId, state.activeWorld) : null;
    if (!bedState || bedState.type !== "dogbed") {
      return false;
    }
    bedState.activated = true;
    bedState.attachedPuppyId = null;
    bedState.bedPuppySnapshot = {
      hasBall: Boolean(puppyState?.hasBall),
      hasRope: Boolean(puppyState?.hasRope),
      hasBone: Boolean(puppyState?.hasBone),
      hasSquirrel: Boolean(puppyState?.hasSquirrel),
      hasCollar: Boolean(puppyState?.hasCollar),
      hasLeash: Boolean(puppyState?.hasLeash),
    };
    if (bedState.sleepTimer) {
      clearTimeout(bedState.sleepTimer);
    }
    if (puppyState) {
      removeFriendInstance(puppyState.id, { playRemovedSfx: false });
    }
    updateFriendElementAsset(bedId);
    bedState.sleepTimer = setTimeout(() => {
      bedState.sleeping = true;
      updateFriendElementAsset(bedId);
    }, 4000);
    return true;
  },
  onDirectWaterSource: (bowlId, sourceType) => {
    const bowlState = findFriendById(bowlId, state.activeWorld);
    if (!bowlState || bowlState.type !== "water-bowl") {
      return false;
    }
    bowlState.full = true;
    updateFriendElementAsset(bowlId);
    syncBackgroundObjectActivation(bowlState, worldCanvas.querySelector(`.friend-character[data-friend-id="${bowlId}"]`));
    window.CuppyLandAudio?.playSfxClip?.("drinkingFountainActivated");
    if (sourceType === "fishbowl") {
      window.CuppyLandAudio?.playSfxClip?.("fishbowlActivated");
    }
    return true;
  },
  onChocolateMilkFillStart,
  onChocolateMilkFillTick,
  onChocolateMilkFillCancel,
  onChocolateMilkFillComplete,
  onChocolateMilkFillEnd,
  refreshChocolateMilkSequences: () => refreshChocolateMilkSequences(),
  completePuppyRequest: (puppyState, requestType) => puppyRequestController.complete(puppyState, requestType),
  onDirectPuppyToBed: (bedId) => {
    const bedState = findFriendById(bedId, state.activeWorld);
    if (!bedState || bedState.type !== "dogbed") {
      return false;
    }
    bedState.activated = true;
    bedState.attachedPuppyId = null;
    bedState.sleepTimer = bedState.sleepTimer ? bedState.sleepTimer : null;
    updateFriendElementAsset(bedId);
    bedState.sleepTimer = setTimeout(() => {
      bedState.sleeping = true;
      updateFriendElementAsset(bedId);
    }, 4000);
    return true;
  },
  onDirectWaterSource: (bowlId, sourceType) => {
    const bowlState = findFriendById(bowlId, state.activeWorld);
    if (!bowlState || bowlState.type !== "water-bowl") {
      return false;
    }
    bowlState.full = true;
    syncBackgroundObjectActivation(bowlState, worldCanvas.querySelector(`.friend-character[data-friend-id="${bowlId}"]`));
    updateFriendElementAsset(bowlId);
    window.CuppyLandAudio?.playSfxClip?.("drinkingFountainActivated");
    if (sourceType === "fishbowl") {
      window.CuppyLandAudio?.playSfxClip?.("fishbowlActivated");
    }
    return true;
  },
  startChocolateMilkSpill: (friendId, cupId) => chocolateMilkSequenceController.startForCup(friendId, cupId),
  friendReleaseController,
  timerLifecycle: timerLifecycleController,
  triggerFriendCelebration: (friendState, friendElement) => {
    sparkleEffectController.triggerFriendSparkle(friendState, friendElement);
  },
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
  syncBackgroundObjectActivation: (friendState, friendElement) => {
    backgroundObjectController.syncFriend(friendState, friendElement);
    tubeSlideController.syncFriend(friendState, friendElement);
  },
  removeBackgroundObjectActivation: (friendId) => backgroundObjectController.removeFriend(friendId),
  getWorldPointFromClient,
  petAssetController,
  doghouseController,
  puppySequenceController,
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
  onDogbedPointerDown: (dogbedState, event) => {
    const puppyState = friendWorldController.extractPuppyFromDogbed(dogbedState, event);
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

function ensureChocolateMilkForCup(cupId, characterType = "chocolate-milk") {
  if (!cupId || !state.activeWorld) {
    return null;
  }
  const cupInstance = findCupById(cupId, state.activeWorld);
  if (!cupInstance) {
    return null;
  }
  const worldFriends = getWorldFriendList(state.activeWorld);
  const normalizedCharacterType = characterType === "baby-mr-chocolate-milk"
    ? "baby-mr-chocolate-milk"
    : "chocolate-milk";
  let chocolateState = worldFriends.find((friend) => (
    friend.type === normalizedCharacterType
    && friend.attachedCupId === cupId
  ));
  if (!chocolateState) {
    chocolateState = worldFriends.find((friend) => friend.type === normalizedCharacterType);
  }
  if (chocolateState) {
    chocolateState.attachedCupId = cupId;
    chocolateState.sequenceCompleted = false;
    renderWorldCups();
    renderWorldFriends();
    return chocolateState;
  }

  const maxZ = worldFriends.reduce((max, friend) => (
    Math.max(max, Number.isFinite(friend?.zIndex) ? friend.zIndex : 90)
  ), 90);
  chocolateState = {
    id: `friend-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    type: normalizedCharacterType,
    hasFood: false,
    pizzaWobbleActive: false,
    worldX: Math.max(0, Math.min(worldCanvas.offsetWidth - 132, cupInstance.state.worldX + 132)),
    worldY: Math.max(12, Math.min(worldCanvas.offsetHeight - 132, cupInstance.state.worldY)),
    zIndex: maxZ + 1,
    attachedCupId: cupId,
    attachedOffsetX: 132,
    attachedOffsetY: 18,
    activated: false,
    sequenceCompleted: false,
    ...(normalizedCharacterType === "baby-mr-chocolate-milk" ? {
      lidColor: "yellow",
      cupColor: "red",
      sleeve: "child",
      expression: "happy",
      hairstyle: null,
      lidDetached: false,
      lidVisible: true,
      lidOffsetX: 11,
      lidOffsetY: 0,
      sleeveDetached: false,
      sleeveVisible: true,
      sleeveOffsetX: 20,
      sleeveOffsetY: 104,
      hairstyleDetached: false,
      hairstyleOffsetX: 17,
      hairstyleOffsetY: -14,
      hairstyleVisible: false,
    } : {}),
  };
  worldFriends.push(chocolateState);
  renderWorldCups();
  renderWorldFriends();
  return chocolateState;
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

function onChocolateMilkFillStart(cupId, characterType = "chocolate-milk") {
  chocolateMilkFillController.onFillStart(cupId, characterType);
}

function onChocolateMilkFillTick(cupId) {
  chocolateMilkFillController.onFillTick(cupId);
}

function onChocolateMilkFillCancel() {
  chocolateMilkFillController.onFillCancel();
}

function onChocolateMilkFillComplete(cupId, characterType = "chocolate-milk") {
  chocolateMilkFillController.onFillComplete(cupId, characterType);
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

function getDefaultFriendDropPoint(friendType = "") {
  return worldCoordinateController.getDefaultFriendDropPoint(friendType);
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
const appActionController = window.CuppyLandAppActionController.createController({
  state,
  inventoryPanel,
  screenWorldController,
  clearChocolateMilkDragFillPreview,
  stopAllChocolateMilkSequences,
  hideWorldHeadlineOverlay,
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

function syncBackgroundObjectActivation(friendState, friendElement) {
  backgroundObjectController?.syncFriend?.(friendState, friendElement);
  tubeSlideController?.syncFriend?.(friendState, friendElement);
}

function syncCupWorldPosition(cupElement = cupCharacter) {
  cupPositionController.syncCupWorldPosition(cupElement);
  const cupState = resolveCupStateForElement(cupElement);
  if (cupState) {
    backgroundObjectController?.syncCup?.(cupState, cupElement);
    tubeSlideController?.syncCup?.(cupState, cupElement);
  }
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
  appActionController.toggleInventory(forceOpen);
}

function ensureWorldCupState(worldId) {
  return cupStateStore.ensureWorldCupState(worldId);
}

function openWorld(worldId) {
  backgroundObjectController.render(worldId);
  tubeSlideController.render(worldId);
  screenWorldController.openWorld(worldId);
  showWorldHeadlineOverlay(worldId);
  if (worldId === "playground") {
    window.CuppyLandAudio?.playSfxClip?.("playgroundIntroFx");
  } else if (worldId === "olivia-room") {
    window.CuppyLandAudio?.playSfxClip?.("myNameIsOlivia");
  }
}

function closeWorld() {
  appActionController.closeWorld();
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
  worldCanvas,
  schedulePuppyRequest: (puppyState) => puppyRequestController.schedule(puppyState),
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
