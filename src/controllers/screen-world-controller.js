(function () {
  function createController(options) {
    const {
      state,
      screenEls,
      worldBackground,
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
      if (state.activeWorld) {
        worldBackground.classList.add(worldClasses[state.activeWorld]);
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
