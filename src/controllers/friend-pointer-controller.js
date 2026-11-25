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
      stopPizzaManAnimation,
      stopRocketManAnimation,
      startRocketManAnimation,
      startPizzaManAnimation,
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
      onDirectPuppyToBed = null,
      onDirectWaterSource = null,
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

    function startWalkingPuppyAudio(friendState) {
      if (!friendState?.id || friendState.walkingAudioActive) {
        return;
      }
      friendState.walkingAudioActive = true;
      window.CuppyLandAudio?.playLoopingSfxClip?.("goldenPuppyActivated");
      const scheduleBark = () => {
        if (!friendState.walkingAudioActive) {
          return;
        }
        window.CuppyLandAudio?.playSfxClip?.("puppyBarking");
        const nextDelayMs = 900 + Math.floor(Math.random() * 1100);
        friendState.walkingBarkTimer = window.setTimeout(scheduleBark, nextDelayMs);
      };
      friendState.walkingBarkTimer = window.setTimeout(scheduleBark, 650);
    }

    function stopWalkingPuppyAudio(friendState) {
      if (!friendState) {
        return;
      }
      friendState.walkingAudioActive = false;
      if (friendState.walkingBarkTimer) {
        window.clearTimeout(friendState.walkingBarkTimer);
        friendState.walkingBarkTimer = null;
      }
      window.CuppyLandAudio?.stopSfxClip?.("goldenPuppyActivated");
      window.CuppyLandAudio?.stopSfxClip?.("puppyBarking");
    }

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

    function stopUkeMusicNotes(friendElement) {
      if (!friendElement) {
        return;
      }
      friendElement.querySelector(".uke-music-notes")?.remove();
      if (friendElement.ukeMusicSpawnTimer) {
        clearInterval(friendElement.ukeMusicSpawnTimer);
        friendElement.ukeMusicSpawnTimer = null;
      }
      if (friendElement.ukeMusicStopTimer) {
        clearTimeout(friendElement.ukeMusicStopTimer);
        friendElement.ukeMusicStopTimer = null;
      }
    }

    function startUkeMusicNotes(friendElement) {
      stopUkeMusicNotes(friendElement);
      if (!friendElement) {
        return;
      }
      const notes = document.createElement("span");
      notes.className = "uke-music-notes";
      notes.setAttribute("aria-hidden", "true");
      friendElement.appendChild(notes);

      const symbols = ["\u266A", "\u266B", "\u2669", "\u266C"];
      let noteIndex = 0;
      const spawnNote = () => {
        const note = document.createElement("i");
        note.className = "uke-music-note";
        note.textContent = symbols[noteIndex % symbols.length];
        note.style.setProperty("--note-direction", noteIndex % 2 === 0 ? "-1" : "1");
        note.style.setProperty("--note-delay", `${(noteIndex % 3) * 90}ms`);
        notes.appendChild(note);
        noteIndex += 1;
        setTimeout(() => note.remove(), 1700);
      };

      spawnNote();
      friendElement.ukeMusicSpawnTimer = setInterval(spawnNote, 300);
      setTimeout(() => stopUkeMusicNotes(friendElement), Math.max(300, durationMs));
    }

    function clampFriendPosition(friendElement, friendState, nextX, nextY) {
      if (!friendElement || !friendState) {
        return { worldX: 0, worldY: 12 };
      }
      const edgeInset = 12;
      const maxX = Math.max(edgeInset, worldCanvas.offsetWidth - friendElement.offsetWidth);
      const maxY = Math.max(edgeInset, worldCanvas.offsetHeight - friendElement.offsetHeight);
      return {
        worldX: Math.max(0, Math.min(maxX, nextX)),
        worldY: Math.max(edgeInset, Math.min(maxY, nextY)),
      };
    }

    function isPointerOutsideWorldBounds(clientX, clientY, padding = 24) {
      const worldPoint = getWorldPointFromClient?.(clientX, clientY);
      if (
        !worldPoint
        || !Number.isFinite(worldPoint.worldX)
        || !Number.isFinite(worldPoint.worldY)
      ) {
        return isPointerOutsideWorldCanvas(clientX, clientY, padding);
      }
      const worldWidth = worldCanvas?.offsetWidth || 0;
      const worldHeight = worldCanvas?.offsetHeight || 0;
      return (
        worldPoint.worldX < -padding
        || worldPoint.worldX > worldWidth + padding
        || worldPoint.worldY < -padding
        || worldPoint.worldY > worldHeight + padding
      );
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
        if (friendState.type === "baby-mr-chocolate-milk") {
          const babyPart = event.target?.closest?.(
            ".baby-mr-chocolate-milk-cup-lid,"
            + ".baby-mr-chocolate-milk-cup-sleeve,"
            + ".baby-mr-chocolate-milk-hairstyle"
          );
          if (babyPart) {
            event.preventDefault();
            event.stopPropagation();
            const partType = babyPart.classList.contains("baby-mr-chocolate-milk-cup-lid")
              ? "lid"
              : babyPart.classList.contains("baby-mr-chocolate-milk-cup-sleeve")
                ? "sleeve"
                : "hairstyle";
            friendDragState.active = true;
            friendDragState.pointerId = event.pointerId;
            friendDragState.friendId = friendState.id;
            friendDragState.partType = partType;
            friendDragState.startClientX = event.clientX;
            friendDragState.startClientY = event.clientY;
            friendDragState.partStartWorldX = partType === "lid"
              ? friendState.lidOffsetX
              : partType === "sleeve"
                ? friendState.sleeveOffsetX
                : friendState.hairstyleOffsetX;
            friendDragState.partStartWorldY = partType === "lid"
              ? friendState.lidOffsetY
              : partType === "sleeve"
                ? friendState.sleeveOffsetY
                : friendState.hairstyleOffsetY;
            friendDragState.moved = false;
            trySetPointerCapture(babyPart, event.pointerId);
            return;
          }
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
      if (!friendElement || !friendState || (
        friendState.type !== "chocolate-milk"
        && friendState.type !== "baby-mr-chocolate-milk"
      )) {
        return;
      }

      const friendArt = friendElement.querySelector(".friend-character-art");
      if (!friendArt) {
        return;
      }

      friendArt.style.transform = isDragging ? "rotate(-45deg)" : "";
      friendArt.style.transformOrigin = isDragging ? "center center" : "";
    }

    function playParmesanCheeseAnimation(friendState, friendElement) {
      if (!friendState || !friendElement || friendState.type !== "parmesan-cheese") {
        return;
      }
      const art = friendElement.querySelector(".friend-character-art");
      if (art) {
        art.style.transition = "transform 520ms cubic-bezier(.2,.75,.2,1)";
        art.style.transformOrigin = "center center";
        art.style.transform = "rotate(-45deg)";
        art.classList.add("parmesan-cheese-rotated");
      }

      friendElement.querySelector(".parmesan-cheese-particles")?.remove();
      const particles = document.createElement("div");
      particles.className = "parmesan-cheese-particles";

      const elementRect = friendElement.getBoundingClientRect();
      const artRect = art?.getBoundingClientRect() || elementRect;
      const angleRad = (-45 * Math.PI) / 180;
      const localCenterX = artRect.width * 0.5;
      const localCenterY = artRect.height * 0.5;
      const upperLeftLocalX = artRect.width * 0.18;
      const upperLeftLocalY = artRect.height * 0.14;
      const rotatedStartX = localCenterX
        + ((upperLeftLocalX - localCenterX) * Math.cos(angleRad))
        - ((upperLeftLocalY - localCenterY) * Math.sin(angleRad));
      const rotatedStartY = localCenterY
        + ((upperLeftLocalX - localCenterX) * Math.sin(angleRad))
        + ((upperLeftLocalY - localCenterY) * Math.cos(angleRad));
      const localStartX = rotatedStartX;
      const localStartY = rotatedStartY;
      const localPileX = (artRect.width * 0.18) - 35;
      const localPileY = artRect.height - 8;
      const fallDistance = Math.max(60, localPileY - localStartY);

      const pile = document.createElement("span");
      pile.className = "parmesan-cheese-pile";
      pile.style.setProperty("--pile-x", `${localPileX}px`);
      pile.style.setProperty("--pile-y", `${localPileY}px`);
      pile.style.setProperty("--pile-width", `${Math.min(150, artRect.width * 0.62)}px`);
      pile.style.setProperty("--pile-delay", "780ms");
      particles.appendChild(pile);

      const pileSpecks = 52;
      for (let index = 0; index < pileSpecks; index += 1) {
        const speck = document.createElement("span");
        speck.className = "parmesan-cheese-pile-speck";
        const row = Math.floor(index / 13);
        const column = index % 13;
        const spreadX = (column - 6) * 5.2 + ((Math.random() * 3) - 1.5);
        const spreadY = (row * 3.2) + ((Math.random() * 2) - 1);
        speck.style.setProperty("--pile-speck-x", `${spreadX}px`);
        speck.style.setProperty("--pile-speck-y", `${spreadY}px`);
        speck.style.setProperty("--pile-speck-size", `${2 + Math.floor(Math.random() * 3)}px`);
        speck.style.setProperty("--pile-speck-delay", `${780 + (index * 10)}ms`);
        pile.appendChild(speck);
      }

      const count = 22;
      for (let index = 0; index < count; index += 1) {
        const particle = document.createElement("span");
        particle.className = "parmesan-cheese-particle";
        const startDrift = (Math.random() * 18) - 9;
        const endDrift = (Math.random() * 64) - 32;
        particle.style.setProperty("--cheese-start-x", `${localStartX + startDrift}px`);
        particle.style.setProperty("--cheese-start-y", `${localStartY}px`);
        particle.style.setProperty("--cheese-fall-y", `${fallDistance + (Math.random() * 18)}px`);
        particle.style.setProperty("--cheese-drift-x", `${endDrift}px`);
        particle.style.setProperty("--cheese-size", `${3 + Math.floor(Math.random() * 5)}px`);
        particle.style.setProperty("--cheese-rotation", `${-30 + Math.floor(Math.random() * 60)}deg`);
        particle.style.setProperty("--cheese-delay", `${80 + (index * 18) + Math.floor(Math.random() * 90)}ms`);
        particle.style.setProperty("--cheese-duration", `${780 + Math.floor(Math.random() * 430)}ms`);
        particles.appendChild(particle);
      }

      friendElement.appendChild(particles);
      window.setTimeout(() => {
        particles.remove();
        if (art) {
          art.classList.remove("parmesan-cheese-rotated");
          art.style.transform = "rotate(0deg)";
        }
      }, 3600);
    }

    function syncSquirrelAvoidance(dogElement, dogState) {
      syncSquirrelProximity(dogElement, dogState);
    }

    function syncPuppyFacing(friendState, friendElement) {
      window.CuppyLandPuppyFacingHelper?.syncFacing(friendState, friendElement);
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
      friendDragState.partType = null;
      friendDragState.partStartWorldX = 0;
      friendDragState.partStartWorldY = 0;
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
        friendState.attachedCupId = cupId;
        friendState.sequenceCompleted = false;
      }
      if (typeof onChocolateMilkFillComplete === "function") {
        onChocolateMilkFillComplete(cupId, friendState.type);
      }
      setFriendDragVisual(friendElement, friendState, false);
      resetFriendDragState();
      chocolateMilkFillState.cupId = null;
      chocolateMilkFillState.startedAtMs = 0;
      chocolateMilkFillState.completed = false;
    }

    function updateChocolateMilkFill(friendElement, friendState, pointerX, pointerY) {
      if (friendState?.type !== "chocolate-milk" && friendState?.type !== "baby-mr-chocolate-milk") {
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
            && (friendState.type === "chocolate-milk" || friendState.type === "baby-mr-chocolate-milk")
          );
          if (!isStillDraggingChocolateMilk || chocolateMilkFillState.cupId !== hoveredCupId || !isOpenCupTarget(hoveredCupId)) {
            return;
          }
          completeChocolateMilkFill(hoveredCupId, friendState, friendElement);
        }, chocolateMilkFillDurationMs);
        if (typeof onChocolateMilkFillStart === "function") {
          onChocolateMilkFillStart(hoveredCupId, friendState.type);
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
          friendState.walkingActive = true;
          friendState.walkingFacing = friendState.walkingFacing || "right";
          friendElement.classList.add("is-walking-puppy");
          syncPuppyFacing(friendState, friendElement);
          const assetMap = window.CuppyLandGame?.friendAssetMap || {};
          friendState.sequencePlayingAsset = friendState.hasBall
            ? (assetMap["golden-puppy-playing-with-ball"] || assetMap["golden-puppy-playing-with-leash"] || assetMap["golden-puppy-playing"] || "")
            : friendState.hasRope
              ? (assetMap["golden-puppy-playing-rope"] || assetMap["golden-puppy-playing-with-leash"] || assetMap["golden-puppy-playing"] || "")
              : friendState.hasBone
                ? (assetMap["golden-puppy-playing-bone"] || assetMap["golden-puppy-playing-with-leash"] || assetMap["golden-puppy-playing"] || "")
                : (assetMap["golden-puppy-playing-with-leash"] || assetMap["golden-puppy-playing"] || "");
          startWalkingPuppyAudio(friendState);
          updateFriendElementAsset?.(friendState.id);
        }
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

      if (friendState.type === "parmesan-cheese") {
        const nowMs = Date.now();
        const lastTapAtMs = Number.isFinite(friendState.lastTapAtMs) ? friendState.lastTapAtMs : 0;
        if (lastTapAtMs && nowMs - lastTapAtMs <= 450) {
          friendState.lastTapAtMs = nowMs;
          resetFriendDragState();
          event.preventDefault();
          event.stopPropagation();
          playParmesanCheeseAnimation(friendState, friendElement);
          return;
        }
        friendState.lastTapAtMs = nowMs;
      }

      if (friendState.type === "water-bowl") {
        const nowMs = Date.now();
        const lastTapAtMs = Number.isFinite(friendState.lastTapAtMs) ? friendState.lastTapAtMs : 0;
        if (lastTapAtMs && nowMs - lastTapAtMs <= 300) {
          friendState.lastTapAtMs = 0;
          friendState.full = true;
          friendState.type = "water-bowl";
          updateFriendElementAsset?.(friendState.id);
          syncBackgroundObjectActivation(friendState, friendElement);
          window.CuppyLandAudio?.playSfxClip?.("drinkingFountainActivated");
          resetFriendDragState();
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        friendState.lastTapAtMs = nowMs;
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

      if (friendState.type === "chocolate-milk" || friendState.type === "baby-mr-chocolate-milk") {
        const nowMs = Date.now();
        const lastTapAtMs = Number.isFinite(friendState.lastTapAtMs) ? friendState.lastTapAtMs : 0;
        if (lastTapAtMs && nowMs - lastTapAtMs <= 450) {
          friendState.lastTapAtMs = nowMs;
          resetFriendDragState();
          event.preventDefault();
          event.stopPropagation();

          const hoveredCup = getCupElementAtPoint(event.clientX, event.clientY);
          const hoveredCupId = window.CuppyLandChocolateMilkSpillHelper?.getDoubleTapCupId
            ? window.CuppyLandChocolateMilkSpillHelper.getDoubleTapCupId(friendState, hoveredCup?.dataset?.cupId || null)
            : (hoveredCup?.dataset?.cupId || friendState.attachedCupId || null);
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
      const normalizedPosition = clampFriendPosition(
        friendElement,
        friendState,
        friendState.worldX,
        friendState.worldY
      );
      friendState.worldX = normalizedPosition.worldX;
      friendState.worldY = normalizedPosition.worldY;
      friendElement.style.left = `${friendState.worldX}px`;
      friendElement.style.top = `${friendState.worldY}px`;
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
      if (friendState.type === "pizza-man-craft" && typeof stopPizzaManAnimation === "function") {
        stopPizzaManAnimation(friendState.id);
        friendState.pizzaAnchorWorldX = friendState.worldX;
        friendState.pizzaAnchorWorldY = friendState.worldY;
      }
      if (friendState.type === "chocolate-milk" || friendState.type === "baby-mr-chocolate-milk") {
        friendState.attachedCupId = null;
        friendState.sequenceCompleted = false;
        friendState.sequenceFrame = null;
        friendState.activated = false;
        friendState.attachedOffsetX = 0;
        friendState.attachedOffsetY = 0;
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

      if (friendDragState.partType) {
        const friendElement = event.currentTarget.closest(".friend-character");
        const friendState = resolveFriendStateForElement(friendElement);
        if (!friendElement || !friendState) {
          return;
        }
        const pointerScale = getElementDragScale(friendElement);
        const deltaX = (event.clientX - friendDragState.startClientX) / pointerScale;
        const deltaY = (event.clientY - friendDragState.startClientY) / pointerScale;
        if (Math.hypot(deltaX, deltaY) > 6) {
          friendDragState.moved = true;
        }
        const nextOffsetX = (friendDragState.partStartWorldX || 0) + deltaX / .65;
        const nextOffsetY = (friendDragState.partStartWorldY || 0) + deltaY / .65;
        if (friendDragState.partType === "lid") {
          friendState.lidDetached = true;
          friendState.lidOffsetX = nextOffsetX;
          friendState.lidOffsetY = nextOffsetY;
        } else if (friendDragState.partType === "sleeve") {
          friendState.sleeveDetached = true;
          friendState.sleeveOffsetX = nextOffsetX;
          friendState.sleeveOffsetY = nextOffsetY;
        } else {
          friendState.hairstyleDetached = true;
          friendState.hairstyleOffsetX = nextOffsetX;
          friendState.hairstyleOffsetY = nextOffsetY;
        }
        updateFriendElementAsset(friendState.id);
        event.preventDefault();
        event.stopPropagation();
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
      const safePosition = clampFriendPosition(friendElement, friendState, nextX, nextY);
      if (friendState.type === "golden-puppy" && friendState.hasLeash) {
        window.CuppyLandPuppyFacingHelper?.updateFacingFromMovement(
          friendState,
          friendState.worldX,
          safePosition.worldX
        );
        friendState.walkingActive = true;
        friendElement.classList.add("is-walking-puppy");
        syncPuppyFacing(friendState, friendElement);
      }
      friendState.worldX = safePosition.worldX;
      friendState.worldY = safePosition.worldY;
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
      if (friendState.type === "water-bowl" && !friendState.full) {
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
          const friendRect = friendElement.getBoundingClientRect();
          if (window.CuppyLandFriendOverlap?.rectsOverlap(friendRect, fountainRect)) {
            friendState.full = true;
            updateFriendElementAsset?.(friendState.id);
            syncBackgroundObjectActivation(friendState, friendElement);
            window.CuppyLandAudio?.playSfxClip?.("drinkingFountainActivated");
          }
        }
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

      if (friendDragState.partType) {
        const friendElement = event.currentTarget.closest(".friend-character");
        const friendState = resolveFriendStateForElement(friendElement);
        if (friendState) {
          if (friendDragState.partType === "lid") {
            if (Math.abs(friendState.lidOffsetX) < 45 && Math.abs(friendState.lidOffsetY) < 45) {
              friendState.lidDetached = false;
              friendState.lidOffsetX = 11;
              friendState.lidOffsetY = 0;
            }
          } else if (friendDragState.partType === "sleeve") {
            if (Math.abs(friendState.sleeveOffsetX - 20) < 45 && Math.abs(friendState.sleeveOffsetY - 104) < 45) {
              friendState.sleeveDetached = false;
              friendState.sleeveOffsetX = 20;
              friendState.sleeveOffsetY = 104;
            }
          } else if (friendState.hairstyle) {
            if (Math.abs(friendState.hairstyleOffsetX - 17) < 55 && Math.abs(friendState.hairstyleOffsetY + 14) < 55) {
              friendState.hairstyleDetached = false;
              friendState.hairstyleOffsetX = 17;
              friendState.hairstyleOffsetY = -14;
            }
          }
          updateFriendElementAsset(friendState.id);
        }
        resetFriendDragState();
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const friendElement = event.currentTarget.closest(".friend-character");
      const friendState = resolveFriendStateForElement(friendElement);
      setFriendDragVisual(friendElement, friendState, false);

      if (
        friendState
        && friendState.type === "uke"
        && !friendDragState.moved
      ) {
        const nowMs = Date.now();
        const lastTapAtMs = Number.isFinite(friendState.lastTapAtMs) ? friendState.lastTapAtMs : 0;
        if (lastTapAtMs && nowMs - lastTapAtMs <= 450) {
          friendState.lastTapAtMs = 0;
          resetFriendDragState();
          event.preventDefault();
          event.stopPropagation();
          window.CuppyLandAudio?.stopSfxClip?.("uke");
          friendState.ukeDancePending = false;
          window.CuppyLandAudio?.playSfxClip?.("ukuleleActivated", () => {
            if (friendElement) {
              if (friendState.ukeDanceTimer) {
                clearTimeout(friendState.ukeDanceTimer);
                friendState.ukeDanceTimer = null;
              }
              friendState.ukeDancing = false;
              friendState.ukeDanceTimer = null;
              friendElement.classList.remove("is-dancing");
              friendElement.classList.remove("is-dancing-fast");
              stopUkeMusicNotes(friendElement);
              updateFriendElementAsset?.(friendState.id);
            }
          });
          friendState.ukeDancing = true;
          friendElement?.classList.add("is-dancing");
          friendElement?.classList.remove("is-dancing-fast");
          if (friendElement) {
            startUkeMusicNotes(friendElement);
          }
          updateFriendElementAsset?.(friendState.id);
          return;
        }
        friendState.lastTapAtMs = nowMs;
      }

      if (friendState?.type === "pizza-man-craft" && !friendDragState.moved) {
        const nowMs = Date.now();
        const lastTapAtMs = Number.isFinite(friendState.lastTapAtMs) ? friendState.lastTapAtMs : 0;
        if (lastTapAtMs && nowMs - lastTapAtMs <= 450) {
          friendState.lastTapAtMs = 0;
          resetFriendDragState();
          event.preventDefault();
          event.stopPropagation();
          const wobbleEnabled = window.CuppyLandFriendAnimationHelper?.togglePizzaWobble?.(friendState);
          if (wobbleEnabled) {
            friendState.pizzaAnchorWorldX = friendState.worldX;
            friendState.pizzaAnchorWorldY = friendState.worldY;
            startPizzaManAnimation?.(friendState.id);
          } else {
            stopPizzaManAnimation?.(friendState.id);
          }
          updateFriendElementAsset?.(friendState.id);
          return;
        }
        friendState.lastTapAtMs = nowMs;
      }

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

      if (friendState?.type === "golden-puppy" && friendDragState.moved) {
        const bedElement = window.CuppyLandFriendOverlap?.findOverlappingElement(
          worldCanvas,
          friendElement,
          '.friend-character[data-friend-type="dogbed"]'
        );
        if (bedElement) {
          onDirectPuppyToBed?.(bedElement.dataset.friendId, friendState.id);
        }
      }

      if ((friendState?.type === "fishbowl" || friendState?.type === "water-bottle") && friendDragState.moved) {
        const bowlElement = window.CuppyLandFriendOverlap?.findOverlappingElement(
          worldCanvas,
          friendElement,
          '.friend-character[data-friend-type="water-bowl"]'
        );
        if (bowlElement) {
          onDirectWaterSource?.(bowlElement.dataset.friendId, friendState.type);
          removeFriendInstance(friendState.id, { playRemovedSfx: false });
        }
      }

      if (friendState?.type === "golden-puppy" && friendState.hasLeash) {
        friendState.walkingActive = false;
        friendState.sequencePlayingAsset = null;
        friendElement?.classList.remove("is-walking-puppy");
        syncPuppyFacing(friendState, friendElement);
        stopWalkingPuppyAudio(friendState);
        updateFriendElementAsset?.(friendState.id);
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
          const canAttachToPuppy = window.CuppyLandPuppySequenceGuardHelper?.canAttachLeash
            ? window.CuppyLandPuppySequenceGuardHelper.canAttachLeash(puppyState)
            : Boolean(puppyState?.hasCollar && !puppyState?.sequenceActive);
          if (puppyState && canAttachToPuppy) {
            puppyState.hasLeash = true;
            removeFriendInstance(friendState.id, { playRemovedSfx: false });
            const overlay = document.createElement("span");
            overlay.className = "dog-leash-overlay";
            overlay.style.backgroundImage = `url("${window.CuppyLandGame.friendAssetMap?.["leash-extended"] || window.CuppyLandGame.friendAssetMap?.dogleash || ""}")`;
            overlay.style.pointerEvents = "auto";
            overlay.addEventListener("pointerdown", (event) => {
              event.preventDefault();
              event.stopPropagation();
              onPointerDown(event, { friendElement: puppyElement, friendState: puppyState });
            });
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
          const canAttachLeashToDoghousePuppy = window.CuppyLandPuppySequenceGuardHelper?.canAttachLeash
            ? window.CuppyLandPuppySequenceGuardHelper.canAttachLeash(attachedPuppy)
            : Boolean(attachedPuppy?.hasCollar && !attachedPuppy?.sequenceActive);
          if (attachedPuppy && canAttachToDoghousePuppy && canAttachLeashToDoghousePuppy) {
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
      if (friendState?.type === "dogtoy-ball") {
        const puppyElement = window.CuppyLandFriendOverlap?.findOverlappingElement(
          worldCanvas,
          friendElement,
          '.friend-character[data-friend-type="golden-puppy"]'
        );
        const puppyState = puppyElement ? resolveFriendStateForElement(puppyElement) : null;
        if (puppyState && !puppyState.sequenceActive && !puppyState.hasBall) {
          const claimed = window.CuppyLandPuppyBallClaimHelper?.tryClaim
            ? window.CuppyLandPuppyBallClaimHelper.tryClaim(friendState, puppyState.id)
            : true;
          if (claimed) {
            const started = playGoldenPuppyWithBall?.(puppyState.id, {
              ballOrigin: "canvas",
              ballFriendId: friendState.id,
            });
            if (started) {
              removeFriendInstance(friendState.id, { playRemovedSfx: false });
              friendElement?.remove?.();
              const scheduleCleanup = typeof window.setTimeout === "function"
                ? window.setTimeout.bind(window)
                : () => {};
              scheduleCleanup(() => {
                removeFriendInstance(friendState.id, { playRemovedSfx: false });
                worldCanvas.querySelector(`.friend-character[data-friend-id="${friendState.id}"]`)?.remove?.();
              }, 50);
              scheduleCleanup(() => {
                removeFriendInstance(friendState.id, { playRemovedSfx: false });
                worldCanvas.querySelector(`.friend-character[data-friend-id="${friendState.id}"]`)?.remove?.();
              }, 500);
              scheduleCleanup(() => {
                removeFriendInstance(friendState.id, { playRemovedSfx: false });
                worldCanvas.querySelector(`.friend-character[data-friend-id="${friendState.id}"]`)?.remove?.();
              }, 1500);
              window.CuppyLandPuppyBallClaimHelper?.release?.(friendState, puppyState.id);
            } else {
              window.CuppyLandPuppyBallClaimHelper?.release?.(friendState, puppyState.id);
            }
          }
        }
      }
      friendReleaseController?.handleToyRelease(friendElement, friendState);
      friendReleaseController?.handleMotionRelease(friendState);

      if (friendElement && (
        friendState?.type === "chocolate-milk"
        || friendState?.type === "baby-mr-chocolate-milk"
      )) {
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

      if (
        friendDragState.moved
        && isPointerOutsideWorldBounds(event.clientX, event.clientY, 24)
      ) {
        const friendIdToRemove = friendState?.id || friendDragState.friendId;
        removeFriendInstance(friendIdToRemove);
      }

      stopSquirrelLoopIfNoPuppies();
      resetChocolateMilkFill("pointer-end");
      resetFriendDragState();
    }

    return {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      clampFriendPosition,
    };
  }

  window.CuppyLandFriendPointerController = {
    createController,
  };
})();
