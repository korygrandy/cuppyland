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

    function completeChocolateMilkFill(cupId) {
      if (!cupId || chocolateMilkFillState.completed) {
        return;
      }

      if (chocolateMilkFillState.completionTimerId) {
        clearTimeout(chocolateMilkFillState.completionTimerId);
        chocolateMilkFillState.completionTimerId = null;
      }

      chocolateMilkFillState.completed = true;
      if (typeof onChocolateMilkFillComplete === "function") {
        onChocolateMilkFillComplete(cupId);
      }
      chocolateMilkFillState.cupId = null;
      chocolateMilkFillState.startedAtMs = 0;
      chocolateMilkFillState.completed = false;
    }

    function updateChocolateMilkFill(friendElement, friendState, pointerX, pointerY) {
      if (friendState?.type !== "chocolate-milk") {
        resetChocolateMilkFill("not-chocolate-milk");
        return;
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
      let isPointerNearCupOpening = false;
      if (hoveredCup) {
        const cupRect = hoveredCup.getBoundingClientRect();
        const localX = pointerX - cupRect.left;
        const localY = pointerY - cupRect.top;
        isPointerNearCupOpening = (
          localX >= cupRect.width * 0.2 &&
          localX <= cupRect.width * 0.8 &&
          localY >= cupRect.height * 0.02 &&
          localY <= cupRect.height * 0.42
        );
      }

      const isValidFillHover = isOpenCupTarget(hoveredCupId) && (isZoneNearCupOpening || isPointerNearCupOpening);
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
          completeChocolateMilkFill(hoveredCupId);
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
        completeChocolateMilkFill(hoveredCupId);
      }
    }

    function onPointerDown(event) {
      if (state.currentScreen !== "world") {
        return;
      }

      const friendElement = event.currentTarget.closest(".friend-character");
      const friendState = resolveFriendStateForElement(friendElement);
      if (!friendElement || !friendState) {
        return;
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
      if (friendState.type === "chocolate-milk") {
        friendState.attachedCupId = null;
        friendState.sequenceCompleted = false;
        stopChocolateMilkSequence(friendState.id);
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
      const nextX = worldX - friendDragState.pointerOffsetX;
      const nextY = worldY - friendDragState.pointerOffsetY;
      friendState.worldX = Math.max(0, Math.min(worldCanvas.offsetWidth - friendElement.offsetWidth, nextX));
      friendState.worldY = Math.max(0, Math.min(worldCanvas.offsetHeight - friendElement.offsetHeight, nextY));
      friendElement.style.left = `${friendState.worldX}px`;
      friendElement.style.top = `${friendState.worldY}px`;
      updateChocolateMilkFill(friendElement, friendState, event.clientX, event.clientY);
    }

    function onPointerUp(event) {
      if (!friendDragState.active || event.pointerId !== friendDragState.pointerId) {
        return;
      }

      const friendElement = event.currentTarget.closest(".friend-character");
      const friendState = resolveFriendStateForElement(friendElement);
      setFriendDragVisual(friendElement, friendState, false);

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
