(function () {
  function createFallbackDefaultCupState() {
    return {
      lidColor: "yellow",
      cupColor: "red",
      sleeve: "child",
      expression: "happy",
      hairstyle: null,
      worldX: 920,
      worldY: 430,
      zIndex: 1,
      lidDetached: false,
      lidVisible: true,
      lidOffsetX: 17,
      lidOffsetY: 0,
      sleeveDetached: false,
      sleeveVisible: true,
      sleeveOffsetX: 32,
      sleeveOffsetY: 160,
      faceOffsetX: 10,
      faceOffsetY: 18,
      faceVisible: true,
      hairstyleDetached: false,
      hairstyleOffsetX: 17,
      hairstyleOffsetY: -22,
      hairstyleVisible: false,
    };
  }

  function cloneJsonSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createStore({ gameConfig, state, worldCanvas = null, worldViewport = null }) {
    let cupLayerOrderCounter = 1;

    function getViewportSpawnPoint(instanceIndex = 0) {
      const fallbackX = state?.activeWorld === "playground"
        ? 3300
        : (state?.activeWorld === "olivia-room" ? 720 : 920);
      const fallbackY = state?.activeWorld === "playground" ? 420 : 430;
      if (!worldCanvas || !worldViewport) {
        return { worldX: fallbackX, worldY: fallbackY };
      }

      const visibleCenterX = (
        (worldViewport.scrollLeft ?? 0)
        + (worldViewport.clientWidth ?? 1280) * 0.52
        - (state?.activeWorld === "olivia-room" ? 200 : 0)
      );
      const visibleCenterY = (worldViewport.clientHeight ?? 800) * 0.58;
      const offsetX = (instanceIndex % 3) * 120 - 120;
      const offsetY = (instanceIndex % 2 === 0 ? 0 : 80) + Math.floor(instanceIndex / 2) * 14;
      const maxX = Math.max(220, worldCanvas.offsetWidth - 260);
      const maxY = Math.max(200, worldCanvas.offsetHeight - 180);

      return {
        worldX: Math.min(Math.max(220, visibleCenterX + offsetX), maxX),
        worldY: Math.min(Math.max(200, visibleCenterY + offsetY), maxY),
      };
    }

    function createDefaultCupState() {
      const template = gameConfig?.defaultCupState || createFallbackDefaultCupState();
      return cloneJsonSafe(template);
    }

    function cloneCupState(source = state.cup) {
      return cloneJsonSafe(source || createDefaultCupState());
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

    function ensureCupLayerOrder(cupState, fallbackOrder = 1) {
      if (!cupState || typeof cupState !== "object") {
        return fallbackOrder;
      }

      if (!Number.isFinite(cupState.zIndex)) {
        cupState.zIndex = fallbackOrder;
      }

      cupLayerOrderCounter = Math.max(cupLayerOrderCounter, cupState.zIndex);
      return cupState.zIndex;
    }

    function bringCupToFront(cupState) {
      if (!cupState || typeof cupState !== "object") {
        return null;
      }

      cupLayerOrderCounter += 1;
      cupState.zIndex = cupLayerOrderCounter;
      return cupState.zIndex;
    }

    function setActiveCupInstance(cupId) {
      if (!state.activeWorld) {
        return null;
      }

      const worldCups = getWorldCupList(state.activeWorld);
      const nextActiveCup = worldCups.find((cup) => cup.id === cupId) || worldCups[0];
      if (!nextActiveCup) {
        return null;
      }

      state.activeCupId = nextActiveCup.id;
      state.cup = nextActiveCup.state;
      return nextActiveCup;
    }

    function getActiveCupInstance() {
      const cups = getWorldCupList(state.activeWorld);
      const activeCup = cups.find((cup) => cup.id === state.activeCupId) || cups[0];
      return activeCup || null;
    }

    function syncWorldCupSelection() {
      const activeCup = getActiveCupInstance();
      if (activeCup) {
        state.activeCupId = activeCup.id;
        state.cup = activeCup.state;
      }
      return activeCup;
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

    function ensureWorldCupState(worldId) {
      if (!state.worlds) {
        state.worlds = {};
      }

      if (!state.worlds[worldId]) {
        state.worlds[worldId] = {
          cups: [
            {
              id: `cup-${worldId}-1`,
              state: cloneCupState(state.cup || gameConfig?.state?.worlds?.[worldId]?.cups?.[0]?.state || {}),
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

      if (worldId === "playground" && state.worlds[worldId].cups[0]) {
        state.worlds[worldId].cups[0].state.worldX = 3300;
        state.worlds[worldId].cups[0].state.worldY = 420;
      }
      if (worldId === "olivia-room" && state.worlds[worldId].cups[0]) {
        state.worlds[worldId].cups[0].state.worldX = 720;
      }

      return state.worlds[worldId];
    }

    function addCupToWorld() {
      if (!state.activeWorld) {
        return null;
      }

      const worldCups = getWorldCupList(state.activeWorld);
      worldCups.forEach((cupInfo, index) => ensureCupLayerOrder(cupInfo.state, index + 1));

      let nextIndex = worldCups.length + 1;
      let nextId = `cup-${state.activeWorld}-${nextIndex}`;
      const existingIds = new Set(worldCups.map((cupInfo) => cupInfo.id));
      while (existingIds.has(nextId)) {
        nextIndex += 1;
        nextId = `cup-${state.activeWorld}-${nextIndex}`;
      }
      const cupState = createDefaultCupState();
      const newCup = { id: nextId, state: cupState };
      const viewportSpawn = getViewportSpawnPoint(worldCups.length);
      newCup.state.worldX = viewportSpawn.worldX;
      newCup.state.worldY = viewportSpawn.worldY;
      bringCupToFront(newCup.state);
      worldCups.push(newCup);
      state.activeCupId = nextId;
      state.cup = newCup.state;
      return newCup;
    }

    function removeCupInstance(cupId) {
      if (!state.activeWorld || !cupId) {
        return { removed: false, remaining: 0, nextCup: null };
      }

      const worldCups = getWorldCupList(state.activeWorld);
      const cupIndex = worldCups.findIndex((cup) => cup.id === cupId);
      if (cupIndex < 0) {
        return { removed: false, remaining: worldCups.length, nextCup: null };
      }

      worldCups.splice(cupIndex, 1);

      if (!worldCups.length) {
        state.activeCupId = null;
        state.cup = cloneCupState();
        return { removed: true, remaining: 0, nextCup: null };
      }

      const nextCup = worldCups[Math.min(cupIndex, worldCups.length - 1)];
      state.activeCupId = nextCup.id;
      state.cup = nextCup.state;
      return { removed: true, remaining: worldCups.length, nextCup };
    }

    return {
      createDefaultCupState,
      cloneCupState,
      getWorldCupList,
      ensureCupLayerOrder,
      bringCupToFront,
      setActiveCupInstance,
      getActiveCupInstance,
      syncWorldCupSelection,
      getTargetCupState,
      ensureWorldCupState,
      addCupToWorld,
      removeCupInstance,
    };
  }

  window.CuppyLandCupState = {
    createStore,
  };
})();
