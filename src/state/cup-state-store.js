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

  function createStore({ gameConfig, state }) {
    let cupLayerOrderCounter = 1;

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

      return state.worlds[worldId];
    }

    function addCupToWorld() {
      if (!state.activeWorld) {
        return null;
      }

      const worldCups = getWorldCupList(state.activeWorld);
      worldCups.forEach((cupInfo, index) => ensureCupLayerOrder(cupInfo.state, index + 1));

      const nextId = `cup-${state.activeWorld}-${worldCups.length + 1}`;
      const cupState = createDefaultCupState();
      const newCup = { id: nextId, state: cupState };
      newCup.state.worldX = 900 + (worldCups.length * 90);
      newCup.state.worldY = 430 + (worldCups.length % 2) * 30;
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
