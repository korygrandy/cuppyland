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
      getNextWorldZIndex,
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

    function addFriendToWorld(friendType, dropPoint, options = {}) {
      if (!state.activeWorld) {
        return false;
      }

      const worldFriends = getWorldFriendList(state.activeWorld);
      const fallbackIndex = worldFriends.length;
      const attachedCupId = options.attachedCupId || null;
      const attachedOffsetX = Number.isFinite(options.attachedOffsetX) ? options.attachedOffsetX : 52;
      const attachedOffsetY = Number.isFinite(options.attachedOffsetY) ? options.attachedOffsetY : 48;
      const attachedCup = attachedCupId ? getWorldCupList(state.activeWorld).find((cup) => cup.id === attachedCupId) : null;
      const defaultPanelCenterX = state.activeWorld === "playground" ? 5300 : 900;
      const defaultPanelCenterY = state.activeWorld === "playground" ? 420 : 360;
      const fallbackWorldX = Number.isFinite(dropPoint?.worldX)
        ? dropPoint.worldX
        : state.activeWorld === "playground"
          ? defaultPanelCenterX + ((fallbackIndex % 3) - 1) * 45
          : defaultPanelCenterX + (fallbackIndex % 3) * 70 - 70;
      const fallbackWorldY = Number.isFinite(dropPoint?.worldY)
        ? dropPoint.worldY
        : defaultPanelCenterY + Math.floor(fallbackIndex / 3) * 80;
      const worldX = attachedCup
        ? attachedCup.state.worldX + attachedOffsetX
        : state.activeWorld === "playground" && !Number.isFinite(dropPoint?.worldX)
          ? defaultPanelCenterX + ((fallbackIndex % 3) - 1) * 45
          : fallbackWorldX;
      const worldY = attachedCup
        ? attachedCup.state.worldY + attachedOffsetY
        : state.activeWorld === "playground" && !Number.isFinite(dropPoint?.worldY)
          ? defaultPanelCenterY
          : fallbackWorldY;

      worldFriends.push({
        id: `friend-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        type: friendType,
        worldX,
        worldY,
        zIndex: typeof getNextWorldZIndex === "function" ? getNextWorldZIndex(state.activeWorld) : (90 + fallbackIndex),
        attachedCupId: null,
        attachedOffsetX: 0,
        attachedOffsetY: 0,
        activated: false,
        sequenceCompleted: false,
      });
      renderWorldCups();
      if (friendType === "rocketman-craft") {
        window.CuppyLandAudio?.playSfxClip?.("rocketship");
      }
      if (friendType === "spongebob-stuffy") {
        window.CuppyLandAudio?.playSfxClip?.("spongebob");
      }
      if (friendType === "hairy-guy") {
        window.CuppyLandAudio?.playSfxClip?.("hairyGuy");
      }
      if (friendType === "furball-guy") {
        window.CuppyLandAudio?.playSfxClip?.("furballGuy");
      }
      if (friendType === "barbie-blonde") {
        window.CuppyLandAudio?.playSfxClip?.("barbieBlonde");
      }
      if (friendType === "barbie-blonde-baby") {
        window.CuppyLandAudio?.playSfxClip?.("barbieBlondeBaby");
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
        triggerSleeveReappearPulse(selectedCup);
        return { valid: true };
      }

      if (itemType === "expression") {
        if (activeCupState.sleeveVisible === false || !activeCupState.sleeve) {
          activeCupState.sleeve = activeCupState.sleeve || defaultCupState?.sleeve || "child";
          activeCupState.sleeveVisible = true;
          activeCupState.faceVisible = true;
          activeCupState.sleeveDetached = false;
          activeCupState.sleeveOffsetX = defaultCupState?.sleeveOffsetX ?? 32;
          activeCupState.sleeveOffsetY = defaultCupState?.sleeveOffsetY ?? 160;
          triggerSleeveReappearPulse(selectedCup);
        }
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

    function triggerSleeveReappearPulse(selectedCup = getActiveCupInstance()) {
      const activeCupElement = selectedCup && document.querySelector(`.cup-character[data-cup-id="${selectedCup.id}"]`);
      const targetSleeve = activeCupElement ? activeCupElement.querySelector(".cup-sleeve") : sleeveLayer;
      if (!targetSleeve) {
        return;
      }

      targetSleeve.classList.remove("sleeve-pop-in");
      void targetSleeve.offsetWidth;
      targetSleeve.classList.add("sleeve-pop-in");
    }

    function showInvalidFeedback() {
      [sleeveLayer, cupLayer, lidLayer, faceLayer].forEach((layer) => {
        if (!layer) {
          return;
        }
        layer.classList.remove("invalid-shake");
        void layer.offsetWidth;
        layer.classList.add("invalid-shake");
      });
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
        return false;
      }
      window.CuppyLandAudio?.playSfxClip?.("cupRemoved");
      renderWorldCups();
      return true;
    }

    function removeSelectedObject() {
      if (!trashState.target) {
        return;
      }

      const selectedCup = getActiveCupInstance();
      let objectRemoved = false;

      if (trashState.target === "cup") {
        if (selectedCup) {
          objectRemoved = removeCupInstance(selectedCup.id);
        } else {
          cupCharacter.classList.add("hidden-object");
          objectRemoved = true;
          window.CuppyLandAudio?.playSfxClip?.("cupRemoved");
        }
        return;
      }

      if (trashState.target === "lid") {
        if (selectedCup) {
          objectRemoved = selectedCup.state.lidVisible || selectedCup.state.hairstyleVisible;
          selectedCup.state.lidVisible = false;
          selectedCup.state.hairstyleVisible = false;
        }
        lidLayer.style.display = "none";
        hairstyleLayer.style.display = "none";
      }

      if (trashState.target === "sleeve") {
        if (selectedCup) {
          objectRemoved = selectedCup.state.sleeveVisible || selectedCup.state.faceVisible;
          selectedCup.state.sleeveVisible = false;
          selectedCup.state.faceVisible = false;
        }
        sleeveLayer.style.display = "none";
        faceLayer.style.display = "none";
      }

      if (trashState.target === "hairstyle") {
        if (selectedCup) {
          objectRemoved = selectedCup.state.hairstyleVisible;
          selectedCup.state.hairstyleVisible = false;
        }
        hairstyleLayer.style.display = "none";
      }

      if (objectRemoved) {
        window.CuppyLandAudio?.playSfxClip?.("defaultObjectRemoved");
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
