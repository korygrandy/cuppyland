(function () {
  function createController(options) {
    const {
      worldCanvas,
      resolveFriendStateForElement,
      removeFriendInstance,
      playGoldenPuppyWithBone,
      playGoldenPuppyWithRope,
      playGoldenPuppyWithBall,
      startRabbitAnimation,
      startTriceratopsAnimation,
      startRocketManAnimation,
    } = options;

    function getPuppyForToy(friendElement) {
      return window.CuppyLandFriendOverlap?.findOverlappingElement(
        worldCanvas,
        friendElement,
        '.friend-character[data-friend-type="golden-puppy"]'
      );
    }

    function handleToyRelease(friendElement, friendState) {
      const toySequenceType = window.CuppyLandInteractionRules?.getToySequenceType(friendState?.type);
      if (!toySequenceType) {
        return false;
      }
      if (toySequenceType === "bone") {
        const puppyElement = getPuppyForToy(friendElement);
        if (!puppyElement) {
          return false;
        }
        const puppyState = resolveFriendStateForElement(puppyElement);
        if (!puppyState) {
          return false;
        }
        const started = playGoldenPuppyWithBone?.(puppyState.id);
        if (started && removeFriendInstance(friendState.id, { playRemovedSfx: false })) {
          return true;
        }
      }

      if (toySequenceType === "rope") {
        const puppyElement = getPuppyForToy(friendElement);
        if (!puppyElement) {
          return false;
        }
        const puppyState = resolveFriendStateForElement(puppyElement);
        if (!puppyState) {
          return false;
        }
        const started = playGoldenPuppyWithRope?.(puppyState.id);
        if (started && removeFriendInstance(friendState.id, { playRemovedSfx: false })) {
          return true;
        }
      }
      if (toySequenceType === "ball") {
        const puppyElement = getPuppyForToy(friendElement);
        if (!puppyElement) {
          return false;
        }
        const puppyState = resolveFriendStateForElement(puppyElement);
        if (!puppyState) {
          return false;
        }
        const claimed = window.CuppyLandPuppyBallClaimHelper?.tryClaim
          ? window.CuppyLandPuppyBallClaimHelper.tryClaim(friendState, puppyState.id)
          : true;
        if (!claimed) {
          return false;
        }
        const started = playGoldenPuppyWithBall?.(puppyState.id, { ballOrigin: "canvas" });
        if (started && removeFriendInstance(friendState.id, { playRemovedSfx: false })) {
          return true;
        }
        window.CuppyLandPuppyBallClaimHelper?.release?.(friendState, puppyState.id);
      }
      return false;
    }

    function handleMotionRelease(friendState) {
      if (friendState?.type === "rabbit-bead-craft") {
        friendState.rabbitAnchorWorldX = friendState.worldX;
        friendState.rabbitAnchorWorldY = friendState.worldY;
        startRabbitAnimation?.(friendState.id);
      } else if (friendState?.type === "triceratops-bead-craft") {
        friendState.triceratopsAnchorWorldX = friendState.worldX;
        startTriceratopsAnimation?.(friendState.id);
      } else if (friendState?.type === "rocketman-craft") {
        startRocketManAnimation?.(friendState.id);
      }
    }

    return {
      handleToyRelease,
      handleMotionRelease,
    };
  }

  window.CuppyLandFriendReleaseController = {
    createController,
  };
})();
