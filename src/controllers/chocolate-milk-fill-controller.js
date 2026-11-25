(function () {
  function createController(options) {
    const {
      worldCanvas,
      getCupStateById,
      getSequenceConfig,
      playLoopingSfxClip = () => {},
      stopSfxClip = () => {},
      onComplete = () => {},
    } = options;

    const fillState = {
      cupId: null,
      characterType: "chocolate-milk",
      intervalId: null,
      completionLocked: false,
      frame: 2,
      overlay: null,
    };

    function clearPreview() {
      if (fillState.intervalId) {
        clearInterval(fillState.intervalId);
      }
      fillState.intervalId = null;
      fillState.completionLocked = false;
      fillState.cupId = null;
      fillState.characterType = "chocolate-milk";
      fillState.frame = 2;
      if (fillState.overlay) {
        fillState.overlay.remove();
        fillState.overlay = null;
      }
    }

    function ensureOverlay(cupId) {
      const cupState = getCupStateById(cupId);
      if (!cupState) {
        clearPreview();
        return null;
      }

      const sequenceConfig = getSequenceConfig();
      const previewConfig = sequenceConfig.preview;
      if (!fillState.overlay) {
        const overlay = document.createElement("div");
        overlay.className = "cup-fill-preview";
        if (fillState.characterType === "baby-mr-chocolate-milk") {
          overlay.classList.add("baby-chocolate-milk-fill-preview");
          overlay.innerHTML = [
            '<span class="baby-chocolate-milk-cup-base"></span>',
            '<span class="baby-chocolate-milk-cup-lid"></span>',
            '<span class="baby-chocolate-milk-cup-sleeve"></span>',
          ].join("");
        }
        worldCanvas.appendChild(overlay);
        fillState.overlay = overlay;
      }

      const overlay = fillState.overlay;
      if (fillState.characterType === "baby-mr-chocolate-milk") {
        overlay.classList.add("baby-chocolate-milk-fill-preview");
      } else {
        overlay.classList.remove("baby-chocolate-milk-fill-preview");
      }
      overlay.style.left = `${cupState.worldX + previewConfig.offsetX}px`;
      overlay.style.top = `${cupState.worldY + previewConfig.offsetY}px`;
      overlay.style.width = `${previewConfig.width}px`;
      overlay.style.height = `${previewConfig.height}px`;
      overlay.style.opacity = String(previewConfig.opacity);
      overlay.style.transform = `translate(-50%, -50%) rotate(${previewConfig.rotationDeg}deg)`;
      return overlay;
    }

    function paintFillFrame(cupId, frame) {
      const overlay = ensureOverlay(cupId);
      if (!overlay) {
        return;
      }

      const sequenceConfig = getSequenceConfig();
      const frameAsset = frame === 3 ? sequenceConfig.frame3Asset : sequenceConfig.frame2Asset;
      overlay.style.backgroundImage = `url("${frameAsset}")`;
    }

    function onFillStart(cupId, characterType = "chocolate-milk") {
      if (!cupId || fillState.completionLocked) {
        return;
      }

      playLoopingSfxClip("milkPour");
      if (fillState.cupId !== cupId) {
        clearPreview();
        fillState.cupId = cupId;
      }
      fillState.characterType = characterType;

      paintFillFrame(cupId, 2);
      fillState.intervalId = setInterval(() => {
        if (!fillState.cupId) {
          clearPreview();
          return;
        }
        fillState.frame = fillState.frame === 2 ? 3 : 2;
        paintFillFrame(fillState.cupId, fillState.frame);
      }, 250);
    }

    function onFillTick(cupId) {
      if (!cupId || fillState.completionLocked || fillState.cupId !== cupId) {
        return;
      }
      ensureOverlay(cupId);
    }

    function onFillCancel() {
      stopSfxClip("milkPour");
      clearPreview();
    }

    function onFillComplete(cupId) {
      if (!cupId || fillState.completionLocked) {
        return;
      }

      fillState.completionLocked = true;
      stopSfxClip("milkPour");
      clearPreview();
      onComplete(cupId, fillState.characterType);
    }

    function onFillEnd() {
      stopSfxClip("milkPour");
      clearPreview();
    }

    return {
      clearPreview,
      onFillStart,
      onFillTick,
      onFillCancel,
      onFillComplete,
      onFillEnd,
    };
  }

  window.CuppyLandChocolateMilkFillController = {
    createController,
  };
})();
