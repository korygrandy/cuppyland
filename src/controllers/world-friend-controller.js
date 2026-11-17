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
      const friendElement = document.createElement("div");
      friendElement.className = "friend-character";
      friendElement.dataset.friendId = friendState.id;
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
          worldCanvas.appendChild(createFriendElement(friendState));
        });
      onRefreshChocolateMilkSequences();
    }

    return {
      resolveFriendAsset,
      updateFriendElementAsset,
      resolveFriendStateForElement,
      syncAttachedFriendPosition,
      removeFriendInstance,
      triggerTurkeyAnimation,
      startLavaLampSequence,
      renderWorldFriends,
    };
  }

  window.CuppyLandWorldFriendController = {
    createController,
  };
})();
