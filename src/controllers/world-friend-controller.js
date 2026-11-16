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
        return;
      }

      const attachedCup = findCupById(friendState.attachedCupId);
      if (!attachedCup) {
        friendState.attachedCupId = null;
        return;
      }

      const offsetX = Number.isFinite(friendState.attachedOffsetX) ? friendState.attachedOffsetX : 70;
      const offsetY = Number.isFinite(friendState.attachedOffsetY) ? friendState.attachedOffsetY : 64;
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
      stopChocolateMilkSequence(friendId);
      worldFriends.splice(friendIndex, 1);
      if (playRemovedSfx) {
        playSfxClip("defaultObjectRemoved");
      }
      onRenderWorldCups();
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
      renderWorldFriends,
    };
  }

  window.CuppyLandWorldFriendController = {
    createController,
  };
})();
