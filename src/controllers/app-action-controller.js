(function () {
  function createController(options) {
    const {
      state,
      inventoryPanel,
      screenWorldController,
      clearChocolateMilkDragFillPreview,
      stopAllChocolateMilkSequences,
      hideWorldHeadlineOverlay,
    } = options;

    function toggleInventory(forceOpen) {
      state.inventoryOpen = typeof forceOpen === "boolean" ? forceOpen : !state.inventoryOpen;
      inventoryPanel.classList.toggle("open", state.inventoryOpen);
    }

    function closeWorld() {
      window.CuppyLandAudio?.stopSfxClip?.("milkPour");
      window.CuppyLandAudio?.stopSfxClip?.("squirrelRunning");
      window.CuppyLandAudio?.stopSfxClip?.("goldenPuppyActivated");
      window.CuppyLandAudio?.stopSfxClip?.("puppyBarking");
      window.CuppyLandSquirrelRunningSfx?.reset?.();
      hideWorldHeadlineOverlay();
      clearChocolateMilkDragFillPreview();
      stopAllChocolateMilkSequences();
      screenWorldController.closeWorld();
    }

    return {
      toggleInventory,
      closeWorld,
    };
  }

  window.CuppyLandAppActionController = {
    createController,
  };
})();
