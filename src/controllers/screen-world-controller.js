(function () {
  function createController(options) {
    const {
      state,
      screenEls,
      worldBackground,
      worldCanvas,
      worldViewport,
      closeModal,
      rotatePrompt,
      fixedViewport,
      worldClasses,
      documentRef,
      ensureWorldCupState,
      cloneCupState,
      renderWorldCups,
      toggleInventory,
      onScreenChanged = () => {},
    } = options;

    function showScreen(screen) {
      state.currentScreen = screen;
      screenEls.splash.classList.toggle("active", screen === "splash");
      screenEls.worldSelect.classList.toggle("active", screen === "worldSelect");
      screenEls.world.classList.toggle("active", screen === "world");
      onScreenChanged();
    }

    function updateWorldBackground() {
      worldBackground.classList.remove("playground", "olivia-room");
      worldCanvas.classList.remove("playground", "olivia-room");
      if (state.activeWorld) {
        worldBackground.classList.add(worldClasses[state.activeWorld]);
        worldCanvas.classList.add(worldClasses[state.activeWorld]);
        const worldWidth = state.activeWorld === "playground" ? 6600 : 2200;
        worldCanvas.style.width = `${worldWidth}px`;
      } else {
        worldCanvas.style.width = "2200px";
      }
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
      const totalWidth = worldCanvas.offsetWidth || 2200;
      worldViewport.scrollLeft = Math.floor((totalWidth - worldViewport.clientWidth) / 2);
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
      const visualViewport = window.visualViewport;
      const viewportWidth = visualViewport?.width || window.innerWidth;
      const viewportHeight = visualViewport?.height || window.innerHeight;
      const horizontalPadding = 16;
      const verticalPadding = 16;
      const scale = Math.min(
        1,
        Math.max(0.1, (viewportWidth - horizontalPadding) / fixedViewport.width),
        Math.max(0.1, (viewportHeight - verticalPadding) / fixedViewport.height)
      );
      documentRef.documentElement.style.setProperty("--game-scale", String(scale));
    }

    return {
      showScreen,
      updateWorldBackground,
      openWorld,
      closeWorld,
      showCloseModal,
      hideCloseModal,
      updateLandscapePrompt,
      updateGameViewportScale,
    };
  }

  window.CuppyLandScreenWorldController = {
    createController,
  };
})();
