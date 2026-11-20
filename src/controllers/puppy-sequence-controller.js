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

      const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"]`);
      friendElement?.querySelector(".puppy-playing-ball")?.remove();
      const art = friendElement?.querySelector(".friend-character-art");
      if (!friendElement || !art) {
        return false;
      }

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
      const playingAsset = isRope
        ? assetMap["golden-puppy-playing-rope"]
        : isBone
          ? (assetMap["golden-puppy-playing-bone"] || assetMap["golden-puppy-playing"])
          : isBall
            ? (assetMap["golden-puppy-playing-with-ball"] || assetMap["golden-puppy-playing"])
            : assetMap["golden-puppy-playing"];

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

        art.style.transition = "opacity 420ms ease";
        art.style.opacity = "0";
        friendState.puppyPlayTimer = timerLifecycle?.set(`puppy:${friendId}:finish`, () => {
          if (!isLeash) {
            friendState.hasBone = isBone;
            friendState.hasRope = isRope;
            friendState.hasBall = isBall;
          }
          if (isLeash) {
            friendState.hasLeash = true;
          }
          friendState.activated = false;
          art.style.transition = "";
          art.style.opacity = "1";
          art.style.transform = "";
          ballOverlay?.remove();
          ballOverlay?.remove();
          const finalAsset = friendState.hasBall
            ? assetMap["golden-puppy-sitting-with-ball"]
            : friendState.hasRope
              ? assetMap["golden-puppy-with-rope-sitting"]
              : friendState.hasBone
                ? assetMap["golden-puppy-with-bone-sitting"]
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
            leashOverlay.style.backgroundImage = `url("${assetMap.dogleash || ""}")`;
            friendElement.appendChild(leashOverlay);
          }
          friendState.worldX = anchorX;
          friendState.worldY = anchorY;
          friendElement.style.left = `${anchorX}px`;
          friendElement.style.top = `${anchorY}px`;
          friendState.puppyPlayTimer = null;
        }, 420) || setTimeout(() => {
          if (!isLeash) {
            friendState.hasBone = isBone;
            friendState.hasRope = isRope;
            friendState.hasBall = isBall;
          }
          if (isLeash) {
            friendState.hasLeash = true;
          }
          friendState.activated = false;
          art.style.transition = "";
          art.style.opacity = "1";
          art.style.transform = "";
          const finalAsset = friendState.hasBall
            ? assetMap["golden-puppy-sitting-with-ball"]
            : friendState.hasRope
              ? assetMap["golden-puppy-with-rope-sitting"]
              : friendState.hasBone
                ? assetMap["golden-puppy-with-bone-sitting"]
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
            leashOverlay.style.backgroundImage = `url("${assetMap.dogleash || ""}")`;
            friendElement.appendChild(leashOverlay);
          }
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
      playWithBall: (friendId, options = {}) => playToySequence(friendId, "ball", options),
      playWithLeash: (friendId) => playToySequence(friendId, "leash"),
      stop,
    };
  }

  window.CuppyLandPuppySequenceController = {
    createController,
  };
})();
