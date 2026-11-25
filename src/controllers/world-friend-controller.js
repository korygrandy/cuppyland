(function () {
  function createController(options) {
    const {
      state,
      worldCanvas,
      getWorldFriendList,
      findCupById,
      getSequenceConfig,
      getFriendAssetMap = () => ({}),
      onFriendPointerDown,
      onFriendPointerMove,
      onFriendPointerUp,
      playSfxClip = () => {},
      stopChocolateMilkSequence = () => {},
      onRenderWorldCups = () => {},
      onRefreshChocolateMilkSequences = () => {},
      onFlowerPlaced = () => {},
      motionController = null,
      syncBackgroundObjectActivation = () => {},
      removeBackgroundObjectActivation = () => {},
      onDoghousePointerDown = () => {},
      onDogbedPointerDown = () => {},
      getWorldPointFromClient = () => ({ worldX: 0, worldY: 0 }),
      petAssetController = null,
      doghouseController = null,
      puppySequenceController = null,
    } = options;

    const imagePreloadCache = new Map();
    const friendRemovalController = window.CuppyLandFriendRemovalController.createController({
      state,
      getWorldFriendList,
      playSfxClip,
      stopSfxClip: (clipName) => window.CuppyLandAudio?.stopSfxClip?.(clipName),
      motionController,
      puppySequenceController,
      removeBackgroundObjectActivation,
      stopChocolateMilkSequence,
      onRenderWorldCups,
    });

    function preloadImageAsset(assetSrc) {
      if (!assetSrc) {
        return Promise.resolve(null);
      }
      if (imagePreloadCache.has(assetSrc)) {
        return imagePreloadCache.get(assetSrc);
      }

      const image = new Image();
      const imagePromise = new Promise((resolve) => {
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = assetSrc;
      });

      imagePreloadCache.set(assetSrc, imagePromise);
      return imagePromise;
    }

    function preloadFriendSequenceAssets(friendState) {
      if (!friendState) {
        return Promise.resolve();
      }

      const targets = [];
      if (friendState.type === "lavalamp") {
        targets.push(
          getFriendAssetMap()?.["lavalamp-sequence-1"],
          getFriendAssetMap()?.["lavalamp-sequence-2"],
          getFriendAssetMap()?.["lavalamp-sequence-3"],
        );
      }
      if (friendState.type === "turkey") {
        targets.push(
          getFriendAssetMap()?.[friendState.type],
          getFriendAssetMap()?.["turkey-sequence-2"],
        );
      }
      if (friendState.type === "chocolate-milk"
        || friendState.type === "baby-mr-chocolate-milk") {
        targets.push(
          getSequenceConfig?.().frame2Asset,
          getSequenceConfig?.().frame3Asset,
          getFriendAssetMap()?.[friendState.type],
        );
      }

      const uniqueTargets = [...new Set(targets.filter(Boolean))];
      return Promise.all(uniqueTargets.map((asset) => preloadImageAsset(asset)));
    }

    function isBarbieActivated(friendState) {
      return window.CuppyLandFriendAssetResolver?.isBarbieActivated(friendState) || false;
    }

    function resolveFriendAsset(friendState) {
      return window.CuppyLandFriendAssetResolver?.resolveFriendAsset(friendState, {
        getFriendAssetMap,
        petAssetController,
      }) || "";
    }


    function syncObjectHairstyleOverlay(friendState, friendElement = null) {
      if (!friendState) {
        return;
      }
      const element = friendElement || worldCanvas.querySelector(`.friend-character[data-friend-id="${friendState.id}"]`);
      if (!element) {
        return;
      }
      let overlay = element.querySelector(".object-hairstyle-overlay");
      if (!friendState.hairstyleVisible || !friendState.hairstyle) {
        overlay?.remove();
        return;
      }
      const profile = window.CuppyLandObjectOverlayRegistry?.getProfile(friendState);
      if (!profile) {
        overlay?.remove();
        return;
      }
      if (!overlay) {
        overlay = document.createElement("span");
        overlay.className = "object-hairstyle-overlay";
        overlay.dataset.overlayForFriendId = friendState.id;
        element.appendChild(overlay);
      }
      const baseOffsetX = friendState.hairstyleDetached
        ? friendState.hairstyleOffsetX
        : profile.offsetX;
      const baseOffsetY = friendState.hairstyleDetached
        ? friendState.hairstyleOffsetY
        : profile.offsetY;
      overlay.style.width = `${profile.overlayWidth * profile.scale}px`;
      overlay.style.height = `${profile.overlayHeight * profile.scale}px`;
      overlay.style.left = `calc(50% + ${baseOffsetX}px - ${(profile.overlayWidth * profile.scale) / 2}px)`;
      overlay.style.top = `${baseOffsetY}px`;
      overlay.style.backgroundImage = `url("${window.CuppyLandGame?.hairstyleAssetMap?.[friendState.hairstyle] || ""}")`;
      overlay.style.backgroundRepeat = "no-repeat";
      overlay.style.backgroundPosition = "center";
      overlay.style.backgroundSize = "contain";
    }

    function syncBabyChocolateMilkParts(friendState, friendElement = null) {
      if (!friendState) {
        return;
      }
      const element = friendElement || worldCanvas.querySelector(`.friend-character[data-friend-id="${friendState.id}"]`);
      window.CuppyLandBabyChocolateMilkComposite?.sync(friendState, element);
    }

    function syncDogbedExtractionZone(friendState) {
      if (!friendState || friendState.type !== "dogbed") {
        return;
      }
      const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendState.id}"]`);
      if (!friendElement) {
        return;
      }
      friendElement.querySelector(".dogbed-extraction-zone")?.remove();
      if (!friendState.sleeping) {
        return;
      }
      const extractionZone = document.createElement("span");
      extractionZone.className = "dogbed-extraction-zone";
      extractionZone.setAttribute("aria-hidden", "true");
      extractionZone.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onDogbedPointerDown(friendState, event);
      });
      friendElement.appendChild(extractionZone);
    }

    function syncFriendAnimationClasses(friendState, friendElement) {
      if (!friendState || !friendElement) {
        return;
      }
      const isUkeDancing = window.CuppyLandFriendAnimationHelper?.isUkeDancing
        ? window.CuppyLandFriendAnimationHelper.isUkeDancing(friendState)
        : Boolean(friendState.type === "uke" && friendState.ukeDancing);
      const isPizzaWobbling = window.CuppyLandFriendAnimationHelper?.isPizzaWobbling
        ? window.CuppyLandFriendAnimationHelper.isPizzaWobbling(friendState)
        : Boolean(friendState.type === "pizza-man-craft" && friendState.pizzaWobbleActive);
      friendElement.classList.toggle("is-dancing", isUkeDancing);
      friendElement.classList.toggle("is-wobbling", isPizzaWobbling);
    }

    function startUkeDance(friendStateOrId, options = {}) {
      const friendState = typeof friendStateOrId === "string"
        ? findFriendById(friendStateOrId)
        : friendStateOrId;
      if (!friendState || friendState.type !== "uke") {
        return false;
      }
      friendState.ukeDancePending = false;
      const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendState.id}"]`);
      if (options.fast === true) {
        window.CuppyLandAudio?.stopSfxClip?.("ukuleleActivated");
      } else {
        window.CuppyLandAudio?.stopSfxClip?.("uke");
      }
      friendElement?.classList.toggle("is-dancing-fast", options.fast === true);
      friendElement?.querySelector(".uke-music-notes")?.remove();
      if (friendElement) {
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
          notes.appendChild(note);
          noteIndex += 1;
          setTimeout(() => note.remove(), 1700);
        };
        spawnNote();
        friendElement.ukeMusicSpawnTimer = setInterval(spawnNote, 300);
      }
      friendState.ukeDancing = true;
      updateFriendElementAsset(friendState.id);
      const finishUkeDance = () => {
        const active = findFriendById(friendState.id);
        if (!active) {
          return;
        }
        active.ukeDancing = false;
        const activeElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${active.id}"]`);
        activeElement?.querySelector(".uke-music-notes")?.remove();
        activeElement?.classList.remove("is-dancing-fast");
        if (activeElement?.ukeMusicSpawnTimer) {
          clearInterval(activeElement.ukeMusicSpawnTimer);
          activeElement.ukeMusicSpawnTimer = null;
        }
        if (activeElement?.ukeMusicStopTimer) {
          clearTimeout(activeElement.ukeMusicStopTimer);
          activeElement.ukeMusicStopTimer = null;
        }
        updateFriendElementAsset(active.id);
      };
      if (options.fast === true) {
        friendElement.ukeMusicStopTimer = setTimeout(finishUkeDance, 3000);
      }
      if (options.fast === true) {
        playSfxClip("uke", finishUkeDance);
      } else {
        playSfxClip("ukuleleActivated", finishUkeDance);
      }
      return true;
    }

    function updateFriendElementAsset(friendId) {
      const friendState = findFriendById(friendId);
      const asset = resolveFriendAsset(friendState);
      const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"]`);
      const friendArt = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"] .friend-character-art`);
      friendElement?.classList.toggle(
        "is-chocolate-milk-spilling",
        Boolean(friendState && (
          friendState.type === "chocolate-milk"
          || friendState.type === "baby-mr-chocolate-milk"
        ) && friendState.sequenceFrame)
      );
      if (friendArt) {
        friendArt.style.backgroundImage = friendState?.type === "baby-mr-chocolate-milk"
          ? "none"
          : `url("${asset}")`;
      }
      syncFriendAnimationClasses(friendState, friendElement);
      syncDogbedExtractionZone(friendState);
      syncObjectHairstyleOverlay(friendState, friendElement);
      syncBabyChocolateMilkParts(friendState, friendElement);
    }

    function findFriendById(friendId, worldId = state.activeWorld) {
      return getWorldFriendList(worldId).find((friend) => friend.id === friendId) || null;
    }

    function isBarbieFriend(friendState) {
      return Boolean(friendState && (friendState.type === "barbie-blonde" || friendState.type === "barbie-blonde-baby"));
    }

    function getBarbieAnchorZones(worldId = state.activeWorld) {
      return window.CuppyLandGame?.barbieActivationAnchors?.[worldId] || [];
    }

    function startBarbieActivationSequence(friendState) {
      if (!friendState || !isBarbieFriend(friendState)) {
        return;
      }

      if (friendState.barbieActivationTimer) {
        clearTimeout(friendState.barbieActivationTimer);
      }

      friendState.activated = true;
      updateFriendElementAsset(friendState.id);

      window.CuppyLandObjectSfxTriggerRegistry?.playSnapSfx(friendState.type, playSfxClip);

      const durationMs = window.CuppyLandGame?.barbieActivationAnchors?.durationMs ?? 2000;
      friendState.barbieActivationTimer = setTimeout(() => {
        const activeFriend = findFriendById(friendState.id);
        if (!activeFriend) {
          return;
        }
        activeFriend.activated = false;
        activeFriend.barbieActivationTimer = null;
        updateFriendElementAsset(activeFriend.id);
      }, durationMs);
    }

    function syncBarbieActivationState(friendState) {
      if (!isBarbieFriend(friendState)) {
        return false;
      }

      const anchorZones = getBarbieAnchorZones(state.activeWorld);
      const centerX = (Number.isFinite(friendState.worldX) ? friendState.worldX : 0) + 75;
      const centerY = (Number.isFinite(friendState.worldY) ? friendState.worldY : 0) + 75;
      const matchedZone = anchorZones.some((zone) => (
        centerX >= zone.x
        && centerX <= zone.x + zone.width
        && centerY >= zone.y
        && centerY <= zone.y + zone.height
      ));

      const wasInAnchorZone = Boolean(friendState.inBarbieActivationZone);
      friendState.inBarbieActivationZone = matchedZone;
      if (matchedZone && !wasInAnchorZone) {
        startBarbieActivationSequence(friendState);
      } else if (!matchedZone) {
        friendState.activated = false;
        if (friendState.barbieActivationTimer) {
          clearTimeout(friendState.barbieActivationTimer);
          friendState.barbieActivationTimer = null;
        }
        updateFriendElementAsset(friendState.id);
      }
      return matchedZone;
    }

    function triggerBarbieActivation(friendId) {
      const friendState = findFriendById(friendId);
      if (!friendState || !isBarbieFriend(friendState)) {
        return false;
      }
      friendState.activated = true;
      updateFriendElementAsset(friendState.id);
      playSfxClip(friendState.type === "barbie-blonde-baby"
        ? "blondeBarbieBabyActivated"
        : "blondeBarbieActivated");

      if (friendState.barbieActivationTimer) {
        clearTimeout(friendState.barbieActivationTimer);
      }
      const durationMs = window.CuppyLandGame?.barbieActivationAnchors?.durationMs ?? 2000;
      friendState.barbieActivationTimer = setTimeout(() => {
        const activeFriend = findFriendById(friendState.id);
        if (!activeFriend) {
          return;
        }
        activeFriend.activated = false;
        activeFriend.barbieActivationTimer = null;
        updateFriendElementAsset(activeFriend.id);
      }, durationMs);
      return true;
    }

    function resolveFriendStateForElement(friendElement) {
      const friendId = friendElement?.dataset?.friendId;
      if (!friendId) {
        return null;
      }
      const worldFriends = getWorldFriendList(state.activeWorld);
      return worldFriends.find((friend) => friend.id === friendId) || null;
    }

    function syncMerryGoRoundActivations() {
      const friendElements = Array.from(worldCanvas.querySelectorAll(".friend-character"));
      const statesById = new Map(
        getWorldFriendList(state.activeWorld).map((friendState) => [friendState.id, friendState])
      );

      friendElements
        .filter((element) => element.dataset.friendType === "merry-go-round")
        .forEach((merryElement) => {
          const merryState = statesById.get(merryElement.dataset.friendId);
          if (!merryState) {
            return;
          }

          const merryRect = merryElement.getBoundingClientRect();
          const overlappingFriendElement = friendElements.find((friendElement) => {
            if (friendElement === merryElement) {
              return false;
            }
            const friendRect = friendElement.getBoundingClientRect();
            return friendRect.right >= merryRect.left
              && friendRect.left <= merryRect.right
              && friendRect.bottom >= merryRect.top
              && friendRect.top <= merryRect.bottom;
          });
          const shouldActivate = Boolean(overlappingFriendElement);

          if (overlappingFriendElement && shouldActivate) {
            const overlappingFriendState = statesById.get(overlappingFriendElement.dataset.friendId);
            if (
              overlappingFriendState
              && (overlappingFriendState.type === "barbie-blonde" || overlappingFriendState.type === "barbie-blonde-baby")
              && overlappingFriendState.barbieMerryGoRoundAnchorId !== merryState.id
            ) {
              overlappingFriendState.barbieMerryGoRoundAnchorId = merryState.id;
              overlappingFriendState.activated = true;
              updateFriendElementAsset(overlappingFriendState.id);
              playSfxClip(overlappingFriendState.type === "barbie-blonde"
                ? "barbieBlondeSnap"
                : "barbieBlondeBabySnap");
            } else if (!overlappingFriendState || (overlappingFriendState.type !== "barbie-blonde" && overlappingFriendState.type !== "barbie-blonde-baby")) {
              friendElements.forEach((friendElement) => {
                const friendState = statesById.get(friendElement.dataset.friendId);
                if (friendState?.barbieMerryGoRoundAnchorId === merryState.id) {
                  friendState.barbieMerryGoRoundAnchorId = null;
                }
              });
            }
          } else if (merryState.activated) {
            friendElements.forEach((friendElement) => {
              const friendState = statesById.get(friendElement.dataset.friendId);
              if (friendState?.barbieMerryGoRoundAnchorId === merryState.id) {
                friendState.barbieMerryGoRoundAnchorId = null;
                friendState.activated = false;
                updateFriendElementAsset(friendState.id);
              }
            });
          }

          if (merryState.activated === shouldActivate) {
            return;
          }
          merryState.activated = shouldActivate;
          const art = merryElement.querySelector(".friend-character-art");
          const asset = shouldActivate
            ? getFriendAssetMap()?.["merry-go-round-animated"]
            : getFriendAssetMap()?.["merry-go-round"];
          if (art && asset) {
            art.style.backgroundImage = `url("${asset}")`;
          }
        });
    }

    function syncDoghouseActivations(commitAttachment = false, draggedFriendState = null) {
      doghouseController?.sync(commitAttachment, draggedFriendState);
    }

    function extractPuppyFromDoghouse(doghouseState, event) {
      return doghouseController?.extract(doghouseState, event) || null;
    }

    function extractPuppyFromDogbed(dogbedState, event) {
      if (!dogbedState || dogbedState.type !== "dogbed" || !dogbedState.sleeping) {
        return null;
      }
      const worldFriends = getWorldFriendList(state.activeWorld);
      const point = getWorldPointFromClient(event.clientX, event.clientY);
      const snapshot = dogbedState.bedPuppySnapshot || {};
      const nextZ = worldFriends.reduce((maxZ, friend) => {
        const z = Number.isFinite(friend?.zIndex) ? friend.zIndex : 90;
        return z > maxZ ? z : maxZ;
      }, 90) + 1;
      const puppyState = {
        id: `friend-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        type: "golden-puppy",
        worldX: Math.max(0, Math.min(worldCanvas.offsetWidth - 120, point.worldX - 60)),
        worldY: Math.max(12, Math.min(worldCanvas.offsetHeight - 120, point.worldY - 60)),
        zIndex: nextZ,
        activated: false,
        puppyAttachmentPending: false,
        hasBall: Boolean(snapshot.hasBall),
        hasRope: Boolean(snapshot.hasRope),
        hasBone: Boolean(snapshot.hasBone),
        hasSquirrel: Boolean(snapshot.hasSquirrel),
        hasCollar: Boolean(snapshot.hasCollar),
        hasLeash: Boolean(snapshot.hasLeash),
      };
      if (dogbedState.sleepTimer) {
        clearTimeout(dogbedState.sleepTimer);
        dogbedState.sleepTimer = null;
      }
      dogbedState.sleeping = false;
      dogbedState.activated = false;
      dogbedState.attachedPuppyId = null;
      dogbedState.bedPuppySnapshot = null;
      worldFriends.push(puppyState);
      onRenderWorldCups();
      return puppyState;
    }

    function cancelPuppyExtraction(puppyState) {
      doghouseController?.cancelPuppyExtraction(puppyState);
    }

    function pauseFishbowlSequence(friendId) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "fishbowl") {
        return;
      }
      if (friendState.fishbowlSequenceTimer) {
        clearTimeout(friendState.fishbowlSequenceTimer);
        friendState.fishbowlSequenceTimer = null;
      }
    }

    function startFishbowlSequence(friendId) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "fishbowl") {
        return;
      }

      pauseFishbowlSequence(friendId);
      if (!Number.isFinite(friendState.fishbowlSequenceFrame)) {
        friendState.fishbowlSequenceFrame = 1;
      }

      const scheduleNext = () => {
        friendState.fishbowlSequenceTimer = setTimeout(() => {
          const stillExists = findFriendById(friendId);
          if (!stillExists) {
            friendState.fishbowlSequenceTimer = null;
            return;
          }

          const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"]`);
          if (!friendElement || friendElement.dataset.dragging === "true") {
            scheduleNext();
            return;
          }

          const art1 = friendElement.querySelector(".fishbowl-sequence-a");
          const art2 = friendElement.querySelector(".fishbowl-sequence-b");
          if (!art1 || !art2) {
            scheduleNext();
            return;
          }

          if (friendState.fishbowlSequenceFrame === 1) {
            art1.style.opacity = "0";
            art2.style.opacity = "1";
            friendState.fishbowlSequenceFrame = 2;
          } else {
            art2.style.opacity = "0";
            art1.style.opacity = "1";
            friendState.fishbowlSequenceFrame = 1;
          }
          scheduleNext();
        }, 45000);
      };

      scheduleNext();
    }

    function toggleFishbowlSequence(friendId) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "fishbowl") {
        return false;
      }

      const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"]`);
      if (!friendElement) {
        return false;
      }

      const art1 = friendElement.querySelector(".fishbowl-sequence-a");
      const art2 = friendElement.querySelector(".fishbowl-sequence-b");
      if (!art1 || !art2) {
        return false;
      }

      if (!Number.isFinite(friendState.fishbowlSequenceFrame)) {
        friendState.fishbowlSequenceFrame = 1;
      }

      if (friendState.fishbowlSequenceFrame === 1) {
        art1.style.opacity = "0";
        art2.style.opacity = "1";
        friendState.fishbowlSequenceFrame = 2;
      } else {
        art2.style.opacity = "0";
        art1.style.opacity = "1";
        friendState.fishbowlSequenceFrame = 1;
      }

      startFishbowlSequence(friendId);
      return true;
    }

    function syncAttachedFriendPosition(friendState, friendElement = null) {
      if (!friendState?.attachedCupId) {
        if (friendState && (friendState.type === "barbie-blonde" || friendState.type === "barbie-blonde-baby")) {
          friendState.activated = false;
        }
        return;
      }

      const attachedCup = findCupById(friendState.attachedCupId);
      if (!attachedCup) {
        friendState.attachedCupId = null;
        return;
      }

      const offsetX = Number.isFinite(friendState.attachedOffsetX) ? friendState.attachedOffsetX : 70;
      const offsetY = Number.isFinite(friendState.attachedOffsetY) ? friendState.attachedOffsetY : 64;
      friendState.activated = Boolean(friendState.attachedCupId);
      friendState.worldX = attachedCup.state.worldX + offsetX;
      friendState.worldY = attachedCup.state.worldY + offsetY;
      if (friendElement) {
        friendElement.style.left = `${friendState.worldX}px`;
        friendElement.style.top = `${friendState.worldY}px`;
      }
    }

    function removeFriendInstance(friendId, options = {}) {
      if (!friendRemovalController) {
        return false;
      }
      return friendRemovalController.removeFriendInstance(friendId, options);
    }

    function startLavaLampSequence(friendState) {
      if (!friendState || friendState.type !== "lavalamp") {
        return false;
      }

      if (friendState.lavaLampSequenceTimer) {
        return true;
      }

      const preloadAssets = () => preloadFriendSequenceAssets(friendState)
        .then(() => {
          const frames = [1, 2, 3];
          for (let i = frames.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [frames[i], frames[j]] = [frames[j], frames[i]];
          }

          friendState.sequenceOrder = frames;
          let cursor = 0;

          const tick = () => {
            const worldFriends = getWorldFriendList(state.activeWorld) || [];
            const stillExists = worldFriends.some((friend) => friend.id === friendState.id);
            if (!stillExists) {
              friendState.lavaLampSequenceTimer = null;
              friendState.sequenceFrame = null;
              return;
            }

            friendState.sequenceFrame = frames[cursor % frames.length];
            updateFriendElementAsset(friendState.id);
            cursor += 1;
            friendState.lavaLampSequenceTimer = setTimeout(tick, 2000);
          };

          friendState.sequenceFrame = frames[0];
          updateFriendElementAsset(friendState.id);
          friendState.lavaLampSequenceTimer = setTimeout(tick, 2000);
        });

      preloadAssets();
      return true;
    }

    function triggerTurkeyAnimation(friendId) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "turkey") {
        return false;
      }

      if (friendState.turkeyAnimationTimer) {
        clearTimeout(friendState.turkeyAnimationTimer);
        friendState.turkeyAnimationTimer = null;
      }

      const frames = [1, 2, 1, 2, 1, 2];
      let step = 0;
      const tick = () => {
        if (step >= frames.length) {
          friendState.sequenceFrame = null;
          friendState.turkeyAnimationTimer = null;
          updateFriendElementAsset(friendId);
          return;
        }

        friendState.sequenceFrame = frames[step];
        updateFriendElementAsset(friendId);
        step += 1;
        friendState.turkeyAnimationTimer = setTimeout(tick, 90);
      };

      friendState.sequenceFrame = 1;
      updateFriendElementAsset(friendId);
      friendState.turkeyAnimationTimer = setTimeout(tick, 90);
      return true;
    }

    function createFriendElement(friendState) {
      syncAttachedFriendPosition(friendState);
      if (friendState.type === "golden-puppy" && friendState.attached) {
        return null;
      }
      const friendElement = document.createElement("div");
      friendElement.className = "friend-character";
      friendElement.dataset.friendId = friendState.id;
      friendElement.dataset.friendType = friendState.type;
      friendElement.style.left = `${friendState.worldX || 0}px`;
      friendElement.style.top = `${friendState.worldY || 0}px`;
      friendElement.style.zIndex = String(Number.isFinite(friendState.zIndex) ? friendState.zIndex : 90);

      const art = document.createElement("span");
      art.className = "friend-character-art";
      art.style.backgroundImage = `url("${resolveFriendAsset(friendState)}")`;
      if (friendState.type === "baby-mr-chocolate-milk") {
        art.style.backgroundImage = "none";
      }
      if (friendState.type === "flower-bead-craft") {
        art.style.transform = `scaleX(${friendState.flipped ? -1 : 1}) scaleY(1)`;
        art.style.transformOrigin = "center bottom";
      }
      friendElement.appendChild(art);
      if (friendState.type === "baby-mr-chocolate-milk") {
        window.CuppyLandBabyChocolateMilkComposite?.appendComposite(friendElement);
        syncBabyChocolateMilkParts(friendState, friendElement);
      }
      syncObjectHairstyleOverlay(friendState, friendElement);
      const shouldRenderCompanionOverlay = window.CuppyLandPuppySequenceGuardHelper?.shouldRenderCompanionOverlay
        ? window.CuppyLandPuppySequenceGuardHelper.shouldRenderCompanionOverlay(friendState)
        : !friendState.sequenceActive;
      if (
        friendState.type === "golden-puppy"
        && friendState.hasCollar
        && shouldRenderCompanionOverlay
      ) {
        const collarOverlay = document.createElement("span");
        collarOverlay.className = "dog-collar-overlay";
        collarOverlay.style.backgroundImage = `url("${getFriendAssetMap()?.["dog-collar-anchored"] || getFriendAssetMap()?.["dog-collar"] || ""}")`;
        friendElement.appendChild(collarOverlay);
      }
      if (
        friendState.type === "golden-puppy"
        && friendState.hasLeash
        && shouldRenderCompanionOverlay
      ) {
        const leashOverlay = document.createElement("span");
        leashOverlay.className = "dog-leash-overlay";
        leashOverlay.style.backgroundImage = `url("${getFriendAssetMap()?.["leash-extended"] || getFriendAssetMap()?.dogleash || ""}")`;
        leashOverlay.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          event.stopPropagation();
          onFriendPointerDown(event, { friendElement, friendState });
        });
        friendElement.appendChild(leashOverlay);
      }
      if (friendState.type === "fishbowl") {
        art.style.display = "none";
        const art1 = document.createElement("span");
        art1.className = "friend-character-art fishbowl-sequence-a";
        art1.style.position = "absolute";
        art1.style.inset = "0";
        art1.style.backgroundImage = `url("${getFriendAssetMap()?.["fishbowl-sequence-1"] || ""}")`;
        art1.style.opacity = "1";

        const art2 = document.createElement("span");
        art2.className = "friend-character-art fishbowl-sequence-b";
        art2.style.position = "absolute";
        art2.style.inset = "0";
        art2.style.backgroundImage = `url("${getFriendAssetMap()?.["fishbowl-sequence-2"] || ""}")`;
        art2.style.opacity = "0";

        friendElement.appendChild(art1);
        friendElement.appendChild(art2);
        startFishbowlSequence(friendState.id);
      }
      if (friendState.type === "doghouse" && friendState.activated) {
        const extractionZone = document.createElement("span");
        extractionZone.className = "doghouse-extraction-zone";
        extractionZone.setAttribute("aria-hidden", "true");
        extractionZone.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          event.stopPropagation();
          onDoghousePointerDown(friendState, event);
        });
        friendElement.appendChild(extractionZone);
      }
      if (friendState.type === "dogbed" && friendState.sleeping) {
        syncDogbedExtractionZone(friendState);
      }
      syncFriendAnimationClasses(friendState, friendElement);
      friendElement.addEventListener("pointerdown", onFriendPointerDown);
      friendElement.addEventListener("pointermove", onFriendPointerMove);
      friendElement.addEventListener("pointerup", onFriendPointerUp);
      friendElement.addEventListener("pointercancel", onFriendPointerUp);

      if (friendState.type === "flower-bead-craft" && friendState.flowerCelebrationPending) {
        friendState.flowerCelebrationPending = false;
        window.setTimeout(() => onFlowerPlaced(friendState, friendElement), 0);
      }
      return friendElement;
    }

    function renderWorldFriends() {
      worldCanvas.querySelectorAll(".friend-character").forEach((node) => node.remove());
      const worldFriends = getWorldFriendList(state.activeWorld);
      if (!worldFriends.length) {
        onRefreshChocolateMilkSequences();
        return;
      }

      [...worldFriends]
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
        .forEach((friendState) => {
          if (friendState.type === "lavalamp") {
            preloadFriendSequenceAssets(friendState);
            if (!friendState.lavaLampSequenceTimer) {
              startLavaLampSequence(friendState);
            }
          }
          if (isBarbieFriend(friendState)) {
            syncBarbieActivationState(friendState);
          }
          const friendElement = createFriendElement(friendState);
          if (!friendElement) {
            return;
          }
          worldCanvas.appendChild(friendElement);
          if (friendState.type === "rabbit-bead-craft") {
            motionController?.startRabbitAnimation?.(friendState.id);
          }
          if (friendState.type === "turtle-bead-craft") {
            motionController?.startTurtleAnimation?.(friendState.id);
          }
          if (friendState.type === "rocketman-craft") {
            motionController?.startRocketManAnimation?.(friendState.id);
          }
          if (friendState.type === "pizza-man-craft" && friendState.pizzaWobbleActive) {
            motionController?.startPizzaManAnimation?.(friendState.id);
          }
          if (friendState.type === "uke" && friendState.ukeDancePending) {
            friendState.ukeDancePending = false;
            window.setTimeout(() => startUkeDance(friendState.id, { fast: true }), 0);
          }
          if (friendState.type === "fishbowl") {
            startFishbowlSequence(friendState.id);
          }
          syncBackgroundObjectActivation(friendState, friendElement);
        });
      syncMerryGoRoundActivations();
      syncDoghouseActivations();
      onRefreshChocolateMilkSequences();
    }

    return {
      resolveFriendAsset,
      updateFriendElementAsset,
      resolveFriendStateForElement,
      syncBarbieActivationState,
      triggerBarbieActivation,
      syncAttachedFriendPosition,
      removeFriendInstance,
      triggerTurkeyAnimation,
      startLavaLampSequence,
      startRabbitAnimation: (friendId) => motionController?.startRabbitAnimation?.(friendId),
      stopRabbitAnimation: (friendId) => motionController?.stopRabbitAnimation?.(friendId),
      startTurtleAnimation: (friendId) => motionController?.startTurtleAnimation?.(friendId),
      stopTurtleAnimation: (friendId) => motionController?.stopTurtleAnimation?.(friendId),
      startRocketManAnimation: (friendId) => motionController?.startRocketManAnimation?.(friendId),
      stopRocketManAnimation: (friendId) => motionController?.stopRocketManAnimation?.(friendId),
      startUkeDance,
      syncMerryGoRoundActivations,
      syncDoghouseActivations,
      extractPuppyFromDoghouse,
      extractPuppyFromDogbed,
      cancelPuppyExtraction,
      pauseFishbowlSequence,
      startFishbowlSequence,
      toggleFishbowlSequence,
      renderWorldFriends,
    };
  }

  window.CuppyLandWorldFriendController = {
    createController,
  };
})();
