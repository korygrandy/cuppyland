(function () {
  function createController(options) {
    const {
      state,
      worldCanvas,
      findFriendById,
      playSfxClip = () => {},
      getFriendAssetMap = () => ({}),
      timerLifecycle = null,
      removeFriendInstance = () => false,
    } = options;

    function playToySequence(friendId, toyType, options = {}) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "golden-puppy") {
        return false;
      }
      const canStartSequence = window.CuppyLandPuppySequenceGuardHelper?.canStartSequence
        ? window.CuppyLandPuppySequenceGuardHelper.canStartSequence(friendState)
        : !friendState.sequenceActive;
      if (!canStartSequence) {
        return false;
      }

      const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"]`);
      friendElement?.querySelector(".puppy-playing-ball")?.remove();
      const art = friendElement?.querySelector(".friend-character-art");
      if (!friendElement || !art) {
        return false;
      }
      const previousPose = {
        worldX: Number.isFinite(friendState.worldX) ? friendState.worldX : 0,
        worldY: Number.isFinite(friendState.worldY) ? friendState.worldY : 0,
        transform: art.style.transform || "",
        transformOrigin: art.style.transformOrigin || "",
      };
      friendState.preSequencePose = previousPose;
      friendState.sequenceActive = true;

      if (friendState.puppyPlayTimer) {
        clearTimeout(friendState.puppyPlayTimer);
      }
      timerLifecycle?.clearPrefix(`puppy:${friendId}:`);
      friendState.puppyAttachmentPending = false;
      friendState.isDrinking = false;
      friendState.isEating = false;
      friendElement.querySelector(".dog-collar-overlay")?.remove();
      friendElement.querySelector(".dog-leash-overlay")?.remove();
      playSfxClip("goldenPuppyActivated");

      const anchorX = Number.isFinite(friendState.worldX) ? friendState.worldX : 0;
      const anchorY = Number.isFinite(friendState.worldY) ? friendState.worldY : 0;
      const maxX = Math.max(0, worldCanvas.offsetWidth - friendElement.offsetWidth);
      const maxY = Math.max(0, worldCanvas.offsetHeight - friendElement.offsetHeight);
      const assetMap = getFriendAssetMap();
      const isRope = toyType === "rope";
      const isBone = toyType === "bone";
      const isBall = toyType === "ball";
      const isLeash = toyType === "leash";
      const isSquirrel = toyType === "squirrel";
      if (isBall && friendState.hasBall) {
        friendState.sequenceActive = false;
        return false;
      }
      if (isBall && options.ballFriendId) {
        removeFriendInstance(options.ballFriendId, { playRemovedSfx: false });
        worldCanvas.querySelector(`.friend-character[data-friend-id="${options.ballFriendId}"]`)?.remove?.();
      }
      if (isSquirrel && friendState.hasSquirrel) {
        friendState.sequenceActive = false;
        return false;
      }
      const playingAsset = window.CuppyLandPuppySequenceAssetHelper?.resolvePlayingAsset?.({
        toyType,
        friendState,
        assetMap,
      }) || assetMap["golden-puppy-playing"] || "";
      friendState.sequencePlayingAsset = playingAsset;

      art.style.transform = "";
      art.style.backgroundImage = `url("${playingAsset || ""}")`;
      let ballOverlay = null;
      if (isBall) {
        ballOverlay = document.createElement("span");
        ballOverlay.className = "puppy-playing-ball";
        ballOverlay.style.backgroundImage = `url("${assetMap["dogtoy-ball"] || ""}")`;
        if (options.ballOrigin === "canvas") {
          ballOverlay.style.right = "-13px";
        }
        friendElement.appendChild(ballOverlay);
      }

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

        const ballElements = Array.from(worldCanvas.querySelectorAll('.friend-character[data-friend-type="dogtoy-ball"]'));
        ballElements.forEach((ballElement) => {
          const overlaps = window.CuppyLandFriendOverlap?.rectsOverlap
            ? window.CuppyLandFriendOverlap.rectsOverlap(friendElement.getBoundingClientRect(), ballElement.getBoundingClientRect())
            : false;
          if (overlaps) {
            const ballState = findFriendById(ballElement.dataset.friendId);
            if (ballState && removeFriendInstance(ballState.id, { playRemovedSfx: false })) {
              return;
            }
          }
        });
        poseIndex += 1;

        if (poseIndex < poses.length) {
          friendState.puppyPlayTimer = timerLifecycle?.set(
            `puppy:${friendId}:pose:${poseIndex}`,
            applyPose,
            260
          ) || setTimeout(applyPose, 260);
          return;
        }

        const finalizeSequence = () => {
          if (!isLeash) {
            friendState.hasBone = isBone;
            friendState.hasRope = isRope;
            friendState.hasBall = isBall;
            friendState.hasSquirrel = isSquirrel;
          }
          if (isLeash) {
            friendState.hasLeash = true;
          }
          friendState.activated = false;
          art.style.transition = "";
          art.style.opacity = "1";
          const restoredPose = friendState.preSequencePose || previousPose;
          art.style.transform = restoredPose.transform || "";
          art.style.transformOrigin = restoredPose.transformOrigin || "";
          ballOverlay?.remove();
          const finalAsset = window.CuppyLandPuppySequenceAssetHelper?.resolveFinalAsset
            ? window.CuppyLandPuppySequenceAssetHelper.resolveFinalAsset({
                friendState,
                assetMap,
              })
            : assetMap["golden-puppy-sitting"];
          art.style.backgroundImage = `url("${finalAsset || assetMap["golden-puppy-sitting"] || ""}")`;
          if (friendState.hasCollar) {
            const collarOverlay = document.createElement("span");
            collarOverlay.className = "dog-collar-overlay";
            collarOverlay.style.backgroundImage = `url("${assetMap["dog-collar-anchored"] || assetMap["dog-collar"] || ""}")`;
            friendElement.appendChild(collarOverlay);
          }
          if (friendState.hasLeash) {
            const leashOverlay = document.createElement("span");
            leashOverlay.className = "dog-leash-overlay";
            leashOverlay.style.backgroundImage = `url("${assetMap["leash-extended"] || assetMap.dogleash || ""}")`;
            friendElement.appendChild(leashOverlay);
          }
          friendState.worldX = restoredPose.worldX;
          friendState.worldY = restoredPose.worldY;
          friendElement.style.left = `${restoredPose.worldX}px`;
          friendElement.style.top = `${restoredPose.worldY}px`;
          friendState.puppyPlayTimer = null;
          friendState.preSequencePose = null;
          friendState.sequencePlayingAsset = null;
          friendState.sequenceActive = false;
        };

        art.style.transition = "opacity 420ms ease";
        art.style.opacity = "0";
        friendState.puppyPlayTimer = timerLifecycle?.set(`puppy:${friendId}:finish`, finalizeSequence, 420) || setTimeout(finalizeSequence, 420);
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
      friendState.sequenceActive = false;
      const restoredPose = friendState.preSequencePose;
      const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"]`);
      const art = friendElement?.querySelector(".friend-character-art");
      if (art) {
        art.style.transform = restoredPose?.transform || "";
        art.style.transformOrigin = restoredPose?.transformOrigin || "";
        art.style.transition = "";
        art.style.opacity = "1";
      }
      if (friendElement && restoredPose) {
        friendState.worldX = restoredPose.worldX;
        friendState.worldY = restoredPose.worldY;
        friendElement.style.left = `${restoredPose.worldX}px`;
        friendElement.style.top = `${restoredPose.worldY}px`;
      }
      friendState.preSequencePose = null;
      friendState.sequencePlayingAsset = null;
    }

    return {
      playWithBone: (friendId) => playToySequence(friendId, "bone"),
      playWithRope: (friendId) => playToySequence(friendId, "rope"),
      playWithBall: (friendId, options = {}) => playToySequence(friendId, "ball", options),
      playWithLeash: (friendId) => playToySequence(friendId, "leash"),
      playWithSquirrel: (friendId) => playToySequence(friendId, "squirrel"),
      stop,
    };
  }

  window.CuppyLandPuppySequenceController = {
    createController,
  };
})();
