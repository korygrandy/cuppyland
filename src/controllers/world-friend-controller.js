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
    } = options;

    const imagePreloadCache = new Map();

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
      if (friendState.type === "chocolate-milk") {
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
      if (!friendState) {
        return false;
      }

      return Boolean(
        friendState.activated
        || friendState.attachedCupId
        || friendState.sequenceFrame === 2
        || friendState.sequenceFrame === "activated"
      );
    }

    function resolveFriendAsset(friendState) {
      if (!friendState) {
        return "";
      }

      if (friendState.type === "chocolate-milk") {
        const sequenceConfig = getSequenceConfig();
        if (friendState.sequenceFrame === 2) {
          return sequenceConfig.frame2Asset;
        }
        if (friendState.sequenceFrame === 3) {
          return sequenceConfig.frame3Asset;
        }
      }

      if (friendState.type === "turkey") {
        if (friendState.sequenceFrame === 2) {
          return getFriendAssetMap()?.["turkey-sequence-2"] || getFriendAssetMap()?.[friendState.type] || "";
        }
        if (friendState.sequenceFrame === 1) {
          return getFriendAssetMap()?.[friendState.type] || "";
        }
      }

      if (friendState.type === "lavalamp") {
        if (friendState.sequenceFrame === 2) {
          return getFriendAssetMap()?.["lavalamp-sequence-2"] || getFriendAssetMap()?.["lavalamp-sequence-1"] || getFriendAssetMap()?.[friendState.type] || "";
        }
        if (friendState.sequenceFrame === 3) {
          return getFriendAssetMap()?.["lavalamp-sequence-3"] || getFriendAssetMap()?.["lavalamp-sequence-1"] || getFriendAssetMap()?.[friendState.type] || "";
        }
        return getFriendAssetMap()?.["lavalamp-sequence-1"] || getFriendAssetMap()?.[friendState.type] || "";
      }

      if (friendState.type === "barbie-blonde") {
        const activatedAsset = getFriendAssetMap()?.["barbie-blonde-activated"] || getFriendAssetMap()?.[friendState.type] || "";
        const defaultAsset = getFriendAssetMap()?.[friendState.type] || "";
        return isBarbieActivated(friendState) ? activatedAsset : defaultAsset;
      }

      if (friendState.type === "barbie-blonde-baby") {
        const activatedAsset = getFriendAssetMap()?.["barbie-blonde-baby-activated"] || getFriendAssetMap()?.[friendState.type] || "";
        const defaultAsset = getFriendAssetMap()?.[friendState.type] || "";
        return isBarbieActivated(friendState) ? activatedAsset : defaultAsset;
      }

      return getFriendAssetMap()?.[friendState.type] || "";
    }

    function updateFriendElementAsset(friendId) {
      const friendState = findFriendById(friendId);
      const asset = resolveFriendAsset(friendState);
      const friendArt = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"] .friend-character-art`);
      if (friendArt) {
        friendArt.style.backgroundImage = `url("${asset}")`;
      }
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

      if (friendState.type === "barbie-blonde") {
        playSfxClip("barbieBlondeSnap");
      } else if (friendState.type === "barbie-blonde-baby") {
        playSfxClip("barbieBlondeBabySnap");
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

    function resolveFriendStateForElement(friendElement) {
      const friendId = friendElement?.dataset?.friendId;
      if (!friendId) {
        return null;
      }
      const worldFriends = getWorldFriendList(state.activeWorld);
      return worldFriends.find((friend) => friend.id === friendId) || null;
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
      const { playRemovedSfx = true } = options;
      if (!state.activeWorld || !friendId) {
        return false;
      }
      const worldFriends = getWorldFriendList(state.activeWorld);
      const friendIndex = worldFriends.findIndex((friend) => friend.id === friendId);
      if (friendIndex < 0) {
        return false;
      }
      const friendState = worldFriends[friendIndex];
      if (friendState?.turkeyAnimationTimer) {
        clearTimeout(friendState.turkeyAnimationTimer);
        friendState.turkeyAnimationTimer = null;
      }
      if (friendState?.lavaLampSequenceTimer) {
        clearTimeout(friendState.lavaLampSequenceTimer);
        friendState.lavaLampSequenceTimer = null;
      }
      if (friendState?.barbieActivationTimer) {
        clearTimeout(friendState.barbieActivationTimer);
        friendState.barbieActivationTimer = null;
      }
      if (friendState?.triceratopsAnimationTimer) {
        clearTimeout(friendState.triceratopsAnimationTimer);
        friendState.triceratopsAnimationTimer = null;
      }
      if (friendState?.rabbitAnimationTimer) {
        clearTimeout(friendState.rabbitAnimationTimer);
        friendState.rabbitAnimationTimer = null;
      }
      stopChocolateMilkSequence(friendId);
      worldFriends.splice(friendIndex, 1);
      if (playRemovedSfx) {
        playSfxClip("defaultObjectRemoved");
      }
      onRenderWorldCups();
      return true;
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

    function stopTriceratopsAnimation(friendId) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "tricerotops-bead-craft") {
        return;
      }

      if (friendState.triceratopsAnimationTimer) {
        clearTimeout(friendState.triceratopsAnimationTimer);
        friendState.triceratopsAnimationTimer = null;
      }

      const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendState.id}"]`);
      const art = friendElement?.querySelector(".friend-character-art");
      if (art) {
        art.style.transform = "";
      }
    }

    function startTriceratopsAnimation(friendId) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "tricerotops-bead-craft") {
        return;
      }

      if (!Number.isFinite(friendState.triceratopsAnchorWorldX)) {
        friendState.triceratopsAnchorWorldX = friendState.worldX;
      }
      if (!friendState.triceratopsDirection) {
        friendState.triceratopsDirection = 1;
      }

      if (friendState.triceratopsAnimationTimer) {
        clearTimeout(friendState.triceratopsAnimationTimer);
        friendState.triceratopsAnimationTimer = null;
      }

      if (!Number.isFinite(friendState.triceratopsDistanceSinceEat)) {
        friendState.triceratopsDistanceSinceEat = 0;
      }

      const crawl = () => {
        const activeFriend = findFriendById(friendId);
        if (!activeFriend || activeFriend.type !== "tricerotops-bead-craft") {
          if (activeFriend) {
            activeFriend.triceratopsAnimationTimer = null;
          }
          return;
        }

        const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"]`);
        if (!friendElement) {
          activeFriend.triceratopsAnimationTimer = null;
          return;
        }

        const anchorX = Number.isFinite(activeFriend.triceratopsAnchorWorldX)
          ? activeFriend.triceratopsAnchorWorldX
          : activeFriend.worldX;
        const minWorldX = Math.max(0, Math.min(worldCanvas.offsetWidth - friendElement.offsetWidth, anchorX - 100));
        const maxWorldX = Math.max(0, Math.min(worldCanvas.offsetWidth - friendElement.offsetWidth, anchorX + 100));
        let nextX = activeFriend.worldX + (activeFriend.triceratopsDirection * 1);

        if (nextX >= maxWorldX) {
          nextX = maxWorldX;
          activeFriend.triceratopsDirection = -1;
        } else if (nextX <= minWorldX) {
          nextX = minWorldX;
          activeFriend.triceratopsDirection = 1;
        }

        activeFriend.worldX = nextX;
        friendElement.style.left = `${nextX}px`;
        const art = friendElement.querySelector(".friend-character-art");
        activeFriend.triceratopsDistanceSinceEat += activeFriend.triceratopsDirection === 1 ? 1 : -1;
        const distanceSinceEat = Math.abs(activeFriend.triceratopsDistanceSinceEat);

        if (art) {
          art.style.transform = `scaleX(${activeFriend.triceratopsDirection < 0 ? -1 : 1})`;
          art.style.transformOrigin = "center bottom";
        }

        if (distanceSinceEat >= 20) {
          activeFriend.triceratopsDistanceSinceEat = 0;
          activeFriend.triceratopsAnimationTimer = setTimeout(() => {
            const eatingFriend = findFriendById(friendId);
            const eatingElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"]`);
            if (!eatingFriend || eatingFriend.type !== "tricerotops-bead-craft" || !eatingElement) {
              return;
            }

            const eatingArt = eatingElement.querySelector(".friend-character-art");
            const facingScale = eatingFriend.triceratopsDirection < 0 ? -1 : 1;
            const eatingRotation = eatingFriend.triceratopsDirection >= 0 ? 14 : -14;
            if (eatingArt) {
              eatingArt.style.transition = "transform 2s ease-in-out";
              eatingArt.style.transform = `scaleX(${facingScale}) rotate(${eatingRotation}deg)`;
            }

            eatingFriend.triceratopsAnimationTimer = setTimeout(() => {
              const standingFriend = findFriendById(friendId);
              const standingArt = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"] .friend-character-art`);
              if (!standingFriend || standingFriend.type !== "tricerotops-bead-craft") {
                return;
              }
              if (standingArt) {
                standingArt.style.transition = "transform 400ms ease-in-out";
                standingArt.style.transform = `scaleX(${standingFriend.triceratopsDirection < 0 ? -1 : 1})`;
              }
              standingFriend.triceratopsAnimationTimer = setTimeout(crawl, 100);
            }, 2000);
          }, 2000);
          return;
        }

        activeFriend.triceratopsAnimationTimer = setTimeout(crawl, 100);
      };

      friendState.triceratopsAnimationTimer = setTimeout(crawl, 100);
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

    function stopRabbitAnimation(friendId) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "rabbit-bead-craft") {
        return;
      }

      if (friendState.rabbitAnimationTimer) {
        clearTimeout(friendState.rabbitAnimationTimer);
        friendState.rabbitAnimationTimer = null;
      }
      friendState.rabbitAnimationStep = null;

      const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendState.id}"]`);
      const art = friendElement?.querySelector(".friend-character-art");
      if (art) {
        art.style.transform = "";
      }
      if (friendElement) {
        friendElement.style.left = `${friendState.worldX || 0}px`;
        friendElement.style.top = `${friendState.worldY || 0}px`;
      }
    }

    function setRabbitPose(friendState, offsetX, offsetY, rotationDeg, flipped) {
      const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendState.id}"]`);
      if (!friendElement) {
        return;
      }

      const art = friendElement.querySelector(".friend-character-art");
      const anchorX = Number.isFinite(friendState.rabbitAnchorWorldX)
        ? friendState.rabbitAnchorWorldX
        : friendState.worldX;
      const anchorY = Number.isFinite(friendState.rabbitAnchorWorldY)
        ? friendState.rabbitAnchorWorldY
        : friendState.worldY;
      const maxX = Math.max(0, worldCanvas.offsetWidth - friendElement.offsetWidth);
      const maxY = Math.max(0, worldCanvas.offsetHeight - friendElement.offsetHeight);

      friendState.worldX = Math.max(0, Math.min(maxX, anchorX + offsetX));
      friendState.worldY = Math.max(0, Math.min(maxY, anchorY + offsetY));
      friendElement.style.left = `${friendState.worldX}px`;
      friendElement.style.top = `${friendState.worldY}px`;
      if (art) {
        art.style.transform = `scaleX(${flipped ? -1 : 1}) rotate(${rotationDeg}deg)`;
        art.style.transformOrigin = "center center";
      }
    }

    function startRabbitAnimation(friendId) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "rabbit-bead-craft") {
        return;
      }

      if (!Number.isFinite(friendState.rabbitAnchorWorldX)) {
        friendState.rabbitAnchorWorldX = friendState.worldX;
      }
      if (!Number.isFinite(friendState.rabbitAnchorWorldY)) {
        friendState.rabbitAnchorWorldY = friendState.worldY;
      }

      if (friendState.rabbitAnimationTimer) {
        clearTimeout(friendState.rabbitAnimationTimer);
      }

      setRabbitPose(friendState, 0, 0, 0, false);

      let step = 0;
      const tick = () => {
        const activeFriend = findFriendById(friendId);
        if (!activeFriend || activeFriend.type !== "rabbit-bead-craft") {
          if (activeFriend) {
            activeFriend.rabbitAnimationTimer = null;
          }
          return;
        }

        if (step < 3) {
          const hopNumber = step + 1;
          setRabbitPose(activeFriend, hopNumber * -24, -18, hopNumber % 2 ? -8 : -5, false);
          step += 1;
          activeFriend.rabbitAnimationTimer = setTimeout(() => {
            setRabbitPose(activeFriend, hopNumber * -24, 0, 0, false);
            activeFriend.rabbitAnimationTimer = setTimeout(tick, 180);
          }, 220);
          return;
        }

        if (step === 3) {
          setRabbitPose(activeFriend, -72, 0, 0, true);
          step = 4;
          activeFriend.rabbitAnimationTimer = setTimeout(tick, 220);
          return;
        }

        if (step >= 4 && step < 7) {
          const rightHopNumber = step - 3;
          setRabbitPose(activeFriend, -72 + rightHopNumber * 24, -18, rightHopNumber % 2 ? 8 : 5, true);
          step += 1;
          activeFriend.rabbitAnimationTimer = setTimeout(() => {
            setRabbitPose(activeFriend, -72 + (rightHopNumber * 24), 0, 0, true);
            activeFriend.rabbitAnimationTimer = setTimeout(tick, 180);
          }, 220);
          return;
        }

        if (step === 7) {
          setRabbitPose(activeFriend, 0, 0, 0, false);
          step = 8;
          activeFriend.rabbitAnimationTimer = setTimeout(tick, 4000);
          return;
        }

        step = 0;
        tick();
      };

      friendState.rabbitAnimationTimer = setTimeout(tick, 300);
    }

    function createFriendElement(friendState) {
      syncAttachedFriendPosition(friendState);
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
      friendElement.appendChild(art);
      friendElement.addEventListener("pointerdown", onFriendPointerDown);
      friendElement.addEventListener("pointermove", onFriendPointerMove);
      friendElement.addEventListener("pointerup", onFriendPointerUp);
      friendElement.addEventListener("pointercancel", onFriendPointerUp);
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
          worldCanvas.appendChild(createFriendElement(friendState));
          if (friendState.type === "rabbit-bead-craft") {
            startRabbitAnimation(friendState.id);
          }
          if (friendState.type === "tricerotops-bead-craft") {
            startTriceratopsAnimation(friendState.id);
          }
        });
      onRefreshChocolateMilkSequences();
    }

    return {
      resolveFriendAsset,
      updateFriendElementAsset,
      resolveFriendStateForElement,
      syncBarbieActivationState,
      syncAttachedFriendPosition,
      removeFriendInstance,
      triggerTurkeyAnimation,
      startLavaLampSequence,
      startRabbitAnimation,
      stopRabbitAnimation,
      startTriceratopsAnimation,
      stopTriceratopsAnimation,
      renderWorldFriends,
    };
  }

  window.CuppyLandWorldFriendController = {
    createController,
  };
})();
