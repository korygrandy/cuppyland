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
      if (friendState?.type !== "dogbone" && friendState?.type !== "rope-dogtoy" && friendState?.type !== "dogtoy-ball") {
        return false;
      }
      if (friendState?.type === "dogbone") {
        const puppyElement = getPuppyForToy(friendElement);
        if (!puppyElement) {
          return false;
        }
        const puppyState = resolveFriendStateForElement(puppyElement);
        if (!puppyState) {
          return false;
        }
        if (removeFriendInstance(friendState.id, { playRemovedSfx: false })) {
          playGoldenPuppyWithBone?.(puppyState.id);
          return true;
        }
      }

      if (friendState?.type === "rope-dogtoy") {
        const puppyElement = getPuppyForToy(friendElement);
        if (!puppyElement) {
          return false;
        }
        const puppyState = resolveFriendStateForElement(puppyElement);
        if (!puppyState) {
          return false;
        }
        if (removeFriendInstance(friendState.id, { playRemovedSfx: false })) {
          playGoldenPuppyWithRope?.(puppyState.id);
          return true;
        }
      }
      if (friendState?.type === "dogtoy-ball") {
        const puppyElement = getPuppyForToy(friendElement);
        if (!puppyElement) {
          return false;
        }
        const puppyState = resolveFriendStateForElement(puppyElement);
        if (!puppyState) {
          return false;
        }
        if (removeFriendInstance(friendState.id, { playRemovedSfx: false })) {
          playGoldenPuppyWithBall?.(puppyState.id, { ballOrigin: "canvas" });
          return true;
        }
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
