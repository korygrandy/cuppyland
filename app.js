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
function syncAudioForCurrentScreen() {
  if (window.CuppyLandAudio && typeof window.CuppyLandAudio.syncAudioForCurrentScreen === "function") {
    window.CuppyLandAudio.syncAudioForCurrentScreen();
  }
}

function cloneCupState(source = state.cup) {
  return JSON.parse(JSON.stringify(source || {}));
}

function getWorldCupList(worldId = state.activeWorld) {
  const worldState = state.worlds?.[worldId];
  if (!worldState) {
    return [];
  }
  if (!Array.isArray(worldState.cups)) {
    worldState.cups = [{ id: `cup-${worldId}-1`, state: cloneCupState(state.cup) }];
  }
  return worldState.cups;
}

function syncCupSelectionVisualState() {
  document.querySelectorAll(".cup-character[data-cup-id]").forEach((cupNode) => {
    const isSelected = cupNode.dataset.cupId === state.activeCupId;
    cupNode.classList.toggle("is-selected", isSelected);
  });
}

function setActiveCupInstance(cupId) {
  if (!state.activeWorld) {
    return;
  }

  const worldCups = getWorldCupList(state.activeWorld);
  const nextActiveCup = worldCups.find((cup) => cup.id === cupId) || worldCups[0];
  if (!nextActiveCup) {
    return;
  }

  state.activeCupId = nextActiveCup.id;
  state.cup = nextActiveCup.state;
  syncCupSelectionVisualState();
}

function getActiveCupInstance() {
  const cups = getWorldCupList(state.activeWorld);
  const activeCup = cups.find((cup) => cup.id === state.activeCupId) || cups[0];
  if (!activeCup) {
    return null;
  }
  return activeCup;
}

function syncWorldCupSelection() {
  const activeCup = getActiveCupInstance();
  if (activeCup) {
    state.activeCupId = activeCup.id;
    state.cup = activeCup.state;
  }
}

function getTargetCupState() {
  if (!state.activeWorld) {
    return state.cup;
  }

  const activeCup = getActiveCupInstance();
  if (activeCup) {
    state.activeCupId = activeCup.id;
    state.cup = activeCup.state;
    return activeCup.state;
  }

  const worldCups = getWorldCupList(state.activeWorld);
  if (!worldCups.length) {
    return state.cup;
  }

  const fallbackCup = worldCups[0];
  state.activeCupId = fallbackCup.id;
  state.cup = fallbackCup.state;
  return fallbackCup.state;
}

function createCupElement(cupId, cupState) {
  const template = cupCharacter.cloneNode(true);
  template.dataset.cupId = cupId;
  template.id = `cupCharacter-${cupId}`;
  template.classList.remove("hidden-object");
  template.style.left = `${cupState.worldX}px`;
  template.style.top = `${cupState.worldY}px`;

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

  return template;
}

function renderWorldCups() {
  document.querySelectorAll(".cup-character[data-cup-id]").forEach((node) => node.remove());
  const defaultCup = document.getElementById("cupCharacter");
  if (defaultCup && !defaultCup.dataset.cupId) {
    defaultCup.remove();
  }
  const worldCups = getWorldCupList(state.activeWorld);
  if (!worldCups.length) {
    return;
  }

  worldCups.forEach((cupInfo) => {
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
    hairstyleLayerElement.style.left = `${left + 10}px`;
    hairstyleLayerElement.style.top = `${top - 22}px`;
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

  renderTintedPartForCanvas("lid", cupState.lidColor, lidLayerElement);
  renderTintedPartForCanvas("cup", cupState.cupColor, cupLayerElement);

  const activeSleeveAsset = sleeveAssetMap[cupState.sleeve] || defaultSleeveAsset;
  const activeFaceAsset =
    window.CuppyLandGame.faceAssetMap?.[cupState.sleeve]?.[cupState.expression || "happy"] ||
    "./assets/mr-chocolate-milk-happy.jpg";
  const activeHairstyleAsset =
    window.CuppyLandGame.hairstyleAssetMap?.[cupState.hairstyle || "child"] || "./assets/hairstyle-grandpa.png";

  drawTintedImage(sleeveLayerElement, activeSleeveAsset, "#d1b9ff");
  sleeveLayerElement.style.width = "200px";
  sleeveLayerElement.style.height = "110px";

  if (hairstyleLayerElement) {
    hairstyleLayerElement.style.backgroundColor = "transparent";
    hairstyleLayerElement.style.backgroundImage = `url("${activeHairstyleAsset}")`;
    hairstyleLayerElement.style.backgroundSize = "contain";
    hairstyleLayerElement.style.backgroundPosition = "center";
    hairstyleLayerElement.style.backgroundRepeat = "no-repeat";
    hairstyleLayerElement.textContent = "";
  }

  if (faceLayerElement) {
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
  if (!state.worlds) {
    state.worlds = {};
  }

  if (!state.worlds[worldId]) {
    state.worlds[worldId] = {
      cups: [
        {
          id: `cup-${worldId}-1`,
          state: cloneCupState(state.cup || window.CuppyLandGame.state.worlds?.[worldId]?.cups?.[0]?.state || {}),
        },
      ],
    };
  }

  if (!Array.isArray(state.worlds[worldId].cups)) {
    state.worlds[worldId].cups = [
      {
        id: `cup-${worldId}-1`,
        state: cloneCupState(state.worlds[worldId] || state.cup || {}),
      },
    ];
  }

  return state.worlds[worldId];
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

function addCupToWorld() {
  if (!state.activeWorld) {
    return false;
  }

  const worldCups = getWorldCupList(state.activeWorld);
  const nextId = `cup-${state.activeWorld}-${worldCups.length + 1}`;
  const templateCupState = getTargetCupState();
  const cupState = cloneCupState(templateCupState || worldCups[0]?.state || {});
  const newCup = { id: nextId, state: cupState };
  newCup.state.worldX = 900 + (worldCups.length * 90);
  newCup.state.worldY = 430 + (worldCups.length % 2) * 30;
  worldCups.push(newCup);
  state.activeCupId = nextId;
  state.cup = newCup.state;
  renderWorldCups();
  return true;
}

function applyDrop(itemType, value, targetZone) {
  if (itemType === "cup-create") {
    return addCupToWorld() ? { valid: true } : { valid: false, reason: "no-world" };
  }

  const activeCupState = getTargetCupState();
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
    activeCupState.hairstyle = value;
    return { valid: true };
  }

  return { valid: false, reason: "unknown-item" };
}

function applyInventorySelection(itemType, value) {
  const result = applyDrop(itemType, value, itemType);
  if (result.valid) {
    renderWorldCups();
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

function safeClosest(target, selector) {
  if (!target || typeof target.closest !== "function") {
    return null;
  }
  return target.closest(selector);
}

function trySetPointerCapture(element, pointerId) {
  if (!element || typeof pointerId !== "number") {
    return;
  }

  try {
    element.setPointerCapture(pointerId);
  } catch (error) {
    // Some synthetic or touch events can arrive without a valid active pointer capture.
  }
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
  if (!trashCanBtn) {
    return;
  }

  trashState.active = true;
  trashState.target = target;
  trashCanBtn.classList.remove("hidden");
  trashCanBtn.setAttribute("data-target", target);
}

function hideTrashCan() {
  if (!trashCanBtn) {
    return;
  }

  trashState.active = false;
  trashState.target = null;
  trashCanBtn.classList.add("hidden");
  trashCanBtn.removeAttribute("data-target");
  trashCanBtn.classList.remove("highlight");
}

function isPointerOverTrashCan(x, y) {
  if (!trashCanBtn || trashCanBtn.classList.contains("hidden")) {
    return false;
  }

  const rect = trashCanBtn.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function removeSelectedObject() {
  if (!trashState.target) {
    return;
  }

  if (trashState.target === "cup") {
    cupCharacter.classList.add("hidden-object");
    return;
  }

  if (trashState.target === "lid") {
    lidLayer.style.display = "none";
    hairstyleLayer.style.display = "none";
  }

  if (trashState.target === "sleeve") {
    sleeveLayer.style.display = "none";
    faceLayer.style.display = "none";
  }

  if (trashState.target === "hairstyle") {
    hairstyleLayer.style.display = "none";
  }

  hideTrashCan();
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
  const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
  const cupState = resolveCupStateForElement(cupElement);
  if (!lidDragState.active || event.pointerId !== lidDragState.pointerId) {
    return;
  }

  if (isPointerOverTrashCan(event.clientX, event.clientY)) {
    removeSelectedObject();
  } else if (lidIsNearCup()) {
    cupState.lidDetached = false;
    cupState.lidOffsetX = 17;
    cupState.lidOffsetY = 0;
  }

  trashCanBtn.classList.remove("highlight");
  lidDragState.active = false;
  lidDragState.pointerId = null;
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
  } else if (sleeveIsNearCup()) {
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
