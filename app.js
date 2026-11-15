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
const { tintAssetConfig, defaultSleeveAsset } = window.CuppyLandGame;

function getCanvasContext(canvasElement, layerName) {
  const context = canvasElement.getContext("2d");
  if (!context) {
    throw new Error(`Unable to render ${layerName}: 2D canvas context unavailable`);
  }
  return context;
}

const tintedLayers = {
  lid: {
    canvas: lidLayer,
    context: getCanvasContext(lidLayer, "lid"),
    image: null,
    imageLoaded: false,
    src: tintAssetConfig.lid,
  },
  cup: {
    canvas: cupLayer,
    context: getCanvasContext(cupLayer, "cup"),
    image: null,
    imageLoaded: false,
    src: tintAssetConfig.cup,
  },
};

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

function showScreen(screen) {
  state.currentScreen = screen;
  screenEls.splash.classList.toggle("active", screen === "splash");
  screenEls.worldSelect.classList.toggle("active", screen === "worldSelect");
  screenEls.world.classList.toggle("active", screen === "world");
  syncAudioForCurrentScreen();
}

function updateWorldBackground() {
  worldBackground.classList.remove("playground", "olivia-room");
  if (state.activeWorld) {
    worldBackground.classList.add(worldClasses[state.activeWorld]);
  }
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

function drawTintedImage(canvas, src, colorHex) {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const image = new Image();
  image.onload = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = colorHex;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.save();
    context.globalCompositeOperation = "multiply";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    context.restore();

    context.save();
    context.globalCompositeOperation = "destination-in";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    context.restore();
  };
  image.src = src;
}

function renderCupInstance(cupState, cupElement = cupCharacter) {
  const lidLayerElement = cupElement.querySelector(".cup-lid") || lidLayer;
  const cupLayerElement = cupElement.querySelector(".cup-base") || cupLayer;
  const sleeveLayerElement = cupElement.querySelector(".cup-sleeve") || sleeveLayer;
  const hairstyleLayerElement = cupElement.querySelector(".cup-hairstyle") || hairstyleLayer;
  const faceLayerElement = cupElement.querySelector(".cup-face") || faceLayer;

  const lidVisible = cupState.lidVisible !== false;
  const sleeveVisible = cupState.sleeveVisible !== false;
  const hairstyleVisible = cupState.hairstyleVisible !== false;
  const faceVisible = cupState.faceVisible !== false;

  lidLayerElement.style.display = lidVisible ? "block" : "none";
  sleeveLayerElement.style.display = sleeveVisible ? "block" : "none";
  hairstyleLayerElement.style.display = hairstyleVisible ? "block" : "none";
  faceLayerElement.style.display = faceVisible ? "block" : "none";

  renderTintedPartForCanvas("lid", cupState.lidColor, lidLayerElement);
  renderTintedPartForCanvas("cup", cupState.cupColor, cupLayerElement);

  const activeSleeveAsset = sleeveAssetMap[cupState.sleeve] || defaultSleeveAsset;
  const activeFaceAsset =
    window.CuppyLandGame.faceAssetMap?.[cupState.sleeve]?.[cupState.expression || "happy"] ||
    "./assets/mr-chocolate-milk-happy.jpg";
  const activeHairstyleAsset =
    window.CuppyLandGame.hairstyleAssetMap?.[cupState.hairstyle || "child"] || "./assets/hairstyle-grandpa.png";

  if (sleeveVisible) {
    drawTintedImage(sleeveLayerElement, activeSleeveAsset, "#d1b9ff");
    sleeveLayerElement.style.width = "200px";
    sleeveLayerElement.style.height = "110px";
  }

  if (hairstyleVisible && hairstyleLayerElement) {
    hairstyleLayerElement.style.backgroundColor = "transparent";
    hairstyleLayerElement.style.backgroundImage = `url("${activeHairstyleAsset}")`;
    hairstyleLayerElement.style.backgroundSize = "contain";
    hairstyleLayerElement.style.backgroundPosition = "center";
    hairstyleLayerElement.style.backgroundRepeat = "no-repeat";
    hairstyleLayerElement.textContent = "";
  }

  if (faceVisible && faceLayerElement) {
    faceLayerElement.style.backgroundColor = "transparent";
    faceLayerElement.style.backgroundImage = `url("${activeFaceAsset}")`;
    faceLayerElement.style.backgroundSize = "contain";
    faceLayerElement.style.backgroundPosition = "center";
    faceLayerElement.style.backgroundRepeat = "no-repeat";
    faceLayerElement.textContent = "";
  }

  syncCupWorldPosition(cupElement);
  syncLidPosition(cupElement);
  syncSleevePosition(cupElement);
  syncFacePosition(cupElement);
}

function renderCup() {
  renderCupInstance(state.cup, cupCharacter);
}

function drawSolidColorLayer(layer, colorHex) {
  const { context, canvas } = layer;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = colorHex;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawTintedLayer(layer, colorHex) {
  if (!layer.imageLoaded || !layer.image) {
    drawSolidColorLayer(layer, colorHex);
    return;
  }

  const { context, canvas, image } = layer;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = colorHex;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = "multiply";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = "destination-in";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = "source-over";
}

function renderTintedPart(part, colorName) {
  const layer = tintedLayers[part];
  const colorHex = colorMap[colorName];
  drawTintedLayer(layer, colorHex);
}

function renderTintedPartForCanvas(part, colorName, targetCanvas) {
  const colorHex = colorMap[colorName];
  const asset = part === "lid" ? tintAssetConfig.lid : tintAssetConfig.cup;
  if (!targetCanvas) {
    return;
  }
  drawTintedImage(targetCanvas, asset, colorHex);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${src}`));
    image.src = src;
  });
}

async function loadTintAssets() {
  const entries = Object.entries(tintedLayers);
  await Promise.all(
    entries.map(async ([partName, layer]) => {
      try {
        layer.image = await loadImage(layer.src);
        layer.imageLoaded = true;
        layer.canvas.classList.add("has-grayscale-asset");
      } catch (error) {
        layer.image = null;
        layer.imageLoaded = false;
        layer.canvas.classList.remove("has-grayscale-asset");
        console.warn(`Using fallback fill for ${partName}. Missing grayscale asset at ${layer.src}.`, error);
      }
    })
  );

  renderCup();
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
  const worldState = ensureWorldCupState(worldId);
  state.activeWorld = worldId;
  state.activeCupId = worldState.cups[0]?.id || null;
  state.cup = worldState.cups[0]?.state || cloneCupState();
  updateWorldBackground();
  renderWorldCups();
  showScreen("world");
  toggleInventory(false);
  closeModal.classList.add("hidden");
  worldViewport.scrollLeft = Math.floor((2200 - worldViewport.clientWidth) / 2);
}

function closeWorld() {
  state.activeWorld = null;
  state.activeCupId = null;
  toggleInventory(false);
  showScreen("worldSelect");
}

function showCloseModal() {
  closeModal.classList.remove("hidden");
}

function hideCloseModal() {
  closeModal.classList.add("hidden");
}

function updateLandscapePrompt() {
  const isLandscape = window.innerWidth > window.innerHeight;
  rotatePrompt.classList.toggle("hidden", isLandscape);
}

function updateGameViewportScale() {
  const scale = Math.min(
    1,
    window.innerWidth / fixedViewport.width,
    window.innerHeight / fixedViewport.height
  );
  document.documentElement.style.setProperty("--game-scale", String(scale));
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

function showDragGhost(pointerX, pointerY, label) {
  dragGhost.textContent = label;
  dragGhost.classList.remove("hidden");
  dragGhost.style.left = `${pointerX}px`;
  dragGhost.style.top = `${pointerY}px`;
}

function moveDragGhost(pointerX, pointerY) {
  dragGhost.style.left = `${pointerX}px`;
  dragGhost.style.top = `${pointerY}px`;
}

function hideDragGhost() {
  dragGhost.classList.add("hidden");
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
  const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
  const cupState = resolveCupStateForElement(cupElement);
  if (state.currentScreen !== "world" || safeClosest(event.target, ".inventory-item")) {
    return;
  }

  const interactiveChild = safeClosest(event.target, ".cup-lid, .cup-sleeve, .cup-hairstyle, .cup-face, .drop-zone");
  if (interactiveChild) {
    return;
  }

  if (cupElement && cupElement.dataset.cupId) {
    setActiveCupInstance(cupElement.dataset.cupId);
    bringCupElementToFront(cupElement);
  }

  event.preventDefault();
  event.stopPropagation();
  showTrashCan("cup");
  cupDragState.active = true;
  cupDragState.pointerId = event.pointerId;
  cupDragState.startClientX = event.clientX;
  cupDragState.startClientY = event.clientY;
  cupDragState.startWorldX = Number.isFinite(cupState.worldX) ? cupState.worldX : 920;
  cupDragState.startWorldY = Number.isFinite(cupState.worldY) ? cupState.worldY : 430;
  if (cupElement) {
    trySetPointerCapture(cupElement, event.pointerId);
  }
}

function onCupPointerMove(event) {
  const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
  const cupState = resolveCupStateForElement(cupElement);
  if (!cupDragState.active || event.pointerId !== cupDragState.pointerId || !worldCanvas || !cupElement) {
    return;
  }

  if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
    if (cupElement.dataset.cupId) {
      removeCupInstance(cupElement.dataset.cupId);
    }
    return;
  }

  const deltaX = event.clientX - cupDragState.startClientX;
  const deltaY = event.clientY - cupDragState.startClientY;
  const bounds = worldCanvas.getBoundingClientRect();
  const maxX = Math.max(0, bounds.width - cupElement.offsetWidth);
  const maxY = Math.max(0, bounds.height - cupElement.offsetHeight);
  const nextX = Math.min(maxX, Math.max(0, cupDragState.startWorldX + deltaX));
  const nextY = Math.min(maxY, Math.max(0, cupDragState.startWorldY + deltaY));
  cupState.worldX = nextX;
  cupState.worldY = nextY;
  syncCupWorldPosition(cupElement);

  if (trashState.active && isPointerOverTrashCan(event.clientX, event.clientY)) {
    trashCanBtn.classList.add("highlight");
  } else if (trashCanBtn) {
    trashCanBtn.classList.remove("highlight");
  }
}

function onCupPointerUp(event) {
  if (!cupDragState.active || event.pointerId !== cupDragState.pointerId) {
    return;
  }

  const pointerIsOverTrash = isPointerOverTrashCan(event.clientX, event.clientY);
  if (pointerIsOverTrash) {
    removeSelectedObject();
  } else {
    trashCanBtn.classList.remove("highlight");
  }

  cupDragState.active = false;
  cupDragState.pointerId = null;
}

function onLidPointerDown(event) {
  const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
  const cupState = resolveCupStateForElement(cupElement);
  if (state.currentScreen !== "world") {
    return;
  }

  if (cupElement && cupElement.dataset.cupId) {
    setActiveCupInstance(cupElement.dataset.cupId);
    bringCupElementToFront(cupElement);
  }

  showTrashCan("lid");
  event.preventDefault();
  event.stopPropagation();
  const parentRect = cupElement.getBoundingClientRect();
  lidDragState.active = true;
  lidDragState.pointerId = event.pointerId;
  lidDragState.initialLeft = cupState.lidDetached ? cupState.lidOffsetX : 17;
  lidDragState.initialTop = cupState.lidDetached ? cupState.lidOffsetY : 0;
  lidDragState.anchorX = event.clientX - parentRect.left;
  lidDragState.anchorY = event.clientY - parentRect.top;
  trySetPointerCapture(event.currentTarget, event.pointerId);
}

function onLidPointerMove(event) {
  const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
  const cupState = resolveCupStateForElement(cupElement);
  if (!lidDragState.active || event.pointerId !== lidDragState.pointerId) {
    return;
  }

  if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
    cupState.lidVisible = false;
    cupState.hairstyleVisible = false;
    renderWorldCups();
    return;
  }

  const parentRect = cupElement.getBoundingClientRect();
  const localX = event.clientX - parentRect.left;
  const localY = event.clientY - parentRect.top;
  const nextLeft = Math.max(-60, Math.min(200, lidDragState.initialLeft + (localX - lidDragState.anchorX)));
  const nextTop = Math.max(-80, Math.min(120, lidDragState.initialTop + (localY - lidDragState.anchorY)));
  cupState.lidDetached = true;
  cupState.lidOffsetX = nextLeft;
  cupState.lidOffsetY = nextTop;
  syncLidPosition(cupElement);
}

function lidIsNearCup(cupElement = cupCharacter) {
  const cupBaseElement = (cupElement && cupElement.querySelector(".cup-base")) || cupLayer;
  const lidLayerElement = (cupElement && cupElement.querySelector(".cup-lid")) || lidLayer;
  const cupRect = cupBaseElement.getBoundingClientRect();
  const lidRect = lidLayerElement.getBoundingClientRect();
  const lidCenterX = lidRect.left + lidRect.width / 2;
  const lidCenterY = lidRect.top + lidRect.height / 2;
  const cupCenterX = cupRect.left + cupRect.width / 2;
  const cupCenterY = cupRect.top + cupRect.height / 2;
  const distance = Math.hypot(lidCenterX - cupCenterX, lidCenterY - cupCenterY);
  return distance < 110;
}

function sleeveIsNearCup(cupElement = cupCharacter) {
  const cupBaseElement = (cupElement && cupElement.querySelector(".cup-base")) || cupLayer;
  const sleeveLayerElement = (cupElement && cupElement.querySelector(".cup-sleeve")) || sleeveLayer;
  const cupRect = cupBaseElement.getBoundingClientRect();
  const sleeveRect = sleeveLayerElement.getBoundingClientRect();
  const sleeveCenterX = sleeveRect.left + sleeveRect.width / 2;
  const sleeveCenterY = sleeveRect.top + sleeveRect.height / 2;
  const cupCenterX = cupRect.left + cupRect.width / 2;
  const cupCenterY = cupRect.top + cupRect.height / 2;
  const distance = Math.hypot(sleeveCenterX - cupCenterX, sleeveCenterY - cupCenterY);
  return distance < 120;
}

function onLidPointerUp(event) {
  const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
  const cupState = resolveCupStateForElement(cupElement);
  if (!lidDragState.active || event.pointerId !== lidDragState.pointerId) {
    return;
  }

  if (isPointerOverTrashCan(event.clientX, event.clientY)) {
    removeSelectedObject();
  } else if (lidIsNearCup(cupElement)) {
    cupState.lidDetached = false;
    cupState.lidOffsetX = 17;
    cupState.lidOffsetY = 0;
  }

  trashCanBtn.classList.remove("highlight");
  lidDragState.active = false;
  lidDragState.pointerId = null;
  syncLidPosition(cupElement);
}

function hairstyleIsNearLid(cupElement = cupCharacter) {
  const cupState = resolveCupStateForElement(cupElement);
  const lidRect = (cupElement.querySelector(".cup-lid") || lidLayer).getBoundingClientRect();
  const hairRect = (cupElement.querySelector(".cup-hairstyle") || hairstyleLayer).getBoundingClientRect();
  const hairCenterX = hairRect.left + hairRect.width / 2;
  const hairCenterY = hairRect.top + hairRect.height / 2;
  const lidCenterX = lidRect.left + lidRect.width / 2;
  const lidCenterY = lidRect.top + lidRect.height / 2;
  const distance = Math.hypot(hairCenterX - lidCenterX, hairCenterY - lidCenterY);
  return distance < 90 && cupState.hairstyleVisible !== false;
}

function onHairstylePointerDown(event) {
  const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
  const cupState = resolveCupStateForElement(cupElement);
  if (state.currentScreen !== "world") {
    return;
  }

  if (cupElement && cupElement.dataset.cupId) {
    setActiveCupInstance(cupElement.dataset.cupId);
    bringCupElementToFront(cupElement);
  }

  showTrashCan("hairstyle");
  event.preventDefault();
  event.stopPropagation();
  const parentRect = cupElement.getBoundingClientRect();
  hairstyleDragState.active = true;
  hairstyleDragState.pointerId = event.pointerId;
  hairstyleDragState.moved = false;
  hairstyleDragState.initialLeft = cupState.hairstyleDetached ? cupState.hairstyleOffsetX : 27;
  hairstyleDragState.initialTop = cupState.hairstyleDetached ? cupState.hairstyleOffsetY : -22;
  hairstyleDragState.anchorX = event.clientX - parentRect.left;
  hairstyleDragState.anchorY = event.clientY - parentRect.top;
  trySetPointerCapture(event.currentTarget, event.pointerId);
}

function onHairstylePointerMove(event) {
  const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
  const cupState = resolveCupStateForElement(cupElement);
  if (!hairstyleDragState.active || event.pointerId !== hairstyleDragState.pointerId) {
    return;
  }

  if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
    cupState.hairstyleVisible = false;
    renderWorldCups();
    return;
  }

  const parentRect = cupElement.getBoundingClientRect();
  const localX = event.clientX - parentRect.left;
  const localY = event.clientY - parentRect.top;
  const movementDistance = Math.hypot(localX - hairstyleDragState.anchorX, localY - hairstyleDragState.anchorY);
  hairstyleDragState.moved = movementDistance > 8;

  const nextLeft = Math.max(-80, Math.min(220, hairstyleDragState.initialLeft + (localX - hairstyleDragState.anchorX)));
  const nextTop = Math.max(-120, Math.min(160, hairstyleDragState.initialTop + (localY - hairstyleDragState.anchorY)));
  cupState.hairstyleDetached = true;
  cupState.hairstyleOffsetX = nextLeft;
  cupState.hairstyleOffsetY = nextTop;
  syncLidPosition(cupElement);
}

function onHairstylePointerUp(event) {
  const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
  const cupState = resolveCupStateForElement(cupElement);
  if (!hairstyleDragState.active || event.pointerId !== hairstyleDragState.pointerId) {
    return;
  }

  if (isPointerOverTrashCan(event.clientX, event.clientY)) {
    removeSelectedObject();
  } else if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
    cupState.hairstyleVisible = false;
    renderWorldCups();
  } else if (hairstyleDragState.moved && !hairstyleIsNearLid(cupElement)) {
    cupState.hairstyleDetached = true;
  } else {
    cupState.hairstyleDetached = false;
    cupState.hairstyleOffsetX = 17;
    cupState.hairstyleOffsetY = -22;
  }

  trashCanBtn.classList.remove("highlight");
  hairstyleDragState.active = false;
  hairstyleDragState.pointerId = null;
  hairstyleDragState.moved = false;
  syncLidPosition(cupElement);
}

function onSleevePointerDown(event) {
  const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
  const cupState = resolveCupStateForElement(cupElement);
  if (state.currentScreen !== "world") {
    return;
  }

  if (cupElement && cupElement.dataset.cupId) {
    setActiveCupInstance(cupElement.dataset.cupId);
    bringCupElementToFront(cupElement);
  }

  showTrashCan("sleeve");
  event.preventDefault();
  event.stopPropagation();
  const parentRect = cupElement.getBoundingClientRect();
  sleeveDragState.active = true;
  sleeveDragState.pointerId = event.pointerId;
  sleeveDragState.initialLeft = cupState.sleeveDetached ? cupState.sleeveOffsetX : 32;
  sleeveDragState.initialTop = cupState.sleeveDetached ? cupState.sleeveOffsetY : 160;
  sleeveDragState.anchorX = event.clientX - parentRect.left;
  sleeveDragState.anchorY = event.clientY - parentRect.top;
  trySetPointerCapture(event.currentTarget, event.pointerId);
}

function onSleevePointerMove(event) {
  const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
  const cupState = resolveCupStateForElement(cupElement);
  if (!sleeveDragState.active || event.pointerId !== sleeveDragState.pointerId) {
    return;
  }

  if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
    cupState.sleeveVisible = false;
    cupState.faceVisible = false;
    renderWorldCups();
    return;
  }

  const parentRect = cupElement.getBoundingClientRect();
  const localX = event.clientX - parentRect.left;
  const localY = event.clientY - parentRect.top;
  const nextLeft = Math.max(-60, Math.min(200, sleeveDragState.initialLeft + (localX - sleeveDragState.anchorX)));
  const nextTop = Math.max(-20, Math.min(220, sleeveDragState.initialTop + (localY - sleeveDragState.anchorY)));
  cupState.sleeveDetached = true;
  cupState.sleeveOffsetX = nextLeft;
  cupState.sleeveOffsetY = nextTop;
  syncSleevePosition(cupElement);
  syncFacePosition(cupElement);
}

function onSleevePointerUp(event) {
  const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
  const cupState = resolveCupStateForElement(cupElement);
  if (!sleeveDragState.active || event.pointerId !== sleeveDragState.pointerId) {
    return;
  }

  if (isPointerOverTrashCan(event.clientX, event.clientY)) {
    removeSelectedObject();
  } else if (sleeveIsNearCup(cupElement)) {
    cupState.sleeveDetached = false;
    cupState.sleeveOffsetX = 32;
    cupState.sleeveOffsetY = 160;
  }

  trashCanBtn.classList.remove("highlight");
  sleeveDragState.active = false;
  sleeveDragState.pointerId = null;
  syncSleevePosition(cupElement);
  syncFacePosition(cupElement);
}

function onInventoryPointerDown(event) {
  const target = event.target.closest(".inventory-item");
  if (!target || state.currentScreen !== "world") {
    return;
  }

  if (target.dataset.itemType === "cup-create") {
    return;
  }

  event.preventDefault();
  dragState.active = true;
  dragState.type = target.dataset.itemType;
  dragState.value = target.dataset.value;
  dragState.pointerId = event.pointerId;
  trySetPointerCapture(target, event.pointerId);
  showDragGhost(event.clientX, event.clientY, `${dragState.type}: ${dragState.value}`);
  setZoneHighlight(event.clientX, event.clientY);
}

function onInventoryClick(event) {
  const target = event.target.closest(".inventory-item");
  if (!target || state.currentScreen !== "world") {
    return;
  }

  event.preventDefault();
  const targetCupId = state.activeCupId || getActiveCupInstance()?.id || null;
  applyInventorySelection(target.dataset.itemType, target.dataset.value, targetCupId);
}

function onInventoryPointerMove(event) {
  if (!dragState.active || event.pointerId !== dragState.pointerId) {
    return;
  }
  moveDragGhost(event.clientX, event.clientY);
  setZoneHighlight(event.clientX, event.clientY);
}

function onInventoryPointerEnd(event) {
  if (!dragState.active || event.pointerId !== dragState.pointerId) {
    return;
  }

  const hoveredCup = getCupElementAtPoint(event.clientX, event.clientY);
  const targetCupId = hoveredCup?.dataset.cupId || state.activeCupId;
  const zone = zoneForPoint(event.clientX, event.clientY);
  const result = zone ? applyDrop(dragState.type, dragState.value, zone, targetCupId) : { valid: false, reason: "no-zone" };

  if (result.valid) {
    renderWorldCups();
  } else {
    showInvalidFeedback();
  }

  dragState.active = false;
  dragState.type = "";
  dragState.value = "";
  dragState.pointerId = null;
  hideDragGhost();
  clearZoneHighlights();
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
