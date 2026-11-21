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
      stopRocketManAnimation,
      startRocketManAnimation,
      syncBarbieActivationState,
      updateFriendElementAsset,
      syncBackgroundObjectActivation,
      syncMerryGoRoundActivations,
      syncDoghouseActivations,
      syncBallAvoidance = () => {},
      syncSquirrelProximity = () => {},
      resetSquirrelProximity = () => {},
      cancelPuppyExtraction,
      triggerRocketManAnimation,
      triggerBarbieActivation,
      playGoldenPuppyWithBone,
      playGoldenPuppyWithRope,
      playGoldenPuppyWithLeash,
      friendReleaseController = null,
      pauseFishbowlSequence,
      resumeFishbowlSequence,
      toggleFishbowlSequence,
      onChocolateMilkFillStart,
      onChocolateMilkFillTick,
      onChocolateMilkFillCancel,
      onChocolateMilkFillComplete,
      refreshChocolateMilkSequences,
      startChocolateMilkSpill,
      onChocolateMilkFillEnd,
      triggerFriendCelebration = () => {},
      completePuppyRequest = () => false,
      timerLifecycle = null,
    } = options;
    const chocolateMilkFillDurationMs = getSequenceConfig?.().durationMs || 5000;
    const chocolateMilkFillState = {
      cupId: null,
      startedAtMs: 0,
      completed: false,
      completionTimerId: null,
    };
    let hoverMonitorIntervalId = null;
    let activeSquirrelChases = 0;

    function setSquirrelRunningSfx(isRunning) {
      if (isRunning) {
        activeSquirrelChases = Math.max(1, activeSquirrelChases + 1);
        window.CuppyLandAudio?.playLoopingSfxClip?.("squirrelRunning");
        return;
      }
      activeSquirrelChases = Math.max(0, activeSquirrelChases - 1);
      if (activeSquirrelChases === 0) {
        window.CuppyLandAudio?.stopSfxClip?.("squirrelRunning");
      }
    }

    function stopSquirrelLoopIfNoPuppies() {
      const puppyCount = worldCanvas.querySelectorAll('.friend-character[data-friend-type="golden-puppy"]').length;
      if (puppyCount === 0) {
        resetSquirrelRunningSfx();
      }
    }

    function resetSquirrelRunningSfx() {
      activeSquirrelChases = 0;
      resetSquirrelProximity();
      window.CuppyLandAudio?.stopSfxClip?.("squirrelRunning");
    }

    window.CuppyLandSquirrelRunningSfx = {
      reset: resetSquirrelRunningSfx,
    };

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


        if (friendState.type === "fishbowl") {
          friendElement.dataset.dragging = "true";
          if (typeof pauseFishbowlSequence === "function") {
            pauseFishbowlSequence(friendState.id);
          }
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

    function syncSquirrelAvoidance(dogElement, dogState) {
      syncSquirrelProximity(dogElement, dogState);
    }


    function resetFriendDragState() {
      friendDragState.active = false;
      friendDragState.pointerId = null;
      friendDragState.friendId = null;
      friendDragState.pointerOffsetX = 0;
      friendDragState.pointerOffsetY = 0;
      friendDragState.currentClientX = null;
      friendDragState.currentClientY = null;
      friendDragState.startClientX = 0;
      friendDragState.startClientY = 0;
      friendDragState.moved = false;
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
      if (friendState.type === "golden-puppy" && friendState.sequenceActive) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (friendState.type === "golden-puppy" && friendState.activated !== true) {
        const nowMs = Date.now();
        const lastTapAtMs = Number.isFinite(friendState.lastTapAtMs) ? friendState.lastTapAtMs : 0;
        if (lastTapAtMs && nowMs - lastTapAtMs <= 450) {
          friendState.lastTapAtMs = nowMs;
          resetFriendDragState();
          event.preventDefault();
          event.stopPropagation();
          window.CuppyLandAudio?.playSfxClip?.("puppyBarking");
          return;
        }
        friendState.lastTapAtMs = nowMs;
        if (friendState.hasLeash) {
          friendState.hasLeash = false;
          friendElement.querySelector(".dog-leash-overlay")?.remove();
        }
      }

      if (
        friendState
        && friendState.type === "uke"
        && !friendDragState.moved
      ) {
        const nowMs = Date.now();
        const lastTapAtMs = Number.isFinite(friendState.lastTapAtMs) ? friendState.lastTapAtMs : 0;
        if (lastTapAtMs && nowMs - lastTapAtMs <= 450) {
          friendState.lastTapAtMs = nowMs;
          resetFriendDragState();
          event.preventDefault();
          event.stopPropagation();
          window.CuppyLandAudio?.playSfxClip?.("ukuleleActivated");
          friendState.ukeDancing = true;
          if (friendState.ukeDanceTimer) {
            clearTimeout(friendState.ukeDanceTimer);
          }
          updateFriendElementAsset?.(friendState.id);
          const danceDurationMs = window.CuppyLandGame?.friendAnimationConfig?.ukuleleDanceMs ?? 2300;
          friendState.ukeDanceTimer = setTimeout(() => {
            friendState.ukeDancing = false;
            friendState.ukeDanceTimer = null;
            updateFriendElementAsset?.(friendState.id);
          }, danceDurationMs);
          return;
        }
        friendState.lastTapAtMs = nowMs;
      }

      if (friendState?.type === "pizza-man-craft" && !friendDragState.moved) {
        const nowMs = Date.now();
        const lastTapAtMs = Number.isFinite(friendState.lastTapAtMs) ? friendState.lastTapAtMs : 0;
        if (lastTapAtMs && nowMs - lastTapAtMs <= 450) {
          friendState.lastTapAtMs = nowMs;
          resetFriendDragState();
          event.preventDefault();
          event.stopPropagation();
          window.CuppyLandFriendAnimationHelper?.togglePizzaWobble?.(friendState);
          updateFriendElementAsset?.(friendState.id);
          return;
        }
        friendState.lastTapAtMs = nowMs;
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

      if (friendState.type === "fishbowl") {
        const nowMs = Date.now();
        const lastTapAtMs = Number.isFinite(friendState.lastTapAtMs) ? friendState.lastTapAtMs : 0;
        if (lastTapAtMs && nowMs - lastTapAtMs <= 450) {
          friendState.lastTapAtMs = nowMs;
          resetFriendDragState();
          event.preventDefault();
          event.stopPropagation();
          if (typeof toggleFishbowlSequence === "function") {
            toggleFishbowlSequence(friendState.id);
          }
          window.CuppyLandAudio?.playSfxClip?.("fishbowlActivated");
          friendState.fishbowlSuppressPointerDrag = true;
          return;
        }
        friendState.lastTapAtMs = nowMs;
        friendState.fishbowlSuppressPointerDrag = false;
      }

      if (friendState.type === "rocketman-craft") {
        const nowMs = Date.now();
        const lastTapAtMs = Number.isFinite(friendState.lastTapAtMs) ? friendState.lastTapAtMs : 0;
        if (lastTapAtMs && nowMs - lastTapAtMs <= 450) {
          friendState.lastTapAtMs = nowMs;
          resetFriendDragState();
          event.preventDefault();
          event.stopPropagation();
          if (typeof triggerRocketManAnimation === "function") {
            triggerRocketManAnimation(friendState.id);
          }
          return;
        }
        friendState.lastTapAtMs = nowMs;
      }

      if (friendState.type === "chocolate-milk") {
        const nowMs = Date.now();
        const lastTapAtMs = Number.isFinite(friendState.lastTapAtMs) ? friendState.lastTapAtMs : 0;
        if (lastTapAtMs && nowMs - lastTapAtMs <= 450) {
          friendState.lastTapAtMs = nowMs;
          resetFriendDragState();
          event.preventDefault();
          event.stopPropagation();

          const hoveredCup = getCupElementAtPoint(event.clientX, event.clientY);
          const hoveredCupId = hoveredCup?.dataset?.cupId || null;
          const fallbackCupId = hoveredCupId || state.activeCupId || null;
          const fallbackCupState = fallbackCupId ? getCupStateById?.(fallbackCupId) : null;
          const hoveredCupState = hoveredCupId ? getCupStateById?.(hoveredCupId) : null;
          const activeCupState = hoveredCupState || fallbackCupState;
          const isCupOpen = Boolean(activeCupState && (activeCupState.lidVisible === false || activeCupState.lidDetached === true));
          if (fallbackCupId && isCupOpen) {
            const cupId = fallbackCupId;
            friendState.attachedCupId = cupId;
            friendState.sequenceCompleted = false;
            friendState.sequenceFrame = 2;
            refreshChocolateMilkSequences?.();
            startChocolateMilkSpill?.(friendState.id, cupId);
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
      friendDragState.startClientX = event.clientX;
      friendDragState.startClientY = event.clientY;
      friendDragState.moved = false;
      friendDragState.dragStartedAtMs = Date.now();
      if (friendState.type === "golden-puppy") {
        friendState.puppyAttachmentPending = friendState.activated !== true;
        if (friendState.isEating) {
          friendState.isEating = false;
          friendElement.classList.remove("is-eating");
          friendState.hasRope = Boolean(friendState.eatingPreviousHasRope);
          friendState.hasBone = Boolean(friendState.eatingPreviousHasBone);
          if (typeof updateFriendElementAsset === "function") {
            updateFriendElementAsset(friendState.id);
          }
        }
        if (friendState.isDrinking) {
          friendState.isDrinking = false;
          friendElement.classList.remove("is-drinking");
          friendState.hasRope = Boolean(friendState.drinkingPreviousHasRope);
          friendState.hasBone = Boolean(friendState.drinkingPreviousHasBone);
          if (typeof updateFriendElementAsset === "function") {
            updateFriendElementAsset(friendState.id);
          }
        }
      }
      if (friendState.type === "rabbit-bead-craft" && typeof stopRabbitAnimation === "function") {
        stopRabbitAnimation(friendState.id);
        friendState.rabbitAnchorWorldX = friendState.worldX;
        friendState.rabbitAnchorWorldY = friendState.worldY;
      }
      if (friendState.type === "triceratops-bead-craft" && typeof stopTriceratopsAnimation === "function") {
        stopTriceratopsAnimation(friendState.id);
      }
      if (friendState.type === "rocketman-craft" && typeof stopRocketManAnimation === "function") {
        stopRocketManAnimation(friendState.id);
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
        stopSquirrelLoopIfNoPuppies();
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
      if (
        Math.abs(event.clientX - friendDragState.startClientX) > 6
        || Math.abs(event.clientY - friendDragState.startClientY) > 6
      ) {
        friendDragState.moved = true;
      }
      const nextX = worldX - friendDragState.pointerOffsetX;
      const nextY = worldY - friendDragState.pointerOffsetY;
      friendState.worldX = Math.max(0, Math.min(worldCanvas.offsetWidth - friendElement.offsetWidth, nextX));
      const topClearance = (
        friendState.type === "dogbone"
        || friendState.type === "dog-collar"
        || friendState.type === "rope-dogtoy"
      ) ? 24 : 12;
      friendState.worldY = Math.max(
        topClearance,
        Math.min(worldCanvas.offsetHeight - friendElement.offsetHeight, nextY)
      );
      friendElement.style.left = `${friendState.worldX}px`;
      friendElement.style.top = `${friendState.worldY}px`;
      syncSquirrelAvoidance(friendElement, friendState);
      syncBallAvoidance(friendElement, friendState);
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

      if (
        friendState
        && (friendState.type === "barbie-blonde" || friendState.type === "barbie-blonde-baby")
        && !friendDragState.moved
      ) {
        const nowMs = Date.now();
        const lastTapAtMs = Number.isFinite(friendState.lastTapAtMs) ? friendState.lastTapAtMs : 0;
        if (lastTapAtMs && nowMs - lastTapAtMs <= 450) {
          friendState.lastTapAtMs = nowMs;
          resetFriendDragState();
          event.preventDefault();
          event.stopPropagation();
          triggerBarbieActivation?.(friendState.id);
          return;
        }
        friendState.lastTapAtMs = nowMs;
      }

      if (friendState?.type === "golden-puppy" && friendState.extractedFromDoghouseId && !friendDragState.moved) {
        if (typeof cancelPuppyExtraction === "function") {
          cancelPuppyExtraction(friendState);
        }
        resetChocolateMilkFill("pointer-end");
        resetFriendDragState();
        return;
      }

      if (typeof syncBarbieActivationState === "function") {
        syncBarbieActivationState(friendState);
      }
      if (typeof updateFriendElementAsset === "function") {
        updateFriendElementAsset(friendState?.id);
      }
      syncBallAvoidance(friendElement, friendState);
      if (typeof syncBackgroundObjectActivation === "function") {
        syncBackgroundObjectActivation(friendState, friendElement);
      }
      if (typeof syncMerryGoRoundActivations === "function") {
        syncMerryGoRoundActivations();
      }
      if (typeof syncDoghouseActivations === "function") {
        syncDoghouseActivations(true, friendState);
        if (friendState?.type === "golden-puppy") {
          friendState.activated = false;
          friendState.extractedFromDoghouseId = null;
        }
        if (typeof updateFriendElementAsset === "function" && friendState?.type === "golden-puppy") {
          updateFriendElementAsset(friendState.id);
        }
      }
      if (friendState?.type === "dogleash") {
        const puppyElement = window.CuppyLandFriendOverlap?.findOverlappingElement(
          worldCanvas,
          friendElement,
          '.friend-character[data-friend-type="golden-puppy"]'
        );
        const doghouseElement = window.CuppyLandFriendOverlap?.findOverlappingElement(
          worldCanvas,
          friendElement,
          '.friend-character[data-friend-type="doghouse"]'
        );
        if (puppyElement) {
          const puppyState = resolveFriendStateForElement(puppyElement);
          const canAttachToPuppy = window.CuppyLandPuppySequenceGuardHelper?.canAttachCompanion
            ? window.CuppyLandPuppySequenceGuardHelper.canAttachCompanion(puppyState)
            : !puppyState?.sequenceActive;
          if (puppyState && canAttachToPuppy) {
            puppyState.hasLeash = true;
            removeFriendInstance(friendState.id, { playRemovedSfx: false });
            const overlay = document.createElement("span");
            overlay.className = "dog-leash-overlay";
            overlay.style.backgroundImage = `url("${window.CuppyLandGame.friendAssetMap?.["leash-extended"] || window.CuppyLandGame.friendAssetMap?.dogleash || ""}")`;
            puppyElement.querySelector(".dog-leash-overlay")?.remove();
            puppyElement.appendChild(overlay);
            updateFriendElementAsset?.(puppyState.id);
          }
        } else if (doghouseElement) {
          const doghouseState = resolveFriendStateForElement(doghouseElement);
          const attachedPuppy = doghouseState?.attachedPuppyId
            ? resolveFriendStateForElement(worldCanvas.querySelector(`.friend-character[data-friend-id="${doghouseState.attachedPuppyId}"]`))
            : null;
          const canAttachToDoghousePuppy = window.CuppyLandPuppySequenceGuardHelper?.canAttachCompanion
            ? window.CuppyLandPuppySequenceGuardHelper.canAttachCompanion(attachedPuppy)
            : !attachedPuppy?.sequenceActive;
          if (attachedPuppy && canAttachToDoghousePuppy) {
            attachedPuppy.hasLeash = true;
            removeFriendInstance(friendState.id, { playRemovedSfx: false });
            updateFriendElementAsset?.(attachedPuppy.id);
          }
        }
      }
      if (friendState?.type === "dog-collar") {
        const puppyElement = window.CuppyLandFriendOverlap?.findOverlappingElement(
          worldCanvas,
          friendElement,
          '.friend-character[data-friend-type="golden-puppy"]'
        );
        if (puppyElement) {
          const puppyState = resolveFriendStateForElement(puppyElement);
          const canAttachCollar = window.CuppyLandPuppySequenceGuardHelper?.canAttachCompanion
            ? window.CuppyLandPuppySequenceGuardHelper.canAttachCompanion(puppyState)
            : !puppyState?.sequenceActive;
          if (canAttachCollar) {
            puppyState.hasCollar = true;
            removeFriendInstance(friendState.id, { playRemovedSfx: false });
            const overlay = document.createElement("span");
            overlay.className = "dog-collar-overlay";
            overlay.style.backgroundImage = `url("${window.CuppyLandGame.friendAssetMap?.["dog-collar-anchored"] || window.CuppyLandGame.friendAssetMap?.["dog-collar"] || ""}")`;
            puppyElement.querySelector(".dog-collar-overlay")?.remove();
            puppyElement.appendChild(overlay);
          }
        }
      }
      if (friendState?.type === "dogbed") {
        if (!friendState.activated && !friendState.sleeping) {
          const puppyElement = window.CuppyLandFriendOverlap?.findOverlappingElement(
            worldCanvas,
            friendElement,
            '.friend-character[data-friend-type="golden-puppy"]'
          );
          if (puppyElement) {
            const puppyState = resolveFriendStateForElement(puppyElement);
            if (puppyState) {
              friendState.activated = true;
              friendState.attachedPuppyId = null;
              friendState.bedPuppySnapshot = {
                hasBall: Boolean(puppyState.hasBall),
                hasRope: Boolean(puppyState.hasRope),
                hasBone: Boolean(puppyState.hasBone),
                hasSquirrel: Boolean(puppyState.hasSquirrel),
                hasCollar: Boolean(puppyState.hasCollar),
                hasLeash: Boolean(puppyState.hasLeash),
              };
              puppyState.dogbedId = friendState.id;
              removeFriendInstance(puppyState.id, { playRemovedSfx: false });
              updateFriendElementAsset(friendState.id);
              friendState.sleepTimer = setTimeout(() => {
                friendState.sleeping = true;
                updateFriendElementAsset(friendState.id);
              }, 4000);
            }
          }
        }
      }
      if (friendState?.type === "dogfood") {
        const bowlElement = window.CuppyLandFriendOverlap?.findOverlappingElement(
          worldCanvas,
          friendElement,
          '.friend-character[data-friend-type="dogbowl"]'
        );
        if (bowlElement) {
          const bowlState = resolveFriendStateForElement(bowlElement);
          if (bowlState) {
            bowlState.hasFood = true;
            updateFriendElementAsset(bowlState.id);
            removeFriendInstance(friendState.id, { playRemovedSfx: false });
            window.CuppyLandAudio?.playSfxClip?.("dogfoodPour");
          }
        }
      }
      if (friendState?.type === "water-bowl") {
        const puppyElement = window.CuppyLandFriendOverlap?.findOverlappingElement(
          worldCanvas,
          friendElement,
          '.friend-character[data-friend-type="golden-puppy"]'
        );
        if (puppyElement && friendState.full) {
          friendState.full = false;
          friendState.type = "water-bowl";
          updateFriendElementAsset(friendState.id);
          const puppyState = resolveFriendStateForElement(puppyElement);
          if (puppyState && !puppyState.isDrinking) {
            completePuppyRequest(puppyState, "drink");
            puppyState.drinkingPreviousHasRope = puppyState.hasRope;
            puppyState.drinkingPreviousHasBone = puppyState.hasBone;
            puppyState.isDrinking = true;
            puppyState.isEating = false;
            const puppyElementArt = worldCanvas.querySelector(`.friend-character[data-friend-id="${puppyState.id}"]`);
            puppyElementArt?.classList.add("is-drinking");
            if (typeof bringFriendElementToFront === "function") {
              bringFriendElementToFront(puppyElementArt?.closest(".friend-character") || puppyElement, puppyState);
            }
            updateFriendElementAsset(puppyState.id);
            setTimeout(() => {
              puppyState.isDrinking = false;
              puppyState.hasRope = Boolean(puppyState.drinkingPreviousHasRope);
              puppyState.hasBone = Boolean(puppyState.drinkingPreviousHasBone);
              const drinkingPuppyElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${puppyState.id}"]`);
              drinkingPuppyElement?.classList.remove("is-drinking");
              updateFriendElementAsset(puppyState.id);
            }, 4000);
          }
        }
        if (!friendState.full && state.activeWorld === "playground") {
          const fountainAnchor = window.CuppyLandWorldAnchors?.backgroundObjectAnchors?.playground?.find(
            (anchor) => anchor.id === "drinking-fountain"
          );
          if (fountainAnchor) {
            const canvasRect = worldCanvas.getBoundingClientRect();
            const scaleX = worldCanvas.offsetWidth ? canvasRect.width / worldCanvas.offsetWidth : 1;
            const scaleY = worldCanvas.offsetHeight ? canvasRect.height / worldCanvas.offsetHeight : 1;
            const fountainRect = {
              left: canvasRect.left + fountainAnchor.x * scaleX,
              right: canvasRect.left + (fountainAnchor.x + fountainAnchor.width) * scaleX,
              top: canvasRect.top + fountainAnchor.y * scaleY,
              bottom: canvasRect.top + (fountainAnchor.y + fountainAnchor.height) * scaleY,
            };
            if (window.CuppyLandFriendOverlap.rectsOverlap(friendElement.getBoundingClientRect(), fountainRect)) {
              friendState.full = true;
              updateFriendElementAsset(friendState.id);
              if (typeof syncBackgroundObjectActivation === "function") {
                syncBackgroundObjectActivation(friendState, friendElement);
              }
            }
          }
        }
      }
      if (friendState?.type === "dogbowl" || friendState?.type === "dogbowl-with-food") {
        if (friendState.type === "dogbowl-with-food" || friendState.hasFood) {
          const puppyElement = window.CuppyLandFriendOverlap?.findOverlappingElement(
            worldCanvas,
            friendElement,
            '.friend-character[data-friend-type="golden-puppy"]'
          );
          if (puppyElement) {
            const puppyState = resolveFriendStateForElement(puppyElement);
            if (puppyState && !puppyState.isEating) {
              completePuppyRequest(puppyState, "food");
              friendState.type = "dogbowl";
              friendState.hasFood = false;
              updateFriendElementAsset(friendState.id);
              puppyState.eatingPreviousHasRope = puppyState.hasRope;
              puppyState.eatingPreviousHasBone = puppyState.hasBone;
              puppyState.isEating = true;
              const puppyElementArt = worldCanvas.querySelector(`.friend-character[data-friend-id="${puppyState.id}"]`);
              puppyElementArt?.classList.add("is-eating");
              if (typeof bringFriendElementToFront === "function") {
                bringFriendElementToFront(puppyElementArt?.closest(".friend-character") || puppyElement, puppyState);
              }
              puppyState.isDrinking = false;
              updateFriendElementAsset(puppyState.id);
              setTimeout(() => {
                puppyState.isEating = false;
                puppyState.hasRope = Boolean(puppyState.eatingPreviousHasRope);
                puppyState.hasBone = Boolean(puppyState.eatingPreviousHasBone);
                const eatingPuppyElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${puppyState.id}"]`);
                eatingPuppyElement?.classList.remove("is-eating");
                updateFriendElementAsset(puppyState.id);
              }, 4000);
            }
          }
        }
      }
      friendReleaseController?.handleToyRelease(friendElement, friendState);
      friendReleaseController?.handleMotionRelease(friendState);

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

      stopSquirrelLoopIfNoPuppies();
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
