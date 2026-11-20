(function () {
  function createController(options) {
    const {
      state,
      worldCanvas,
      findFriendById,
      playSfxClip = () => {},
      getFriendAssetMap = () => ({}),
      timerLifecycle = null,
    } = options;

    function playToySequence(friendId, toyType) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "golden-puppy") {
        return false;
      }

      const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"]`);
      const art = friendElement?.querySelector(".friend-character-art");
      if (!friendElement || !art) {
        return false;
      }

      if (friendState.puppyPlayTimer) {
        clearTimeout(friendState.puppyPlayTimer);
      }
      timerLifecycle?.clearPrefix(`puppy:${friendId}:`);
      friendState.puppyAttachmentPending = false;
      playSfxClip("goldenPuppyActivated");

      const anchorX = Number.isFinite(friendState.worldX) ? friendState.worldX : 0;
      const anchorY = Number.isFinite(friendState.worldY) ? friendState.worldY : 0;
      const maxX = Math.max(0, worldCanvas.offsetWidth - friendElement.offsetWidth);
      const maxY = Math.max(0, worldCanvas.offsetHeight - friendElement.offsetHeight);
      const assetMap = getFriendAssetMap();
      const isRope = toyType === "rope";
      const playingAsset = isRope
        ? assetMap["golden-puppy-playing-rope"]
        : assetMap["golden-puppy-playing"];

      art.style.transform = "";
      art.style.backgroundImage = `url("${playingAsset || ""}")`;

      const poses = [
        { x: -36, y: -18 },
        { x: -72, y: -18 },
        { x: -36, y: -18 },
        { x: 0, y: 0 },
      ];
      let poseIndex = 0;

      const applyPose = () => {
        if (!findFriendById(friendId)) {
          return;
        }
        const pose = poses[poseIndex];
        if (poseIndex === 2) {
          art.style.transform = "scaleX(-1)";
          art.style.transformOrigin = "center center";
        }
        if (poseIndex === 3) {
          art.style.transform = "";
        }

        friendState.worldX = Math.max(0, Math.min(maxX, anchorX + pose.x));
        friendState.worldY = Math.max(0, Math.min(maxY, anchorY + pose.y));
        friendElement.style.left = `${friendState.worldX}px`;
        friendElement.style.top = `${friendState.worldY}px`;
        poseIndex += 1;

        if (poseIndex < poses.length) {
          friendState.puppyPlayTimer = timerLifecycle?.set(
            `puppy:${friendId}:pose:${poseIndex}`,
            applyPose,
            260
          ) || setTimeout(applyPose, 260);
          return;
        }

        art.style.transition = "opacity 420ms ease";
        art.style.opacity = "0";
        friendState.puppyPlayTimer = timerLifecycle?.set(`puppy:${friendId}:finish`, () => {
          friendState.hasBone = !isRope;
          friendState.hasRope = isRope;
          friendState.activated = false;
          art.style.transition = "";
          art.style.opacity = "1";
          art.style.transform = "";
          const finalAsset = isRope
            ? assetMap["golden-puppy-with-rope-sitting"]
            : assetMap["golden-puppy-with-bone-sitting"];
          art.style.backgroundImage = `url("${finalAsset || assetMap["golden-puppy-sitting"] || ""}")`;
          friendState.worldX = anchorX;
          friendState.worldY = anchorY;
          friendElement.style.left = `${anchorX}px`;
          friendElement.style.top = `${anchorY}px`;
          friendState.puppyPlayTimer = null;
        }, 420) || setTimeout(() => {
          friendState.hasBone = !isRope;
          friendState.hasRope = isRope;
          friendState.activated = false;
          art.style.transition = "";
          art.style.opacity = "1";
          art.style.transform = "";
          const finalAsset = isRope
            ? assetMap["golden-puppy-with-rope-sitting"]
            : assetMap["golden-puppy-with-bone-sitting"];
          art.style.backgroundImage = `url("${finalAsset || assetMap["golden-puppy-sitting"] || ""}")`;
          friendState.worldX = anchorX;
          friendState.worldY = anchorY;
          friendElement.style.left = `${anchorX}px`;
          friendElement.style.top = `${anchorY}px`;
          friendState.puppyPlayTimer = null;
        }, 420);
      };

      applyPose();
      return true;
    }

    function stop(friendId) {
      const friendState = findFriendById(friendId);
      timerLifecycle?.clearPrefix(`puppy:${friendId}:`);
      if (friendState?.puppyPlayTimer) {
        clearTimeout(friendState.puppyPlayTimer);
      }
      if (!friendState) {
        return;
      }
      friendState.puppyPlayTimer = null;
      const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"]`);
      const art = friendElement?.querySelector(".friend-character-art");
      if (art) {
        art.style.transform = "";
        art.style.transition = "";
        art.style.opacity = "1";
      }
    }

    return {
      playWithBone: (friendId) => playToySequence(friendId, "bone"),
      playWithRope: (friendId) => playToySequence(friendId, "rope"),
      stop,
    };
  }

  window.CuppyLandPuppySequenceController = {
    createController,
  };
})();
