(function () {
  function createController(options) {
    const {
      state,
      worldCanvas,
      friendDragState,
      trySetPointerCapture,
      isPointerOutsideWorldCanvas,
      resolveFriendStateForElement,
      getElementDragScale,
      getWorldPointFromClient,
      getCupElementAtPoint,
      zoneForPoint,
      getCupStateById,
      getSequenceConfig,
      removeFriendInstance,
      stopChocolateMilkSequence,
      bringFriendElementToFront,
      triggerTurkeyAnimation,
      startRabbitAnimation,
      stopRabbitAnimation,
      startTriceratopsAnimation,
      stopTriceratopsAnimation,
      syncBarbieActivationState,
      updateFriendElementAsset,
      syncBackgroundObjectActivation,
      syncMerryGoRoundActivations,
      syncDoghouseActivations,
      onChocolateMilkFillStart,
      onChocolateMilkFillTick,
      onChocolateMilkFillCancel,
      onChocolateMilkFillComplete,
      onChocolateMilkFillEnd,
    } = options;
    const chocolateMilkFillDurationMs = getSequenceConfig?.().durationMs || 5000;
    const chocolateMilkFillState = {
      cupId: null,
      startedAtMs: 0,
      completed: false,
      completionTimerId: null,
    };
    let hoverMonitorIntervalId = null;

    function clearHoverMonitor() {
      if (hoverMonitorIntervalId) {
        clearInterval(hoverMonitorIntervalId);
        hoverMonitorIntervalId = null;
      }
    }

    function startHoverMonitor() {
      clearHoverMonitor();
      hoverMonitorIntervalId = setInterval(() => {
        if (!friendDragState.active || !friendDragState.friendId) {
          clearHoverMonitor();
          return;
        }
        const pointerX = friendDragState.currentClientX;
        const pointerY = friendDragState.currentClientY;
        if (!Number.isFinite(pointerX) || !Number.isFinite(pointerY)) {
          return;
        }

        const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendDragState.friendId}"]`);
        const friendState = resolveFriendStateForElement(friendElement);
        if (!friendElement || !friendState) {
          return;
        }

        updateChocolateMilkFill(friendElement, friendState, pointerX, pointerY);
      }, 120);
    }

    function setFriendDragVisual(friendElement, friendState, isDragging) {
      if (!friendElement || !friendState || friendState.type !== "chocolate-milk") {
        return;
      }

      const friendArt = friendElement.querySelector(".friend-character-art");
      if (!friendArt) {
        return;
      }

      friendArt.style.transform = isDragging ? "rotate(-45deg)" : "";
      friendArt.style.transformOrigin = isDragging ? "center center" : "";
    }

    function resetFriendDragState() {
      friendDragState.active = false;
      friendDragState.pointerId = null;
      friendDragState.friendId = null;
      friendDragState.pointerOffsetX = 0;
      friendDragState.pointerOffsetY = 0;
      friendDragState.currentClientX = null;
      friendDragState.currentClientY = null;
      friendDragState.dragStartedAtMs = 0;
      clearHoverMonitor();
    }

    function isOpenCupTarget(cupId) {
      if (!cupId) {
        return false;
      }
      const cupState = getCupStateById?.(cupId);
      if (!cupState) {
        return false;
      }
      return cupState.lidVisible === false || cupState.lidDetached === true;
    }

    function resetChocolateMilkFill(reason = "cancelled") {
      if (chocolateMilkFillState.completionTimerId) {
        clearTimeout(chocolateMilkFillState.completionTimerId);
        chocolateMilkFillState.completionTimerId = null;
      }

      if (!chocolateMilkFillState.cupId) {
        return;
      }

      const endedCupId = chocolateMilkFillState.cupId;
      if (!chocolateMilkFillState.completed && typeof onChocolateMilkFillCancel === "function") {
        onChocolateMilkFillCancel(endedCupId, reason);
      }
      if (!chocolateMilkFillState.completed && typeof onChocolateMilkFillEnd === "function") {
        onChocolateMilkFillEnd(endedCupId, reason);
      }
      chocolateMilkFillState.cupId = null;
      chocolateMilkFillState.startedAtMs = 0;
      chocolateMilkFillState.completed = false;
    }

    function completeChocolateMilkFill(cupId, friendState, friendElement) {
      if (!cupId || chocolateMilkFillState.completed) {
        return;
      }

      if (chocolateMilkFillState.completionTimerId) {
        clearTimeout(chocolateMilkFillState.completionTimerId);
        chocolateMilkFillState.completionTimerId = null;
      }

      chocolateMilkFillState.completed = true;
      if (friendState?.id) {
        removeFriendInstance(friendState.id, { playRemovedSfx: false });
      }
      if (typeof onChocolateMilkFillComplete === "function") {
        onChocolateMilkFillComplete(cupId);
      }
      setFriendDragVisual(friendElement, friendState, false);
      resetFriendDragState();
      chocolateMilkFillState.cupId = null;
      chocolateMilkFillState.startedAtMs = 0;
      chocolateMilkFillState.completed = false;
    }

    function updateChocolateMilkFill(friendElement, friendState, pointerX, pointerY) {
      if (friendState?.type !== "chocolate-milk") {
        resetChocolateMilkFill("not-chocolate-milk");
        return;
      }

      function isPointerNearCupOpening(cupElement) {
        if (!cupElement) {
          return false;
        }
        const cupRect = cupElement.getBoundingClientRect();
        const localX = pointerX - cupRect.left;
        const localY = pointerY - cupRect.top;
        return (
          localX >= cupRect.width * 0.15 &&
          localX <= cupRect.width * 0.85 &&
          localY >= cupRect.height * -0.02 &&
          localY <= cupRect.height * 0.48
        );
      }

      if (chocolateMilkFillState.cupId) {
        const activeCupElement = worldCanvas.querySelector(`.cup-character[data-cup-id="${chocolateMilkFillState.cupId}"]`);
        if (activeCupElement && isOpenCupTarget(chocolateMilkFillState.cupId) && isPointerNearCupOpening(activeCupElement)) {
          const elapsedMs = Date.now() - chocolateMilkFillState.startedAtMs;
          if (typeof onChocolateMilkFillTick === "function") {
            onChocolateMilkFillTick(
              chocolateMilkFillState.cupId,
              elapsedMs,
              Math.max(0, chocolateMilkFillDurationMs - elapsedMs)
            );
          }
          if (elapsedMs >= chocolateMilkFillDurationMs && !chocolateMilkFillState.completed) {
            completeChocolateMilkFill(chocolateMilkFillState.cupId, friendState, friendElement);
          }
          return;
        }
      }

      const previousPointerEvents = friendElement?.style?.pointerEvents || "";
      if (friendElement) {
        friendElement.style.pointerEvents = "none";
      }
      const hoveredCup = getCupElementAtPoint(pointerX, pointerY);
      const hoveredCupId = hoveredCup?.dataset?.cupId || null;
      const zone = zoneForPoint(pointerX, pointerY);
      if (friendElement) {
        friendElement.style.pointerEvents = previousPointerEvents;
      }
      const isZoneNearCupOpening = zone === "cup" || zone === "lid";
      const isPointerNearCup = isPointerNearCupOpening(hoveredCup);

      const isValidFillHover = isOpenCupTarget(hoveredCupId) && (isZoneNearCupOpening || isPointerNearCup);
      if (!isValidFillHover) {
        resetChocolateMilkFill("left-fill-zone");
        return;
      }

      const nowMs = Date.now();
      if (chocolateMilkFillState.cupId !== hoveredCupId) {
        resetChocolateMilkFill("changed-cup");
        chocolateMilkFillState.cupId = hoveredCupId;
        chocolateMilkFillState.startedAtMs = nowMs;
        chocolateMilkFillState.completed = false;
        chocolateMilkFillState.completionTimerId = setTimeout(() => {
          const isStillDraggingChocolateMilk = (
            friendDragState.active
            && friendDragState.friendId === friendState.id
            && friendState.type === "chocolate-milk"
          );
          if (!isStillDraggingChocolateMilk || chocolateMilkFillState.cupId !== hoveredCupId || !isOpenCupTarget(hoveredCupId)) {
            return;
          }
          completeChocolateMilkFill(hoveredCupId, friendState, friendElement);
        }, chocolateMilkFillDurationMs);
        if (typeof onChocolateMilkFillStart === "function") {
          onChocolateMilkFillStart(hoveredCupId);
        }
      }

      const elapsedMs = nowMs - chocolateMilkFillState.startedAtMs;
      if (typeof onChocolateMilkFillTick === "function") {
        onChocolateMilkFillTick(hoveredCupId, elapsedMs, Math.max(0, chocolateMilkFillDurationMs - elapsedMs));
      }

      if (elapsedMs >= chocolateMilkFillDurationMs && !chocolateMilkFillState.completed) {
        completeChocolateMilkFill(hoveredCupId, friendState, friendElement);
      }
    }

    function onPointerDown(event, overrides = {}) {
      if (state.currentScreen !== "world") {
        return;
      }

      const friendElement = overrides.friendElement || event.currentTarget.closest(".friend-character");
      const friendState = overrides.friendState || resolveFriendStateForElement(friendElement);
      if (!friendElement || !friendState) {
        return;
      }

      if (friendState.type === "turkey") {
        const nowMs = Date.now();
        const lastTapAtMs = Number.isFinite(friendState.lastTapAtMs) ? friendState.lastTapAtMs : 0;
        if (lastTapAtMs && nowMs - lastTapAtMs <= 320) {
          friendState.lastTapAtMs = nowMs;
          window.CuppyLandAudio?.playSfxClip?.("turkeyGobble");
          if (typeof triggerTurkeyAnimation === "function") {
            triggerTurkeyAnimation(friendState.id);
          }
          return;
        }
        friendState.lastTapAtMs = nowMs;
      }

      resetChocolateMilkFill("new-drag");
      event.preventDefault();
      event.stopPropagation();

      const pointerScale = getElementDragScale(friendElement);
      const localPointerX = (event.clientX - friendElement.getBoundingClientRect().left) / pointerScale;
      const localPointerY = (event.clientY - friendElement.getBoundingClientRect().top) / pointerScale;
      friendDragState.active = true;
      friendDragState.pointerId = event.pointerId;
      friendDragState.friendId = friendState.id;
      friendDragState.pointerOffsetX = localPointerX;
      friendDragState.pointerOffsetY = localPointerY;
      friendDragState.currentClientX = event.clientX;
      friendDragState.currentClientY = event.clientY;
      friendDragState.dragStartedAtMs = Date.now();
      if (friendState.type === "golden-puppy") {
        friendState.puppyAttachmentPending = true;
      }
      if (friendState.type === "rabbit-bead-craft" && typeof stopRabbitAnimation === "function") {
        stopRabbitAnimation(friendState.id);
        friendState.rabbitAnchorWorldX = friendState.worldX;
        friendState.rabbitAnchorWorldY = friendState.worldY;
      }
      if (friendState.type === "triceratops-bead-craft" && typeof stopTriceratopsAnimation === "function") {
        stopTriceratopsAnimation(friendState.id);
      }
      if (friendState.type === "chocolate-milk") {
        friendState.attachedCupId = null;
        friendState.sequenceCompleted = false;
        stopChocolateMilkSequence(friendState.id);
        startHoverMonitor();
      }
      if (typeof bringFriendElementToFront === "function") {
        bringFriendElementToFront(friendElement, friendState);
      }
      setFriendDragVisual(friendElement, friendState, true);
      trySetPointerCapture(friendElement, event.pointerId);
    }

    function onPointerMove(event) {
      if (!friendDragState.active || event.pointerId !== friendDragState.pointerId) {
        return;
      }

      if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
        const friendId = friendDragState.friendId;
        resetChocolateMilkFill("removed-outside-canvas");
        resetFriendDragState();
        removeFriendInstance(friendId);
        return;
      }

      const friendElement = event.currentTarget.closest(".friend-character");
      const friendState = resolveFriendStateForElement(friendElement);
      if (!friendElement || !friendState) {
        return;
      }

      const { worldX, worldY } = getWorldPointFromClient(event.clientX, event.clientY);
      friendDragState.currentClientX = event.clientX;
      friendDragState.currentClientY = event.clientY;
      const nextX = worldX - friendDragState.pointerOffsetX;
      const nextY = worldY - friendDragState.pointerOffsetY;
      friendState.worldX = Math.max(0, Math.min(worldCanvas.offsetWidth - friendElement.offsetWidth, nextX));
      friendState.worldY = Math.max(0, Math.min(worldCanvas.offsetHeight - friendElement.offsetHeight, nextY));
      friendElement.style.left = `${friendState.worldX}px`;
      friendElement.style.top = `${friendState.worldY}px`;
      if (typeof syncBarbieActivationState === "function") {
        syncBarbieActivationState(friendState);
      }
      if (typeof updateFriendElementAsset === "function") {
        updateFriendElementAsset(friendState.id);
      }
      if (typeof syncBackgroundObjectActivation === "function") {
        syncBackgroundObjectActivation(friendState, friendElement);
      }
      if (typeof syncMerryGoRoundActivations === "function") {
        syncMerryGoRoundActivations();
      }
      if (typeof syncDoghouseActivations === "function") {
        syncDoghouseActivations();
      }
      updateChocolateMilkFill(friendElement, friendState, event.clientX, event.clientY);
    }

    function onPointerUp(event) {
      if (!friendDragState.active || event.pointerId !== friendDragState.pointerId) {
        return;
      }

      const friendElement = event.currentTarget.closest(".friend-character");
      const friendState = resolveFriendStateForElement(friendElement);
      setFriendDragVisual(friendElement, friendState, false);

      if (typeof syncBarbieActivationState === "function") {
        syncBarbieActivationState(friendState);
      }
      if (typeof updateFriendElementAsset === "function") {
        updateFriendElementAsset(friendState?.id);
      }
      if (typeof syncBackgroundObjectActivation === "function") {
        syncBackgroundObjectActivation(friendState, friendElement);
      }
      if (typeof syncMerryGoRoundActivations === "function") {
        syncMerryGoRoundActivations();
      }
      if (typeof syncDoghouseActivations === "function") {
        syncDoghouseActivations(true, friendState);
        friendState.activated = false;
        if (typeof updateFriendElementAsset === "function" && friendState?.type === "golden-puppy") {
          updateFriendElementAsset(friendState.id);
        }
      }
      if (friendState?.type === "rabbit-bead-craft") {
        friendState.rabbitAnchorWorldX = friendState.worldX;
        friendState.rabbitAnchorWorldY = friendState.worldY;
        if (typeof startRabbitAnimation === "function") {
          startRabbitAnimation(friendState.id);
        }
      }
      if (friendState?.type === "triceratops-bead-craft") {
        friendState.triceratopsAnchorWorldX = friendState.worldX;
        if (typeof startTriceratopsAnimation === "function") {
          startTriceratopsAnimation(friendState.id);
        }
      }

      if (friendElement && friendState?.type === "chocolate-milk") {
        const previousPointerEvents = friendElement.style.pointerEvents || "";
        friendElement.style.pointerEvents = "none";
        const hoveredCupForMilk = getCupElementAtPoint(event.clientX, event.clientY);
        friendElement.style.pointerEvents = previousPointerEvents;
        const hoveredCupIdForMilk = hoveredCupForMilk?.dataset?.cupId || null;
        const dragElapsedMs = Date.now() - (friendDragState.dragStartedAtMs || Date.now());
        if (
          hoveredCupIdForMilk
          && dragElapsedMs >= chocolateMilkFillDurationMs
          && isOpenCupTarget(hoveredCupIdForMilk)
        ) {
          completeChocolateMilkFill(hoveredCupIdForMilk, friendState, friendElement);
        }
      }

      if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
        removeFriendInstance(friendDragState.friendId);
      }

      resetChocolateMilkFill("pointer-end");
      resetFriendDragState();
    }

    return {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    };
  }

  window.CuppyLandFriendPointerController = {
    createController,
  };
})();
