(function () {
  function createController(options) {
    const {
      state,
      documentRef,
      cupStateStore,
      getWorldCupList,
      getWorldFriendList,
      resolveCupStateForElement,
    } = options;

    function ensureCupLayerOrder(cupState, fallbackOrder = 1) {
      return cupStateStore.ensureCupLayerOrder(cupState, fallbackOrder);
    }

    function getWorldMaxZIndex(worldId = state.activeWorld) {
      if (!worldId) {
        return 1;
      }

      const maxCupZIndex = getWorldCupList(worldId).reduce((max, cupInfo) => (
        Math.max(max, Number.isFinite(cupInfo?.state?.zIndex) ? cupInfo.state.zIndex : 0)
      ), 0);
      const maxFriendZIndex = getWorldFriendList(worldId).reduce((max, friendState) => (
        Math.max(max, Number.isFinite(friendState?.zIndex) ? friendState.zIndex : 0)
      ), 0);
      return Math.max(1, maxCupZIndex, maxFriendZIndex);
    }

    function getNextWorldZIndex(worldId = state.activeWorld) {
      return getWorldMaxZIndex(worldId) + 1;
    }

    function syncCupSelectionVisualState() {
      documentRef.querySelectorAll(".cup-character[data-cup-id]").forEach((cupNode) => {
        const isSelected = cupNode.dataset.cupId === state.activeCupId;
        cupNode.classList.toggle("is-selected", isSelected);
      });
    }

    function setActiveCupInstance(cupId) {
      const nextActiveCup = cupStateStore.setActiveCupInstance(cupId);
      if (nextActiveCup) {
        syncCupSelectionVisualState();
      }
      return nextActiveCup;
    }

    function getActiveCupInstance() {
      return cupStateStore.getActiveCupInstance();
    }

    function getCupInstanceById(cupId, worldId = state.activeWorld) {
      if (!cupId) {
        return null;
      }
      return getWorldCupList(worldId).find((cup) => cup.id === cupId) || null;
    }

    function syncWorldCupSelection() {
      cupStateStore.syncWorldCupSelection();
    }

    function getTargetCupState() {
      return cupStateStore.getTargetCupState();
    }

    function bringCupElementToFront(cupElement) {
      if (!cupElement) {
        return;
      }

      const cupState = resolveCupStateForElement(cupElement);
      if (!cupState) {
        return;
      }
      const nextZIndex = getNextWorldZIndex();
      cupState.zIndex = nextZIndex;
      if (Number.isFinite(nextZIndex)) {
        cupElement.style.zIndex = String(nextZIndex);
      }
    }

    function bringFriendElementToFront(friendElement, friendState) {
      if (!friendElement || !friendState) {
        return;
      }
      const nextZIndex = getNextWorldZIndex();
      friendState.zIndex = nextZIndex;
      friendElement.style.zIndex = String(nextZIndex);
    }

    return {
      ensureCupLayerOrder,
      getWorldMaxZIndex,
      getNextWorldZIndex,
      bringCupElementToFront,
      bringFriendElementToFront,
      syncCupSelectionVisualState,
      setActiveCupInstance,
      getActiveCupInstance,
      getCupInstanceById,
      syncWorldCupSelection,
      getTargetCupState,
    };
  }

  window.CuppyLandWorldLayerController = {
    createController,
  };
})();
