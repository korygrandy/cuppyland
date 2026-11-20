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
