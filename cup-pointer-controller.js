(function () {
  function createController(options) {
    const {
      state,
      cupCharacter,
      worldCanvas,
      trashCanBtn,
      cupDragState,
      lidDragState,
      hairstyleDragState,
      sleeveDragState,
      safeClosest,
      trySetPointerCapture,
      isPointerOutsideWorldCanvas,
      isPointerOverTrashCan,
      setActiveCupInstance,
      bringCupElementToFront,
      resolveCupStateForElement,
      showTrashCan,
      removeCupInstance,
      removeSelectedObject,
      renderWorldCups,
      syncCupWorldPosition,
      syncLidPosition,
      syncSleevePosition,
      syncFacePosition,
      clampDetachedOffset,
      isLidNearCup,
      isSleeveNearCup,
      isHairstyleNearLid,
    } = options;

    function onCupPointerDown(event) {
      const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
      const cupState = resolveCupStateForElement(cupElement);
      if (state.currentScreen !== "world" || safeClosest(event.target, ".inventory-item")) {
        return;
      }

      const interactiveChild = safeClosest(event.target, ".cup-lid, .cup-sleeve, .cup-hairstyle, .cup-face, .drop-zone");
      if (interactiveChild) {
        return;
      }

      if (cupElement && cupElement.dataset.cupId) {
        setActiveCupInstance(cupElement.dataset.cupId);
        bringCupElementToFront(cupElement);
      }

      event.preventDefault();
      event.stopPropagation();
      showTrashCan("cup");
      cupDragState.active = true;
      cupDragState.pointerId = event.pointerId;
      cupDragState.startClientX = event.clientX;
      cupDragState.startClientY = event.clientY;
      cupDragState.startWorldX = Number.isFinite(cupState.worldX) ? cupState.worldX : 920;
      cupDragState.startWorldY = Number.isFinite(cupState.worldY) ? cupState.worldY : 430;
      if (cupElement) {
        trySetPointerCapture(cupElement, event.pointerId);
      }
    }

    function onCupPointerMove(event) {
      const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
      const cupState = resolveCupStateForElement(cupElement);
      if (!cupDragState.active || event.pointerId !== cupDragState.pointerId || !worldCanvas || !cupElement) {
        return;
      }

      if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
        if (cupElement.dataset.cupId) {
          removeCupInstance(cupElement.dataset.cupId);
        }
        return;
      }

      const deltaX = event.clientX - cupDragState.startClientX;
      const deltaY = event.clientY - cupDragState.startClientY;
      const bounds = worldCanvas.getBoundingClientRect();
      const maxX = Math.max(0, bounds.width - cupElement.offsetWidth);
      const maxY = Math.max(0, bounds.height - cupElement.offsetHeight);
      const nextX = Math.min(maxX, Math.max(0, cupDragState.startWorldX + deltaX));
      const nextY = Math.min(maxY, Math.max(0, cupDragState.startWorldY + deltaY));
      cupState.worldX = nextX;
      cupState.worldY = nextY;
      syncCupWorldPosition(cupElement);

      if (isPointerOverTrashCan(event.clientX, event.clientY)) {
        trashCanBtn.classList.add("highlight");
      } else if (trashCanBtn) {
        trashCanBtn.classList.remove("highlight");
      }
    }

    function onCupPointerUp(event) {
      if (!cupDragState.active || event.pointerId !== cupDragState.pointerId) {
        return;
      }

      const pointerIsOverTrash = isPointerOverTrashCan(event.clientX, event.clientY);
      if (pointerIsOverTrash) {
        removeSelectedObject();
      } else {
        trashCanBtn.classList.remove("highlight");
      }

      cupDragState.active = false;
      cupDragState.pointerId = null;
    }

    function onLidPointerDown(event) {
      const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
      const cupState = resolveCupStateForElement(cupElement);
      if (state.currentScreen !== "world") {
        return;
      }

      if (cupElement && cupElement.dataset.cupId) {
        setActiveCupInstance(cupElement.dataset.cupId);
        bringCupElementToFront(cupElement);
      }

      showTrashCan("lid");
      event.preventDefault();
      event.stopPropagation();
      const parentRect = cupElement.getBoundingClientRect();
      lidDragState.active = true;
      lidDragState.pointerId = event.pointerId;
      lidDragState.initialLeft = cupState.lidDetached ? cupState.lidOffsetX : 17;
      lidDragState.initialTop = cupState.lidDetached ? cupState.lidOffsetY : 0;
      lidDragState.anchorX = event.clientX - parentRect.left;
      lidDragState.anchorY = event.clientY - parentRect.top;
      trySetPointerCapture(event.currentTarget, event.pointerId);
    }

    function onLidPointerMove(event) {
      const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
      const cupState = resolveCupStateForElement(cupElement);
      if (!lidDragState.active || event.pointerId !== lidDragState.pointerId) {
        return;
      }

      if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
        cupState.lidVisible = false;
        cupState.hairstyleVisible = false;
        renderWorldCups();
        return;
      }

      const parentRect = cupElement.getBoundingClientRect();
      const localX = event.clientX - parentRect.left;
      const localY = event.clientY - parentRect.top;
      const { nextLeft, nextTop } = clampDetachedOffset({
        initialLeft: lidDragState.initialLeft,
        initialTop: lidDragState.initialTop,
        localX,
        localY,
        anchorX: lidDragState.anchorX,
        anchorY: lidDragState.anchorY,
        minLeft: -60,
        maxLeft: 200,
        minTop: -80,
        maxTop: 120,
      });
      cupState.lidDetached = true;
      cupState.lidOffsetX = nextLeft;
      cupState.lidOffsetY = nextTop;
      syncLidPosition(cupElement);
    }

    function onLidPointerUp(event) {
      const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
      const cupState = resolveCupStateForElement(cupElement);
      if (!lidDragState.active || event.pointerId !== lidDragState.pointerId) {
        return;
      }

      if (isPointerOverTrashCan(event.clientX, event.clientY)) {
        removeSelectedObject();
      } else if (isLidNearCup(cupElement)) {
        cupState.lidDetached = false;
        cupState.lidOffsetX = 17;
        cupState.lidOffsetY = 0;
      }

      trashCanBtn.classList.remove("highlight");
      lidDragState.active = false;
      lidDragState.pointerId = null;
      syncLidPosition(cupElement);
    }

    function onHairstylePointerDown(event) {
      const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
      const cupState = resolveCupStateForElement(cupElement);
      if (state.currentScreen !== "world") {
        return;
      }

      if (cupElement && cupElement.dataset.cupId) {
        setActiveCupInstance(cupElement.dataset.cupId);
        bringCupElementToFront(cupElement);
      }

      showTrashCan("hairstyle");
      event.preventDefault();
      event.stopPropagation();
      const parentRect = cupElement.getBoundingClientRect();
      hairstyleDragState.active = true;
      hairstyleDragState.pointerId = event.pointerId;
      hairstyleDragState.moved = false;
      hairstyleDragState.initialLeft = cupState.hairstyleDetached ? cupState.hairstyleOffsetX : 27;
      hairstyleDragState.initialTop = cupState.hairstyleDetached ? cupState.hairstyleOffsetY : -22;
      hairstyleDragState.anchorX = event.clientX - parentRect.left;
      hairstyleDragState.anchorY = event.clientY - parentRect.top;
      trySetPointerCapture(event.currentTarget, event.pointerId);
    }

    function onHairstylePointerMove(event) {
      const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
      const cupState = resolveCupStateForElement(cupElement);
      if (!hairstyleDragState.active || event.pointerId !== hairstyleDragState.pointerId) {
        return;
      }

      if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
        cupState.hairstyleVisible = false;
        renderWorldCups();
        return;
      }

      const parentRect = cupElement.getBoundingClientRect();
      const localX = event.clientX - parentRect.left;
      const localY = event.clientY - parentRect.top;
      const movementDistance = Math.hypot(localX - hairstyleDragState.anchorX, localY - hairstyleDragState.anchorY);
      hairstyleDragState.moved = movementDistance > 8;

      const { nextLeft, nextTop } = clampDetachedOffset({
        initialLeft: hairstyleDragState.initialLeft,
        initialTop: hairstyleDragState.initialTop,
        localX,
        localY,
        anchorX: hairstyleDragState.anchorX,
        anchorY: hairstyleDragState.anchorY,
        minLeft: -80,
        maxLeft: 220,
        minTop: -120,
        maxTop: 160,
      });
      cupState.hairstyleDetached = true;
      cupState.hairstyleOffsetX = nextLeft;
      cupState.hairstyleOffsetY = nextTop;
      syncLidPosition(cupElement);
    }

    function onHairstylePointerUp(event) {
      const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
      const cupState = resolveCupStateForElement(cupElement);
      if (!hairstyleDragState.active || event.pointerId !== hairstyleDragState.pointerId) {
        return;
      }

      if (isPointerOverTrashCan(event.clientX, event.clientY)) {
        removeSelectedObject();
      } else if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
        cupState.hairstyleVisible = false;
        renderWorldCups();
      } else if (hairstyleDragState.moved && !isHairstyleNearLid(cupElement, cupState.hairstyleVisible)) {
        cupState.hairstyleDetached = true;
      } else {
        cupState.hairstyleDetached = false;
        cupState.hairstyleOffsetX = 17;
        cupState.hairstyleOffsetY = -22;
      }

      trashCanBtn.classList.remove("highlight");
      hairstyleDragState.active = false;
      hairstyleDragState.pointerId = null;
      hairstyleDragState.moved = false;
      syncLidPosition(cupElement);
    }

    function onSleevePointerDown(event) {
      const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
      const cupState = resolveCupStateForElement(cupElement);
      if (state.currentScreen !== "world") {
        return;
      }

      if (cupElement && cupElement.dataset.cupId) {
        setActiveCupInstance(cupElement.dataset.cupId);
        bringCupElementToFront(cupElement);
      }

      showTrashCan("sleeve");
      event.preventDefault();
      event.stopPropagation();
      const parentRect = cupElement.getBoundingClientRect();
      sleeveDragState.active = true;
      sleeveDragState.pointerId = event.pointerId;
      sleeveDragState.initialLeft = cupState.sleeveDetached ? cupState.sleeveOffsetX : 32;
      sleeveDragState.initialTop = cupState.sleeveDetached ? cupState.sleeveOffsetY : 160;
      sleeveDragState.anchorX = event.clientX - parentRect.left;
      sleeveDragState.anchorY = event.clientY - parentRect.top;
      trySetPointerCapture(event.currentTarget, event.pointerId);
    }

    function onSleevePointerMove(event) {
      const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
      const cupState = resolveCupStateForElement(cupElement);
      if (!sleeveDragState.active || event.pointerId !== sleeveDragState.pointerId) {
        return;
      }

      if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
        cupState.sleeveVisible = false;
        cupState.faceVisible = false;
        renderWorldCups();
        return;
      }

      const parentRect = cupElement.getBoundingClientRect();
      const localX = event.clientX - parentRect.left;
      const localY = event.clientY - parentRect.top;
      const { nextLeft, nextTop } = clampDetachedOffset({
        initialLeft: sleeveDragState.initialLeft,
        initialTop: sleeveDragState.initialTop,
        localX,
        localY,
        anchorX: sleeveDragState.anchorX,
        anchorY: sleeveDragState.anchorY,
        minLeft: -60,
        maxLeft: 200,
        minTop: -20,
        maxTop: 220,
      });
      cupState.sleeveDetached = true;
      cupState.sleeveOffsetX = nextLeft;
      cupState.sleeveOffsetY = nextTop;
      syncSleevePosition(cupElement);
      syncFacePosition(cupElement);
    }

    function onSleevePointerUp(event) {
      const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
      const cupState = resolveCupStateForElement(cupElement);
      if (!sleeveDragState.active || event.pointerId !== sleeveDragState.pointerId) {
        return;
      }

      if (isPointerOverTrashCan(event.clientX, event.clientY)) {
        removeSelectedObject();
      } else if (isSleeveNearCup(cupElement)) {
        cupState.sleeveDetached = false;
        cupState.sleeveOffsetX = 32;
        cupState.sleeveOffsetY = 160;
      }

      trashCanBtn.classList.remove("highlight");
      sleeveDragState.active = false;
      sleeveDragState.pointerId = null;
      syncSleevePosition(cupElement);
      syncFacePosition(cupElement);
    }

    return {
      onCupPointerDown,
      onCupPointerMove,
      onCupPointerUp,
      onLidPointerDown,
      onLidPointerMove,
      onLidPointerUp,
      onHairstylePointerDown,
      onHairstylePointerMove,
      onHairstylePointerUp,
      onSleevePointerDown,
      onSleevePointerMove,
      onSleevePointerUp,
    };
  }

  window.CuppyLandCupPointerController = {
    createController,
  };
})();
