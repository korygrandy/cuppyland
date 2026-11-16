(function () {
  function createController(options) {
    const {
      state,
      cupCharacter,
      lidLayer,
      sleeveLayer,
      hairstyleLayer,
      faceLayer,
      getWorldCupList,
      defaultCupState = {},
      gameplayConfig = {},
    } = options;

    function resolveCupStateForElement(cupElement) {
      if (cupElement && cupElement.dataset && cupElement.dataset.cupId && state.activeWorld) {
        const matchingCup = getWorldCupList(state.activeWorld).find((cup) => cup.id === cupElement.dataset.cupId);
        if (matchingCup) {
          return matchingCup.state;
        }
      }
      return state.cup;
    }

    function syncCupWorldPosition(cupElement = cupCharacter) {
      const cupState = resolveCupStateForElement(cupElement);
      if (!cupElement) {
        return;
      }

      const worldX = Number.isFinite(cupState.worldX) ? cupState.worldX : 920;
      const worldY = Number.isFinite(cupState.worldY) ? cupState.worldY : 430;
      cupElement.style.left = `${worldX}px`;
      cupElement.style.top = `${worldY}px`;
      cupElement.style.bottom = "auto";
    }

    function syncLidPosition(cupElement = cupCharacter) {
      const cupState = resolveCupStateForElement(cupElement);
      const lidLayerElement = cupElement.querySelector(".cup-lid") || lidLayer;
      const hairstyleLayerElement = cupElement.querySelector(".cup-hairstyle") || hairstyleLayer;
      const lidDefaultX = defaultCupState.lidOffsetX ?? 17;
      const lidDefaultY = defaultCupState.lidOffsetY ?? 0;
      const hairAttachOffsetX = gameplayConfig?.anchors?.hairstyleFromLidOffsetX ?? 10;
      const hairDefaultY = defaultCupState.hairstyleOffsetY ?? -22;
      const left = cupState.lidDetached ? cupState.lidOffsetX : lidDefaultX;
      const top = cupState.lidDetached ? cupState.lidOffsetY : lidDefaultY;
      lidLayerElement.style.left = `${left}px`;
      lidLayerElement.style.top = `${top}px`;
      if (hairstyleLayerElement) {
        const hairLeft = cupState.hairstyleDetached ? cupState.hairstyleOffsetX : left + hairAttachOffsetX;
        const hairTop = cupState.hairstyleDetached ? cupState.hairstyleOffsetY : top + hairDefaultY;
        hairstyleLayerElement.style.left = `${hairLeft}px`;
        hairstyleLayerElement.style.top = `${hairTop}px`;
      }
    }

    function syncSleevePosition(cupElement = cupCharacter) {
      const cupState = resolveCupStateForElement(cupElement);
      const sleeveLayerElement = cupElement.querySelector(".cup-sleeve") || sleeveLayer;
      const defaultX = defaultCupState.sleeveOffsetX ?? 32;
      const defaultY = defaultCupState.sleeveOffsetY ?? 160;
      const left = cupState.sleeveDetached ? cupState.sleeveOffsetX : defaultX;
      const top = cupState.sleeveDetached ? cupState.sleeveOffsetY : defaultY;
      sleeveLayerElement.style.left = `${left}px`;
      sleeveLayerElement.style.top = `${top}px`;
    }

    function syncFacePosition(cupElement = cupCharacter) {
      const cupState = resolveCupStateForElement(cupElement);
      const sleeveLayerElement = cupElement.querySelector(".cup-sleeve") || sleeveLayer;
      const faceLayerElement = cupElement.querySelector(".cup-face") || faceLayer;
      if (!faceLayerElement) {
        return;
      }

      const defaultX = defaultCupState.sleeveOffsetX ?? 32;
      const defaultY = defaultCupState.sleeveOffsetY ?? 160;
      const left = cupState.sleeveDetached ? cupState.sleeveOffsetX : defaultX;
      const top = cupState.sleeveDetached ? cupState.sleeveOffsetY : defaultY;
      const faceOffsetX = cupState.faceOffsetX ?? 10;
      const faceOffsetY = cupState.faceOffsetY ?? 18;

      const sleeveAnchorX = left + (sleeveLayerElement.offsetWidth || 200) * 0.5;
      const sleeveAnchorY = top + (sleeveLayerElement.offsetHeight || 110) * 0.45;
      const faceCenterX = (faceLayerElement.offsetWidth || 120) * 0.5;
      const faceCenterY = (faceLayerElement.offsetHeight || 90) * 0.5;

      faceLayerElement.style.left = `${sleeveAnchorX - faceCenterX + faceOffsetX}px`;
      faceLayerElement.style.top = `${sleeveAnchorY - faceCenterY + faceOffsetY}px`;
    }

    return {
      resolveCupStateForElement,
      syncCupWorldPosition,
      syncLidPosition,
      syncSleevePosition,
      syncFacePosition,
    };
  }

  window.CuppyLandCupPositionController = {
    createController,
  };
})();
