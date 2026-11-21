(function () {
  function createController(options) {
    const {
      worldCanvas,
      resolveFriendStateForElement,
      removeFriendInstance,
      playGoldenPuppyWithBone,
      playGoldenPuppyWithRope,
      playGoldenPuppyWithBall,
      playGoldenPuppyWithSquirrel,
      startRabbitAnimation,
      startTriceratopsAnimation,
      startRocketManAnimation,
      startPizzaManAnimation,
    } = options;

    function getPuppyForToy(friendElement) {
      const overlappingPuppy = window.CuppyLandFriendOverlap?.findOverlappingElement(
        worldCanvas,
        friendElement,
        '.friend-character[data-friend-type="golden-puppy"]'
      );
      if (overlappingPuppy) {
        return overlappingPuppy;
      }
      if (!friendElement || !worldCanvas) {
        return null;
      }
      const sourceRect = friendElement.getBoundingClientRect();
      const sourceCenterX = (sourceRect.left + sourceRect.right) / 2;
      const sourceCenterY = (sourceRect.top + sourceRect.bottom) / 2;
      let nearestPuppy = null;
      let nearestDistance = 150;
      Array.from(worldCanvas.querySelectorAll('.friend-character[data-friend-type="golden-puppy"]')).forEach((puppyElement) => {
        const puppyRect = puppyElement.getBoundingClientRect();
        const puppyCenterX = (puppyRect.left + puppyRect.right) / 2;
        const puppyCenterY = (puppyRect.top + puppyRect.bottom) / 2;
        const distance = Math.sqrt(
          ((puppyCenterX - sourceCenterX) ** 2)
          + ((puppyCenterY - sourceCenterY) ** 2)
        );
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestPuppy = puppyElement;
        }
      });
      return nearestPuppy;
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
        if (puppyState.sequenceActive) {
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
        if (puppyState.sequenceActive || puppyState.hasBall) {
          return false;
        }
        const claimed = window.CuppyLandPuppyBallClaimHelper?.tryClaim
          ? window.CuppyLandPuppyBallClaimHelper.tryClaim(friendState, puppyState.id)
          : true;
        if (!claimed) {
          return false;
        }
        const started = playGoldenPuppyWithBall?.(puppyState.id, {
          ballOrigin: "canvas",
          ballFriendId: friendState.id,
        });
        if (started) {
          const removed = removeFriendInstance(friendState.id, { playRemovedSfx: false });
          if (!removed) {
            friendElement?.remove?.();
          }
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
          return true;
        }
        window.CuppyLandPuppyBallClaimHelper?.release?.(friendState, puppyState.id);
      }
      if (toySequenceType === "squirrel") {
        const puppyElement = getPuppyForToy(friendElement);
        if (!puppyElement) {
          return false;
        }
        const puppyState = resolveFriendStateForElement(puppyElement);
        if (!puppyState || puppyState.hasSquirrel) {
          return false;
        }
        const started = playGoldenPuppyWithSquirrel?.(puppyState.id);
        if (started && removeFriendInstance(friendState.id, { playRemovedSfx: false })) {
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
      } else if (friendState?.type === "pizza-man-craft" && friendState.pizzaWobbleActive) {
        friendState.pizzaAnchorWorldX = friendState.worldX;
        friendState.pizzaAnchorWorldY = friendState.worldY;
        startPizzaManAnimation?.(friendState.id);
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
