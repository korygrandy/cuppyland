(function () {
  function createController(options) {
    const {
      state,
      worldCanvas,
      findFriendById,
      playSfxClip = () => {},
    } = options;
    const rocketLaunchers = new Map();

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
      if (Number.isFinite(friendState.rocketHomeWorldX)) {
        friendState.worldX = friendState.rocketHomeWorldX;
      }
      if (Number.isFinite(friendState.rocketHomeWorldY)) {
        friendState.worldY = friendState.rocketHomeWorldY;
      }
      friendState.rocketHomeWorldX = null;
      friendState.rocketHomeWorldY = null;
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
            setRabbitPose(activeFriend, -72 + rightHopNumber * 24, 0, 0, true);
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

    function stopTriceratopsAnimation(friendId) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "triceratops-bead-craft") {
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
      if (!friendState || friendState.type !== "triceratops-bead-craft") {
        return;
      }

      if (!Number.isFinite(friendState.triceratopsAnchorWorldX)) {
        friendState.triceratopsAnchorWorldX = friendState.worldX;
      }
      if (!friendState.triceratopsDirection) {
        friendState.triceratopsDirection = 1;
      }
      if (!Number.isFinite(friendState.triceratopsDistanceSinceEat)) {
        friendState.triceratopsDistanceSinceEat = 0;
      }
      if (friendState.triceratopsAnimationTimer) {
        clearTimeout(friendState.triceratopsAnimationTimer);
        friendState.triceratopsAnimationTimer = null;
      }

      const crawl = () => {
        const activeFriend = findFriendById(friendId);
        if (!activeFriend || activeFriend.type !== "triceratops-bead-craft") {
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
        let nextX = activeFriend.worldX + activeFriend.triceratopsDirection;

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
        activeFriend.triceratopsDistanceSinceEat += activeFriend.triceratopsDirection;
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
            if (!eatingFriend || eatingFriend.type !== "triceratops-bead-craft" || !eatingElement) {
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
              if (!standingFriend || standingFriend.type !== "triceratops-bead-craft") {
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

    function getRocketLaunchDelayMs() {
      return 60000 + Math.floor(Math.random() * 120001);
    }

    function stopRocketManAnimation(friendId) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "rocketman-craft") {
        return;
      }

      if (friendState.rocketAnimationFrameId) {
        cancelAnimationFrame(friendState.rocketAnimationFrameId);
        friendState.rocketAnimationFrameId = null;
      }
      if (friendState.rocketScheduleTimer) {
        clearTimeout(friendState.rocketScheduleTimer);
        friendState.rocketScheduleTimer = null;
      }
      if (friendState.rocketLaunchDelayTimer) {
        clearTimeout(friendState.rocketLaunchDelayTimer);
        friendState.rocketLaunchDelayTimer = null;
      }

      const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendState.id}"]`);
      const art = friendElement?.querySelector(".friend-character-art");
      if (Number.isFinite(friendState.rocketHomeWorldX)) {
        friendState.worldX = friendState.rocketHomeWorldX;
      }
      if (Number.isFinite(friendState.rocketHomeWorldY)) {
        friendState.worldY = friendState.rocketHomeWorldY;
      }
      friendState.rocketHomeWorldX = null;
      friendState.rocketHomeWorldY = null;
      if (friendElement) {
        friendElement.style.left = `${friendState.worldX}px`;
        friendElement.style.top = `${friendState.worldY}px`;
      }
      if (art) {
        art.style.transform = "";
      }
    }

    function startRocketManAnimation(friendId) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "rocketman-craft") {
        return;
      }
      stopRocketManAnimation(friendId);

      const scheduleLaunch = () => {
        const activeFriend = findFriendById(friendId);
        if (!activeFriend) {
          return;
        }

        activeFriend.rocketScheduleTimer = setTimeout(() => {
          launchRocket(activeFriend.id);
        }, getRocketLaunchDelayMs());
      };

      const launchRocket = (activeFriendId) => {
        const activeFriend = findFriendById(activeFriendId);
        if (!activeFriend || activeFriend.type !== "rocketman-craft") {
          return;
        }
        const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${activeFriendId}"]`);
        const art = friendElement?.querySelector(".friend-character-art");
        if (!friendElement) {
          scheduleLaunch();
          return;
        }

        const anchorX = activeFriend.worldX;
        const anchorY = activeFriend.worldY;
        activeFriend.rocketHomeWorldX = anchorX;
        activeFriend.rocketHomeWorldY = anchorY;
        const maxX = Math.max(0, worldCanvas.offsetWidth - friendElement.offsetWidth);
        const maxY = Math.max(0, worldCanvas.offsetHeight - friendElement.offsetHeight);
        const targetX = Math.max(0, Math.min(maxX, anchorX - 100));
        const targetY = Math.max(0, Math.min(maxY, anchorY - 100));
        const launchDelayMs = 2300;
        const launchDurationMs = 2000;
        const returnDurationMs = 5500;

        playSfxClip("rocketmanActivated");
        if (art) {
          art.style.transformOrigin = "center bottom";
        }

        activeFriend.rocketLaunchDelayTimer = setTimeout(() => {
          activeFriend.rocketLaunchDelayTimer = null;
          const launchStartedAt = performance.now();
          const launchFrame = (now) => {
            const progress = Math.min(1, (now - launchStartedAt) / launchDurationMs);
            const eased = 1 - Math.pow(1 - progress, 3);
            activeFriend.worldX = anchorX + ((targetX - anchorX) * eased);
            activeFriend.worldY = anchorY + ((targetY - anchorY) * eased);
            friendElement.style.left = `${activeFriend.worldX}px`;
            friendElement.style.top = `${activeFriend.worldY}px`;
            if (art) {
              art.style.transform = `rotate(${(-8 * eased).toFixed(2)}deg)`;
            }

            if (progress < 1) {
              activeFriend.rocketAnimationFrameId = requestAnimationFrame(launchFrame);
              return;
            }

            const returnStartedAt = performance.now();
            const returnFrame = (returnNow) => {
              const returnProgress = Math.min(1, (returnNow - returnStartedAt) / returnDurationMs);
              const easedReturn = returnProgress * returnProgress * (3 - (2 * returnProgress));
              activeFriend.worldX = targetX + ((anchorX - targetX) * easedReturn);
              activeFriend.worldY = targetY + ((anchorY - targetY) * easedReturn);
              friendElement.style.left = `${activeFriend.worldX}px`;
              friendElement.style.top = `${activeFriend.worldY}px`;
              if (art) {
                art.style.transform = `rotate(${(-8 * (1 - easedReturn)).toFixed(2)}deg)`;
              }

              if (returnProgress < 1) {
                activeFriend.rocketAnimationFrameId = requestAnimationFrame(returnFrame);
                return;
              }

              activeFriend.rocketAnimationFrameId = null;
              activeFriend.rocketHomeWorldX = null;
              activeFriend.rocketHomeWorldY = null;
              if (art) {
                art.style.transform = "";
              }
              scheduleLaunch();
            };
            activeFriend.rocketAnimationFrameId = requestAnimationFrame(returnFrame);
          };
          activeFriend.rocketAnimationFrameId = requestAnimationFrame(launchFrame);
        }, launchDelayMs);
      };

      rocketLaunchers.set(friendId, launchRocket);
      scheduleLaunch();
    }

    function triggerRocketManAnimation(friendId) {
      stopRocketManAnimation(friendId);
      let launchRocket = rocketLaunchers.get(friendId);
      if (!launchRocket) {
        startRocketManAnimation(friendId);
        launchRocket = rocketLaunchers.get(friendId);
      }
      launchRocket?.(friendId);
    }

    function stopForFriend(friendId) {
      stopRabbitAnimation(friendId);
      stopTriceratopsAnimation(friendId);
      stopRocketManAnimation(friendId);
    }

    return {
      startRabbitAnimation,
      stopRabbitAnimation,
      startTriceratopsAnimation,
      stopTriceratopsAnimation,
      startRocketManAnimation,
      stopRocketManAnimation,
      triggerRocketManAnimation,
      stopForFriend,
    };
  }

  window.CuppyLandFriendMotionController = {
    createController,
  };
})();
