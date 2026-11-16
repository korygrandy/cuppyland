(function () {
  function createController(options) {
    const {
      state,
      trashState,
      cupCharacter,
      lidLayer,
      sleeveLayer,
      faceLayer,
      hairstyleLayer,
      cupLayer,
      cupStateStore,
      getWorldCupList,
      getWorldFriendList,
      getActiveCupInstance,
      setActiveCupInstance,
      renderWorldCups,
      hideTrashCan,
      defaultCupState,
    } = options;

    function addCupToWorld() {
      const newCup = cupStateStore.addCupToWorld();
      if (!newCup) {
        return false;
      }
      renderWorldCups();
      window.CuppyLandAudio?.playSfxClip?.("hi");
      return true;
    }

    function addFriendToWorld(friendType, dropPoint) {
      if (!state.activeWorld) {
        return false;
      }

      const worldFriends = getWorldFriendList(state.activeWorld);
      const fallbackIndex = worldFriends.length;
      const worldX = Number.isFinite(dropPoint?.worldX) ? dropPoint.worldX : 900 + (fallbackIndex % 3) * 120;
      const worldY = Number.isFinite(dropPoint?.worldY) ? dropPoint.worldY : 360 + Math.floor(fallbackIndex / 3) * 110;
      worldFriends.push({
        id: `friend-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        type: friendType,
        worldX,
        worldY,
        zIndex: 90 + fallbackIndex,
      });
      renderWorldCups();
      if (friendType === "rocketman-craft") {
        window.CuppyLandAudio?.playSfxClip?.("rocketship");
      }
      return true;
    }

    function applyDrop(itemType, value, targetZone, targetCupId = state.activeCupId, dropPoint = null) {
      if (itemType === "cup-create") {
        return addCupToWorld() ? { valid: true } : { valid: false, reason: "no-world" };
      }

      if (itemType === "friend") {
        return addFriendToWorld(value, dropPoint) ? { valid: true } : { valid: false, reason: "no-world" };
      }

      if (!state.activeWorld) {
        return { valid: false, reason: "no-world" };
      }

      const worldCups = getWorldCupList(state.activeWorld);
      const selectedCup = worldCups.find((cup) => cup.id === targetCupId) || getActiveCupInstance() || worldCups[0];
      if (!selectedCup) {
        return { valid: false, reason: "no-cup" };
      }

      setActiveCupInstance(selectedCup.id);
      const activeCupState = selectedCup.state;
      const isHairstyleDrop = itemType === "hairstyle" && (targetZone === "lid" || targetZone === "hairstyle");
      const isExpressionDrop = itemType === "expression" && targetZone === "sleeve";

      if (itemType !== targetZone && !isHairstyleDrop && !isExpressionDrop) {
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
        activeCupState.expression = "happy";
        activeCupState.sleeveVisible = true;
        activeCupState.faceVisible = true;
        return { valid: true };
      }

      if (itemType === "expression") {
        activeCupState.expression = value;
        return { valid: true };
      }

      if (itemType === "hairstyle") {
        if (activeCupState.lidVisible === false) {
          activeCupState.lidVisible = true;
          activeCupState.lidDetached = false;
          activeCupState.lidOffsetX = defaultCupState?.lidOffsetX ?? 17;
          activeCupState.lidOffsetY = defaultCupState?.lidOffsetY ?? 0;
        }
        activeCupState.hairstyle = value;
        activeCupState.hairstyleVisible = true;
        activeCupState.hairstyleDetached = false;
        activeCupState.hairstyleOffsetX = defaultCupState?.hairstyleOffsetX ?? 17;
        activeCupState.hairstyleOffsetY = defaultCupState?.hairstyleOffsetY ?? -22;
        return { valid: true };
      }

      return { valid: false, reason: "unknown-item" };
    }

    function showInvalidFeedback() {
      sleeveLayer.classList.remove("invalid-shake");
      cupLayer.classList.remove("invalid-shake");
      lidLayer.classList.remove("invalid-shake");
      void sleeveLayer.offsetWidth;
      sleeveLayer.classList.add("invalid-shake");
    }

    function applyInventorySelection(itemType, value, targetCupId = state.activeCupId, dropPoint = null) {
      const result = applyDrop(itemType, value, itemType, targetCupId, dropPoint);
      if (result.valid) {
        renderWorldCups();
        return true;
      }

      if (result.reason === "duplicate-sleeve") {
        showInvalidFeedback();
      }
      return false;
    }

    function removeCupInstance(cupId) {
      const result = cupStateStore.removeCupInstance(cupId);
      if (!result.removed) {
        return;
      }
      renderWorldCups();
    }

    function removeSelectedObject() {
      if (!trashState.target) {
        return;
      }

      const selectedCup = getActiveCupInstance();

      if (trashState.target === "cup") {
        if (selectedCup) {
          removeCupInstance(selectedCup.id);
        } else {
          cupCharacter.classList.add("hidden-object");
        }
        return;
      }

      if (trashState.target === "lid") {
        if (selectedCup) {
          selectedCup.state.lidVisible = false;
          selectedCup.state.hairstyleVisible = false;
        }
        lidLayer.style.display = "none";
        hairstyleLayer.style.display = "none";
      }

      if (trashState.target === "sleeve") {
        if (selectedCup) {
          selectedCup.state.sleeveVisible = false;
          selectedCup.state.faceVisible = false;
        }
        sleeveLayer.style.display = "none";
        faceLayer.style.display = "none";
      }

      if (trashState.target === "hairstyle") {
        if (selectedCup) {
          selectedCup.state.hairstyleVisible = false;
        }
        hairstyleLayer.style.display = "none";
      }

      hideTrashCan();
      renderWorldCups();
    }

    return {
      addCupToWorld,
      addFriendToWorld,
      applyDrop,
      applyInventorySelection,
      showInvalidFeedback,
      removeCupInstance,
      removeSelectedObject,
    };
  }

  window.CuppyLandGameRulesController = {
    createController,
  };
})();
