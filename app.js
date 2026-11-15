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
const lidLayer = document.getElementById("lidLayer");
const cupLayer = document.getElementById("cupLayer");
const sleeveLayer = document.getElementById("sleeveLayer");
const faceLayer = document.getElementById("faceLayer");
const lidItems = document.getElementById("lidItems");
const cupItems = document.getElementById("cupItems");
const sleeveItems = document.getElementById("sleeveItems");
const dragGhost = document.getElementById("dragGhost");
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
function syncAudioForCurrentScreen() {
  if (window.CuppyLandAudio && typeof window.CuppyLandAudio.syncAudioForCurrentScreen === "function") {
    window.CuppyLandAudio.syncAudioForCurrentScreen();
  }
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

function syncLidPosition() {
  const left = state.cup.lidDetached ? state.cup.lidOffsetX : 17;
  const top = state.cup.lidDetached ? state.cup.lidOffsetY : 0;
  lidLayer.style.left = `${left}px`;
  lidLayer.style.top = `${top}px`;
}

function syncSleevePosition() {
  const left = state.cup.sleeveDetached ? state.cup.sleeveOffsetX : 32;
  const top = state.cup.sleeveDetached ? state.cup.sleeveOffsetY : 160;
  sleeveLayer.style.left = `${left}px`;
  sleeveLayer.style.top = `${top}px`;
}

function syncFacePosition() {
  if (!faceLayer) {
    return;
  }

  const left = state.cup.sleeveDetached ? state.cup.sleeveOffsetX : 32;
  const top = state.cup.sleeveDetached ? state.cup.sleeveOffsetY : 160;
  const faceOffsetX = state.cup.faceOffsetX ?? 10;
  const faceOffsetY = state.cup.faceOffsetY ?? 18;

  const sleeveAnchorX = left + (sleeveLayer.offsetWidth || 200) * 0.5;
  const sleeveAnchorY = top + (sleeveLayer.offsetHeight || 110) * 0.45;
  const faceCenterX = (faceLayer.offsetWidth || 120) * 0.5;
  const faceCenterY = (faceLayer.offsetHeight || 90) * 0.5;

  faceLayer.style.left = `${sleeveAnchorX - faceCenterX + faceOffsetX}px`;
  faceLayer.style.top = `${sleeveAnchorY - faceCenterY + faceOffsetY}px`;
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

function renderCup() {
  renderTintedPart("lid", state.cup.lidColor);
  renderTintedPart("cup", state.cup.cupColor);

  const sleeveStyle = sleevePalette[state.cup.sleeve] || sleevePalette.child;
  const activeSleeveAsset = sleeveAssetMap[state.cup.sleeve] || defaultSleeveAsset;
  const activeFaceAsset =
    window.CuppyLandGame.faceAssetMap?.[state.cup.sleeve]?.[state.cup.expression || "happy"] ||
    "./assets/mr-chocolate-milk-happy.jpg";

  drawTintedImage(sleeveLayer, activeSleeveAsset, "#d1b9ff");
  sleeveLayer.style.width = "200px";
  sleeveLayer.style.height = "110px";

  if (faceLayer) {
    faceLayer.style.backgroundColor = "transparent";
    faceLayer.style.backgroundImage = `url("${activeFaceAsset}")`;
    faceLayer.style.backgroundSize = "contain";
    faceLayer.style.backgroundPosition = "center";
    faceLayer.style.backgroundRepeat = "no-repeat";
    faceLayer.textContent = "";
  }

  syncLidPosition();
  syncSleevePosition();
  syncFacePosition();
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

function openWorld(worldId) {
  state.activeWorld = worldId;
  updateWorldBackground();
  showScreen("world");
  toggleInventory(false);
  closeModal.classList.add("hidden");
  worldViewport.scrollLeft = Math.floor((2200 - worldViewport.clientWidth) / 2);
}

function closeWorld() {
  state.activeWorld = null;
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

function zoneForPoint(x, y) {
  const zones = [dropZoneLid, dropZoneCup, dropZoneSleeve];
  for (const zone of zones) {
    const rect = zone.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return zone.dataset.target;
    }
  }
  return null;
}

function applyDrop(itemType, value, targetZone) {
  if (itemType !== targetZone) {
    return { valid: false, reason: "wrong-zone" };
  }

  if (itemType === "lid") {
    state.cup.lidColor = value;
    return { valid: true };
  }

  if (itemType === "cup") {
    state.cup.cupColor = value;
    return { valid: true };
  }

  if (itemType === "sleeve") {
    if (state.cup.sleeve === value) {
      return { valid: false, reason: "duplicate-sleeve" };
    }
    state.cup.sleeve = value;
    return { valid: true };
  }

  if (itemType === "expression") {
    state.cup.expression = value;
    return { valid: true };
  }

  return { valid: false, reason: "unknown-item" };
}

function applyInventorySelection(itemType, value) {
  const result = applyDrop(itemType, value, itemType);
  if (result.valid) {
    renderCup();
    return true;
  }

  if (result.reason === "duplicate-sleeve") {
    showInvalidFeedback();
  }
  return false;
}

function setZoneHighlight(pointX, pointY) {
  const zones = [dropZoneLid, dropZoneCup, dropZoneSleeve];
  zones.forEach((zone) => zone.classList.remove("highlight"));
  const zoneName = zoneForPoint(pointX, pointY);
  if (!zoneName) {
    return;
  }
  const match = zones.find((zone) => zone.dataset.target === zoneName);
  if (match) {
    match.classList.add("highlight");
  }
}

function clearZoneHighlights() {
  [dropZoneLid, dropZoneCup, dropZoneSleeve].forEach((zone) => zone.classList.remove("highlight"));
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

function onLidPointerDown(event) {
  if (state.currentScreen !== "world") {
    return;
  }

  event.preventDefault();
  const parentRect = document.getElementById("cupCharacter").getBoundingClientRect();
  lidDragState.active = true;
  lidDragState.pointerId = event.pointerId;
  lidDragState.initialLeft = state.cup.lidDetached ? state.cup.lidOffsetX : 17;
  lidDragState.initialTop = state.cup.lidDetached ? state.cup.lidOffsetY : 0;
  lidDragState.anchorX = event.clientX - parentRect.left;
  lidDragState.anchorY = event.clientY - parentRect.top;
  lidLayer.setPointerCapture(event.pointerId);
}

function onLidPointerMove(event) {
  if (!lidDragState.active || event.pointerId !== lidDragState.pointerId) {
    return;
  }

  const parentRect = document.getElementById("cupCharacter").getBoundingClientRect();
  const localX = event.clientX - parentRect.left;
  const localY = event.clientY - parentRect.top;
  const nextLeft = Math.max(-60, Math.min(200, lidDragState.initialLeft + (localX - lidDragState.anchorX)));
  const nextTop = Math.max(-80, Math.min(120, lidDragState.initialTop + (localY - lidDragState.anchorY)));
  state.cup.lidDetached = true;
  state.cup.lidOffsetX = nextLeft;
  state.cup.lidOffsetY = nextTop;
  syncLidPosition();
}

function lidIsNearCup() {
  const cupRect = cupLayer.getBoundingClientRect();
  const lidRect = lidLayer.getBoundingClientRect();
  const lidCenterX = lidRect.left + lidRect.width / 2;
  const lidCenterY = lidRect.top + lidRect.height / 2;
  const cupCenterX = cupRect.left + cupRect.width / 2;
  const cupCenterY = cupRect.top + cupRect.height / 2;
  const distance = Math.hypot(lidCenterX - cupCenterX, lidCenterY - cupCenterY);
  return distance < 110;
}

function sleeveIsNearCup() {
  const cupRect = cupLayer.getBoundingClientRect();
  const sleeveRect = sleeveLayer.getBoundingClientRect();
  const sleeveCenterX = sleeveRect.left + sleeveRect.width / 2;
  const sleeveCenterY = sleeveRect.top + sleeveRect.height / 2;
  const cupCenterX = cupRect.left + cupRect.width / 2;
  const cupCenterY = cupRect.top + cupRect.height / 2;
  const distance = Math.hypot(sleeveCenterX - cupCenterX, sleeveCenterY - cupCenterY);
  return distance < 120;
}

function onLidPointerUp(event) {
  if (!lidDragState.active || event.pointerId !== lidDragState.pointerId) {
    return;
  }

  if (lidIsNearCup()) {
    state.cup.lidDetached = false;
    state.cup.lidOffsetX = 17;
    state.cup.lidOffsetY = 0;
  }

  lidDragState.active = false;
  lidDragState.pointerId = null;
  syncLidPosition();
}

function onSleevePointerDown(event) {
  if (state.currentScreen !== "world") {
    return;
  }

  event.preventDefault();
  const parentRect = document.getElementById("cupCharacter").getBoundingClientRect();
  sleeveDragState.active = true;
  sleeveDragState.pointerId = event.pointerId;
  sleeveDragState.initialLeft = state.cup.sleeveDetached ? state.cup.sleeveOffsetX : 32;
  sleeveDragState.initialTop = state.cup.sleeveDetached ? state.cup.sleeveOffsetY : 160;
  sleeveDragState.anchorX = event.clientX - parentRect.left;
  sleeveDragState.anchorY = event.clientY - parentRect.top;
  sleeveLayer.setPointerCapture(event.pointerId);
}

function onSleevePointerMove(event) {
  if (!sleeveDragState.active || event.pointerId !== sleeveDragState.pointerId) {
    return;
  }

  const parentRect = document.getElementById("cupCharacter").getBoundingClientRect();
  const localX = event.clientX - parentRect.left;
  const localY = event.clientY - parentRect.top;
  const nextLeft = Math.max(-60, Math.min(200, sleeveDragState.initialLeft + (localX - sleeveDragState.anchorX)));
  const nextTop = Math.max(-20, Math.min(220, sleeveDragState.initialTop + (localY - sleeveDragState.anchorY)));
  state.cup.sleeveDetached = true;
  state.cup.sleeveOffsetX = nextLeft;
  state.cup.sleeveOffsetY = nextTop;
  syncSleevePosition();
  syncFacePosition();
}

function onSleevePointerUp(event) {
  if (!sleeveDragState.active || event.pointerId !== sleeveDragState.pointerId) {
    return;
  }

  if (sleeveIsNearCup()) {
    state.cup.sleeveDetached = false;
    state.cup.sleeveOffsetX = 32;
    state.cup.sleeveOffsetY = 160;
  }

  sleeveDragState.active = false;
  sleeveDragState.pointerId = null;
  syncSleevePosition();
  syncFacePosition();
}

function onInventoryPointerDown(event) {
  const target = event.target.closest(".inventory-item");
  if (!target || state.currentScreen !== "world") {
    return;
  }

  event.preventDefault();
  dragState.active = true;
  dragState.type = target.dataset.itemType;
  dragState.value = target.dataset.value;
  dragState.pointerId = event.pointerId;
  target.setPointerCapture(event.pointerId);
  showDragGhost(event.clientX, event.clientY, `${dragState.type}: ${dragState.value}`);
  setZoneHighlight(event.clientX, event.clientY);
}

function onInventoryClick(event) {
  const target = event.target.closest(".inventory-item");
  if (!target || state.currentScreen !== "world") {
    return;
  }

  event.preventDefault();
  applyInventorySelection(target.dataset.itemType, target.dataset.value);
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

  const zone = zoneForPoint(event.clientX, event.clientY);
  const result = zone ? applyDrop(dragState.type, dragState.value, zone) : { valid: false, reason: "no-zone" };

  if (result.valid) {
    renderCup();
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

  lidLayer.addEventListener("pointerdown", onLidPointerDown);
  lidLayer.addEventListener("pointermove", onLidPointerMove);
  lidLayer.addEventListener("pointerup", onLidPointerUp);
  lidLayer.addEventListener("pointercancel", onLidPointerUp);

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
