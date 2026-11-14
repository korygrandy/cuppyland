const state = {
  currentScreen: "splash",
  activeWorld: null,
  inventoryOpen: false,
  cup: {
    lidColor: "red",
    cupColor: "blue",
    sleeve: "child",
  },
};
const fixedViewport = {
  width: 1280,
  height: 800,
};

const palette = ["red", "blue", "yellow", "green"];
const sleeveTypes = ["child", "parent", "grandparent"];
const sleeveFaceMap = {
  child: "😊",
  parent: "😎",
  grandparent: "🤗",
};
const colorMap = {
  red: "#ff3c3c",
  blue: "#3e80ff",
  yellow: "#f3cf33",
  green: "#37c86e",
};
const worldClasses = {
  playground: "playground",
  "olivia-room": "olivia-room",
};

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
const faceNote = document.getElementById("faceNote");
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
const tintAssetConfig = {
  lid: "./assets/lid-grayscale.png",
  cup: "./assets/cup-grayscale.png",
};
const audioConfig = {
  menu: "./assets/Kailua_Breeze.mp3",
  worlds: {
    playground: ["./assets/playground.mp3", "./assets/playgound.mp3"],
    "olivia-room": "./assets/olivias-room.mp3",
  },
};

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
const audioState = {
  unlocked: false,
  activeTrack: null,
  musicVolume: 0.7,
  sfxVolume: 0.75,
  previousMusicVolume: 0.7,
  previousSfxVolume: 0.75,
};
let sfxAudioContext = null;
const audioStorageKey = "oliviaworld-audio-settings-v1";

const sfxProfiles = {
  standard: [
    { frequency: 720, duration: 0.04, gain: 0.055, type: "triangle", offset: 0 },
    { frequency: 980, duration: 0.05, gain: 0.045, type: "sine", offset: 0.035 },
  ],
  close: [
    { frequency: 320, duration: 0.06, gain: 0.06, type: "square", offset: 0 },
    { frequency: 240, duration: 0.07, gain: 0.05, type: "triangle", offset: 0.045 },
  ],
  yes: [
    { frequency: 640, duration: 0.045, gain: 0.05, type: "sine", offset: 0 },
    { frequency: 920, duration: 0.07, gain: 0.055, type: "triangle", offset: 0.04 },
  ],
  no: [
    { frequency: 520, duration: 0.05, gain: 0.05, type: "triangle", offset: 0 },
    { frequency: 360, duration: 0.07, gain: 0.055, type: "square", offset: 0.04 },
  ],
};

function getSfxAudioContext() {
  if (!sfxAudioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      return null;
    }
    sfxAudioContext = new Ctx();
  }
  return sfxAudioContext;
}

function playSfx(profileName) {
  if (audioState.sfxVolume <= 0) {
    return;
  }
  const context = getSfxAudioContext();
  if (!context) {
    return;
  }

  const profile = sfxProfiles[profileName] || sfxProfiles.standard;
  const baseTime = context.currentTime;
  profile.forEach((tone) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const startAt = baseTime + tone.offset;
    const endAt = startAt + tone.duration;

    oscillator.type = tone.type;
    oscillator.frequency.setValueAtTime(tone.frequency, startAt);
    const scaledGain = tone.gain * audioState.sfxVolume;
    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(scaledGain, startAt + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt + 0.01);
  });
}

function createAudioPlayer(src) {
  const sources = Array.isArray(src) ? src : [src];
  const audio = new Audio(sources[0]);
  audio.loop = true;
  audio.preload = "auto";
  if (sources.length > 1) {
    let sourceIndex = 0;
    audio.addEventListener("error", () => {
      if (sourceIndex >= sources.length - 1) {
        return;
      }
      sourceIndex += 1;
      audio.src = sources[sourceIndex];
      audio.load();
      if (audioState.activeTrack) {
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch((error) => {
            console.warn(`Unable to play fallback audio source "${sources[sourceIndex]}".`, error);
          });
        }
      }
    });
  }
  return audio;
}

const audioPlayers = {
  menu: createAudioPlayer(audioConfig.menu),
  worlds: {
    playground: createAudioPlayer(audioConfig.worlds.playground),
    "olivia-room": createAudioPlayer(audioConfig.worlds["olivia-room"]),
  },
};

function getAllAudioPlayers() {
  return [audioPlayers.menu, audioPlayers.worlds.playground, audioPlayers.worlds["olivia-room"]];
}

function applyMusicVolume() {
  getAllAudioPlayers().forEach((player) => {
    player.volume = audioState.musicVolume;
  });
}

function updateAudioVolumeLabels() {
  musicVolumeValue.textContent = `${Math.round(audioState.musicVolume * 100)}%`;
  sfxVolumeValue.textContent = `${Math.round(audioState.sfxVolume * 100)}%`;
  const musicMuted = audioState.musicVolume <= 0;
  const sfxMuted = audioState.sfxVolume <= 0;
  musicMuteBtn.textContent = musicMuted ? "Unmute Music" : "Mute Music";
  sfxMuteBtn.textContent = sfxMuted ? "Unmute SFX" : "Mute SFX";
  musicMuteBtn.setAttribute("aria-pressed", String(musicMuted));
  sfxMuteBtn.setAttribute("aria-pressed", String(sfxMuted));
}

function clampVolume(value) {
  return Math.min(1, Math.max(0, value));
}

function saveAudioSettings() {
  const payload = {
    musicVolume: audioState.musicVolume,
    sfxVolume: audioState.sfxVolume,
    previousMusicVolume: audioState.previousMusicVolume,
    previousSfxVolume: audioState.previousSfxVolume,
  };
  try {
    localStorage.setItem(audioStorageKey, JSON.stringify(payload));
  } catch (error) {
    console.warn("Unable to persist audio settings.", error);
  }
}

function loadAudioSettings() {
  try {
    const raw = localStorage.getItem(audioStorageKey);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed.musicVolume === "number") {
      audioState.musicVolume = clampVolume(parsed.musicVolume);
    }
    if (typeof parsed.sfxVolume === "number") {
      audioState.sfxVolume = clampVolume(parsed.sfxVolume);
    }
    if (typeof parsed.previousMusicVolume === "number") {
      audioState.previousMusicVolume = clampVolume(parsed.previousMusicVolume);
    }
    if (typeof parsed.previousSfxVolume === "number") {
      audioState.previousSfxVolume = clampVolume(parsed.previousSfxVolume);
    }
  } catch (error) {
    console.warn("Unable to load saved audio settings.", error);
  }
}

function syncAudioControlsUi() {
  musicVolumeInput.value = String(Math.round(audioState.musicVolume * 100));
  sfxVolumeInput.value = String(Math.round(audioState.sfxVolume * 100));
  updateAudioVolumeLabels();
}

function handleMusicVolumeChange(event) {
  const volume = clampVolume(Number(event.target.value) / 100);
  audioState.musicVolume = volume;
  if (volume > 0) {
    audioState.previousMusicVolume = volume;
  }
  applyMusicVolume();
  if (audioState.unlocked && volume > 0) {
    syncAudioForCurrentScreen();
  }
  updateAudioVolumeLabels();
  saveAudioSettings();
}

function handleSfxVolumeChange(event) {
  const volume = clampVolume(Number(event.target.value) / 100);
  audioState.sfxVolume = volume;
  if (volume > 0) {
    audioState.previousSfxVolume = volume;
  }
  updateAudioVolumeLabels();
  saveAudioSettings();
  playSfx("standard");
}

function toggleMusicMute() {
  if (audioState.musicVolume <= 0) {
    audioState.musicVolume = audioState.previousMusicVolume > 0 ? audioState.previousMusicVolume : 0.7;
  } else {
    audioState.previousMusicVolume = audioState.musicVolume;
    audioState.musicVolume = 0;
  }
  applyMusicVolume();
  if (audioState.unlocked && audioState.musicVolume > 0) {
    syncAudioForCurrentScreen();
  }
  syncAudioControlsUi();
  saveAudioSettings();
}

function toggleSfxMute() {
  if (audioState.sfxVolume <= 0) {
    audioState.sfxVolume = audioState.previousSfxVolume > 0 ? audioState.previousSfxVolume : 0.75;
    playSfx("standard");
  } else {
    audioState.previousSfxVolume = audioState.sfxVolume;
    audioState.sfxVolume = 0;
  }
  syncAudioControlsUi();
  saveAudioSettings();
}

function pauseAllAudio() {
  getAllAudioPlayers().forEach((player) => {
    player.pause();
  });
}

function playAudioTrack(player, trackName) {
  if (audioState.activeTrack === trackName && !player.paused) {
    return;
  }

  pauseAllAudio();
  audioState.activeTrack = trackName;
  const playPromise = player.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch((error) => {
      console.warn(`Unable to play audio track "${trackName}".`, error);
    });
  }
}

function syncAudioForCurrentScreen() {
  if (!audioState.unlocked) {
    return;
  }

  if (state.currentScreen === "world") {
    if (state.activeWorld && audioPlayers.worlds[state.activeWorld]) {
      playAudioTrack(audioPlayers.worlds[state.activeWorld], state.activeWorld);
      return;
    }
    pauseAllAudio();
    audioState.activeTrack = null;
    return;
  }

  if (state.currentScreen === "splash" || state.currentScreen === "worldSelect") {
    playAudioTrack(audioPlayers.menu, "menu");
    return;
  }

  pauseAllAudio();
  audioState.activeTrack = null;
}

function unlockAudio() {
  if (audioState.unlocked) {
    return;
  }
  audioState.unlocked = true;
  const context = getSfxAudioContext();
  if (context && context.state === "suspended") {
    context.resume().catch((error) => {
      console.warn("Unable to resume button SFX audio context.", error);
    });
  }
  syncAudioForCurrentScreen();
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

function renderCup() {
  renderTintedPart("lid", state.cup.lidColor);
  renderTintedPart("cup", state.cup.cupColor);
  sleeveLayer.textContent = state.cup.sleeve;
  faceNote.textContent = sleeveFaceMap[state.cup.sleeve];
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

function createColorItem(type, colorName) {
  const item = document.createElement("button");
  item.type = "button";
  item.className = "inventory-item";
  item.dataset.itemType = type;
  item.dataset.value = colorName;
  item.textContent = colorName;
  item.style.backgroundColor = colorMap[colorName];
  item.style.color = colorName === "yellow" ? "#27324b" : "#ffffff";
  return item;
}

function createSleeveItem(sleeve) {
  const item = document.createElement("button");
  item.type = "button";
  item.className = "inventory-item sleeve";
  item.dataset.itemType = "sleeve";
  item.dataset.value = sleeve;
  item.textContent = sleeve;
  return item;
}

function buildInventoryItems() {
  lidItems.innerHTML = "";
  cupItems.innerHTML = "";
  sleeveItems.innerHTML = "";

  palette.forEach((colorName) => {
    lidItems.appendChild(createColorItem("lid", colorName));
    cupItems.appendChild(createColorItem("cup", colorName));
  });
  sleeveTypes.forEach((sleeve) => {
    sleeveItems.appendChild(createSleeveItem(sleeve));
  });
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

  return { valid: false, reason: "unknown-item" };
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
  document.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("keydown", unlockAudio, { once: true });

  playBtn.addEventListener("click", () => {
    playSfx("standard");
    showScreen("worldSelect");
  });
  backToSplashBtn.addEventListener("click", () => {
    playSfx("standard");
    showScreen("splash");
  });
  worldButtons.forEach((button) => {
    button.addEventListener("click", () => {
      playSfx("standard");
      openWorld(button.dataset.world);
    });
  });
  inventoryToggleBtn.addEventListener("click", () => {
    playSfx("standard");
    toggleInventory();
  });
  closeWorldBtn.addEventListener("click", () => {
    playSfx("close");
    showCloseModal();
  });
  confirmCloseBtn.addEventListener("click", () => {
    playSfx("yes");
    hideCloseModal();
    closeWorld();
  });
  cancelCloseBtn.addEventListener("click", () => {
    playSfx("no");
    hideCloseModal();
  });
  window.addEventListener("resize", () => {
    updateLandscapePrompt();
    updateGameViewportScale();
  });

  inventoryPanel.addEventListener("pointerdown", onInventoryPointerDown);
  inventoryPanel.addEventListener("pointermove", onInventoryPointerMove);
  inventoryPanel.addEventListener("pointerup", onInventoryPointerEnd);
  inventoryPanel.addEventListener("pointercancel", onInventoryPointerEnd);
  musicVolumeInput.addEventListener("input", handleMusicVolumeChange);
  sfxVolumeInput.addEventListener("input", handleSfxVolumeChange);
  musicMuteBtn.addEventListener("click", toggleMusicMute);
  sfxMuteBtn.addEventListener("click", toggleSfxMute);
}

function init() {
  loadAudioSettings();
  applyMusicVolume();
  syncAudioControlsUi();
  buildInventoryItems();
  renderCup();
  wireEvents();
  updateLandscapePrompt();
  updateGameViewportScale();
  showScreen("splash");
  loadTintAssets();
}

init();
