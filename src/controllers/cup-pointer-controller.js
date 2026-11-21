(function () {
  function createController(options) {
    const {
      state,
      cupCharacter,
      worldCanvas,
      cupDragState,
      lidDragState,
      hairstyleDragState,
      sleeveDragState,
      safeClosest,
      trySetPointerCapture,
      isPointerOutsideWorldCanvas,
      setActiveCupInstance,
      bringCupElementToFront,
      resolveCupStateForElement,
      removeCupInstance,
      renderWorldCups,
      syncCupWorldPosition,
      syncLidPosition,
      syncSleevePosition,
      syncFacePosition,
      clampDetachedOffset,
      isLidNearCup,
      isSleeveNearCup,
      isHairstyleNearLid,
      gameplayConfig,
      defaultCupState,
      findFriendById,
      refreshChocolateMilkSequences,
      startChocolateMilkSpill,
      ensureChocolateMilkForCup,
      cupPartDragController = null,
    } = options;
    const dragClamp = gameplayConfig?.dragClamp || {};
    const anchors = gameplayConfig?.anchors || {};
    const dragMovementThreshold = gameplayConfig?.dragMovementThreshold ?? 8;
    const cupLastTapAt = new Map();

    function triggerChocolateMilkSpill(cupElement, cupState) {
      if (!cupElement || !cupState) {
        return false;
      }
      const cupId = cupElement.dataset.cupId;
      if (!cupId) {
        return false;
      }
      const open = window.CuppyLandChocolateMilkSpillHelper?.isCupOpen
        ? window.CuppyLandChocolateMilkSpillHelper.isCupOpen(cupState)
        : (cupState.lidVisible === false || cupState.lidDetached === true);
      if (!open) {
        return false;
      }

      let chocolateState = ensureChocolateMilkForCup?.(cupId) || null;
      if (!chocolateState) {
        const chocolateElement = worldCanvas.querySelector('.friend-character[data-friend-type="chocolate-milk"]');
        if (chocolateElement) {
          chocolateState = findFriendById?.(chocolateElement.dataset.friendId);
        }
      }
      if (!chocolateState) {
        const chocolateElements = Array.from(worldCanvas.querySelectorAll('.friend-character[data-friend-type="chocolate-milk"]'));
        for (const element of chocolateElements) {
          const candidate = findFriendById?.(element.dataset.friendId);
          if (candidate?.attachedCupId === cupId) {
            chocolateState = candidate;
            break;
          }
        }
      }
      if (!chocolateState) {
        return false;
      }
      chocolateState.attachedCupId = cupId;
      chocolateState.sequenceCompleted = false;
      chocolateState.sequenceFrame = 2;
      refreshChocolateMilkSequences?.();
      return startChocolateMilkSpill?.(chocolateState.id, cupId) || false;
    }

    function setSleeveDragForeground(cupElement, isActive) {
      if (!cupElement) {
        return;
      }
      cupElement.classList.toggle("is-dragging-sleeve", Boolean(isActive));
    }

    function setLidDragForeground(cupElement, isActive) {
      if (!cupElement) {
        return;
      }
      cupElement.classList.toggle("is-dragging-lid", Boolean(isActive));
    }

    function setHairstyleDragForeground(cupElement, isActive) {
      if (!cupElement) {
        return;
      }
      cupElement.classList.toggle("is-dragging-hairstyle", Boolean(isActive));
    }

    function playDefaultObjectRemovedSfx() {
      window.CuppyLandAudio?.playSfxClip?.("defaultObjectRemoved");
    }

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
      cupDragState.active = true;
      cupDragState.pointerId = event.pointerId;
      cupDragState.startClientX = event.clientX;
      cupDragState.startClientY = event.clientY;
      cupDragState.startWorldX = Number.isFinite(cupState.worldX) ? cupState.worldX : 920;
      cupDragState.startWorldY = Number.isFinite(cupState.worldY) ? cupState.worldY : 430;
      cupDragState.pointerScale = getElementDragScale(cupElement);
      cupDragState.moved = false;
      if (cupElement) {
        trySetPointerCapture(cupElement, event.pointerId);
      }
    }

    function getElementDragScale(element) {
      return cupPartDragController?.getElementDragScale(element) || 1;
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

      const pointerScale = cupDragState.pointerScale || getElementDragScale(cupElement);
      const deltaX = (event.clientX - cupDragState.startClientX) / pointerScale;
      const deltaY = (event.clientY - cupDragState.startClientY) / pointerScale;
      if (Math.hypot(deltaX, deltaY) > dragMovementThreshold) {
        cupDragState.moved = true;
      }
      const maxX = Math.max(0, worldCanvas.offsetWidth - cupElement.offsetWidth);
      const maxY = Math.max(0, worldCanvas.offsetHeight - cupElement.offsetHeight);
      const nextX = Math.min(maxX, Math.max(0, cupDragState.startWorldX + deltaX));
      const nextY = Math.min(maxY, Math.max(0, cupDragState.startWorldY + deltaY));
      if (cupState.lidVisible && !cupState.lidDetached && deltaY >= 100) {
        cupState.lidVisible = false;
        cupState.lidDetached = true;
        window.CuppyLandAudio?.playSfxClip?.("lidSnapOff");
        syncLidPosition(cupElement);
        triggerChocolateMilkSpill(cupElement, cupState);
      }
      const clamped = cupPartDragController?.clampWorldPosition(nextX, nextY, cupElement)
        || { worldX: nextX, worldY: nextY };
      cupState.worldX = clamped.worldX;
      cupState.worldY = clamped.worldY;
      syncCupWorldPosition(cupElement);

    }

    function onCupPointerUp(event) {
      if (!cupDragState.active || event.pointerId !== cupDragState.pointerId) {
        return;
      }

      const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
      const cupState = resolveCupStateForElement(cupElement);
      const cupId = cupElement?.dataset?.cupId;
      if (cupId && !cupDragState.moved) {
        const nowMs = Date.now();
        const lastTapAt = cupLastTapAt.get(cupId) || 0;
        if (lastTapAt && nowMs - lastTapAt <= 450) {
          cupLastTapAt.delete(cupId);
          triggerChocolateMilkSpill(cupElement, cupState);
          cupDragState.active = false;
          cupDragState.pointerId = null;
          cupDragState.pointerScale = 1;
          return;
        }
        cupLastTapAt.set(cupId, nowMs);
      }

      cupDragState.active = false;
      cupDragState.pointerId = null;
      cupDragState.pointerScale = 1;
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

      setLidDragForeground(cupElement, true);
      event.preventDefault();
      event.stopPropagation();
      const parentRect = cupElement.getBoundingClientRect();
      lidDragState.active = true;
      lidDragState.pointerId = event.pointerId;
      lidDragState.initialLeft = cupState.lidDetached ? cupState.lidOffsetX : (defaultCupState?.lidOffsetX ?? 17);
      lidDragState.initialTop = cupState.lidDetached ? cupState.lidOffsetY : (defaultCupState?.lidOffsetY ?? 0);
      lidDragState.anchorX = event.clientX - parentRect.left;
      lidDragState.anchorY = event.clientY - parentRect.top;
      lidDragState.wasDetachedAtStart = cupState.lidDetached === true;
      lidDragState.snapOffPlayed = false;
      trySetPointerCapture(event.currentTarget, event.pointerId);
    }

    function onLidPointerMove(event) {
      const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
      const cupState = resolveCupStateForElement(cupElement);
      if (!lidDragState.active || event.pointerId !== lidDragState.pointerId) {
        return;
      }

      if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
        setLidDragForeground(cupElement, false);
        const shouldPlayRemovedSfx = cupState.lidVisible || cupState.hairstyleVisible;
        cupState.lidVisible = false;
        cupState.hairstyleVisible = false;
        if (shouldPlayRemovedSfx) {
          playDefaultObjectRemovedSfx();
        }
        renderWorldCups();
        return;
      }

      bringCupElementToFront(cupElement);

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
        minLeft: dragClamp.lid?.minLeft ?? -60,
        maxLeft: dragClamp.lid?.maxLeft ?? 200,
        minTop: dragClamp.lid?.minTop ?? -80,
        maxTop: dragClamp.lid?.maxTop ?? 120,
      });
      if (!lidDragState.wasDetachedAtStart && !lidDragState.snapOffPlayed) {
        window.CuppyLandAudio?.playSfxClip?.("lidSnapOff");
        lidDragState.snapOffPlayed = true;
      }
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

      if (isLidNearCup(cupElement)) {
        const wasDetachedBeforeSnap = cupState.lidDetached === true;
        cupState.lidDetached = false;
        cupState.lidOffsetX = defaultCupState?.lidOffsetX ?? 17;
        cupState.lidOffsetY = defaultCupState?.lidOffsetY ?? 0;
        if (wasDetachedBeforeSnap) {
          window.CuppyLandAudio?.playSfxClip?.("lidSnapOn");
        }
      }
      setLidDragForeground(cupElement, false);

      lidDragState.active = false;
      lidDragState.pointerId = null;
      lidDragState.wasDetachedAtStart = false;
      lidDragState.snapOffPlayed = false;
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

      setHairstyleDragForeground(cupElement, true);
      event.preventDefault();
      event.stopPropagation();
      const parentRect = cupElement.getBoundingClientRect();
      hairstyleDragState.active = true;
      hairstyleDragState.pointerId = event.pointerId;
      hairstyleDragState.moved = false;
      const hairAttachOffsetX = anchors.hairstyleFromLidOffsetX ?? 10;
      const lidLeft = cupState.lidDetached ? cupState.lidOffsetX : (defaultCupState?.lidOffsetX ?? 17);
      const lidTop = cupState.lidDetached ? cupState.lidOffsetY : (defaultCupState?.lidOffsetY ?? 0);
      hairstyleDragState.initialLeft = cupState.hairstyleDetached ? cupState.hairstyleOffsetX : lidLeft + hairAttachOffsetX;
      hairstyleDragState.initialTop = cupState.hairstyleDetached ? cupState.hairstyleOffsetY : lidTop + (defaultCupState?.hairstyleOffsetY ?? -22);
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
        setHairstyleDragForeground(cupElement, false);
        const shouldPlayRemovedSfx = cupState.hairstyleVisible;
        cupState.hairstyleVisible = false;
        if (shouldPlayRemovedSfx) {
          playDefaultObjectRemovedSfx();
        }
        renderWorldCups();
        return;
      }

      bringCupElementToFront(cupElement);

      const parentRect = cupElement.getBoundingClientRect();
      const localX = event.clientX - parentRect.left;
      const localY = event.clientY - parentRect.top;
      const movementDistance = Math.hypot(localX - hairstyleDragState.anchorX, localY - hairstyleDragState.anchorY);
      hairstyleDragState.moved = movementDistance > dragMovementThreshold;

      const { nextLeft, nextTop } = clampDetachedOffset({
        initialLeft: hairstyleDragState.initialLeft,
        initialTop: hairstyleDragState.initialTop,
        localX,
        localY,
        anchorX: hairstyleDragState.anchorX,
        anchorY: hairstyleDragState.anchorY,
        minLeft: dragClamp.hairstyle?.minLeft ?? -80,
        maxLeft: dragClamp.hairstyle?.maxLeft ?? 220,
        minTop: dragClamp.hairstyle?.minTop ?? -120,
        maxTop: dragClamp.hairstyle?.maxTop ?? 160,
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

      if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
        setHairstyleDragForeground(cupElement, false);
        const shouldPlayRemovedSfx = cupState.hairstyleVisible;
        cupState.hairstyleVisible = false;
        if (shouldPlayRemovedSfx) {
          playDefaultObjectRemovedSfx();
        }
        renderWorldCups();
      } else if (hairstyleDragState.moved && !isHairstyleNearLid(cupElement, cupState.hairstyleVisible)) {
        cupState.hairstyleDetached = true;
      } else {
        cupState.hairstyleDetached = false;
        cupState.hairstyleOffsetX = defaultCupState?.hairstyleOffsetX ?? 17;
        cupState.hairstyleOffsetY = defaultCupState?.hairstyleOffsetY ?? -22;
      }
      setHairstyleDragForeground(cupElement, false);

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

      setSleeveDragForeground(cupElement, true);
      event.preventDefault();
      event.stopPropagation();
      const parentRect = cupElement.getBoundingClientRect();
      sleeveDragState.active = true;
      sleeveDragState.pointerId = event.pointerId;
      sleeveDragState.initialLeft = cupState.sleeveDetached ? cupState.sleeveOffsetX : (defaultCupState?.sleeveOffsetX ?? 32);
      sleeveDragState.initialTop = cupState.sleeveDetached ? cupState.sleeveOffsetY : (defaultCupState?.sleeveOffsetY ?? 160);
      sleeveDragState.anchorX = event.clientX - parentRect.left;
      sleeveDragState.anchorY = event.clientY - parentRect.top;
      sleeveDragState.wasDetachedAtStart = cupState.sleeveDetached === true;
      sleeveDragState.snapOffPlayed = false;
      trySetPointerCapture(event.currentTarget, event.pointerId);
    }

    function onSleevePointerMove(event) {
      const cupElement = event.currentTarget.closest(".cup-character") || cupCharacter;
      const cupState = resolveCupStateForElement(cupElement);
      if (!sleeveDragState.active || event.pointerId !== sleeveDragState.pointerId) {
        return;
      }

      if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
        setSleeveDragForeground(cupElement, false);
        const shouldPlayRemovedSfx = cupState.sleeveVisible || cupState.faceVisible;
        cupState.sleeveVisible = false;
        cupState.faceVisible = false;
        if (shouldPlayRemovedSfx) {
          playDefaultObjectRemovedSfx();
        }
        renderWorldCups();
        return;
      }

      bringCupElementToFront(cupElement);

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
        minLeft: dragClamp.sleeve?.minLeft ?? -60,
        maxLeft: dragClamp.sleeve?.maxLeft ?? 200,
        minTop: dragClamp.sleeve?.minTop ?? -20,
        maxTop: dragClamp.sleeve?.maxTop ?? 220,
      });
      if (!sleeveDragState.wasDetachedAtStart && !sleeveDragState.snapOffPlayed) {
        window.CuppyLandAudio?.playSfxClip?.("sleeveSnapOff");
        sleeveDragState.snapOffPlayed = true;
      }
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

      if (isSleeveNearCup(cupElement)) {
        const wasDetachedBeforeSnap = cupState.sleeveDetached === true;
        cupState.sleeveDetached = false;
        cupState.sleeveOffsetX = defaultCupState?.sleeveOffsetX ?? 32;
        cupState.sleeveOffsetY = defaultCupState?.sleeveOffsetY ?? 160;
        if (wasDetachedBeforeSnap) {
          window.CuppyLandAudio?.playSfxClip?.("sleeveSnapOn");
        }
      }
      setSleeveDragForeground(cupElement, false);

      sleeveDragState.active = false;
      sleeveDragState.pointerId = null;
      sleeveDragState.wasDetachedAtStart = false;
      sleeveDragState.snapOffPlayed = false;
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
