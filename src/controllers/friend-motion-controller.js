(function () {
  function createController(options) {
    const {
      state,
      worldCanvas,
      findFriendById,
      playSfxClip = () => {},
    } = options;

    let rocketAutoScheduleTimer = null;
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

    function stopTurtleAnimation(friendId) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "turtle-bead-craft") {
        return;
      }

      if (friendState.turtleAnimationTimer) {
        clearTimeout(friendState.turtleAnimationTimer);
        friendState.turtleAnimationTimer = null;
      }

      const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendState.id}"]`);
      const art = friendElement?.querySelector(".friend-character-art");
      if (art) {
        art.style.transform = "";
      }
    }

    function startTurtleAnimation(friendId) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "turtle-bead-craft") {
        return;
      }

      if (!Number.isFinite(friendState.turtleAnchorWorldX)) {
        friendState.turtleAnchorWorldX = friendState.worldX;
      }
      if (!friendState.turtleDirection) {
        friendState.turtleDirection = 1;
      }
      if (!Number.isFinite(friendState.turtleDistanceSinceEat)) {
        friendState.turtleDistanceSinceEat = 0;
      }
      if (friendState.turtleAnimationTimer) {
        clearTimeout(friendState.turtleAnimationTimer);
        friendState.turtleAnimationTimer = null;
      }

      const crawl = () => {
        const activeFriend = findFriendById(friendId);
        if (!activeFriend || activeFriend.type !== "turtle-bead-craft") {
          if (activeFriend) {
            activeFriend.turtleAnimationTimer = null;
          }
          return;
        }

        const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"]`);
        if (!friendElement) {
          activeFriend.turtleAnimationTimer = null;
          return;
        }

        const anchorX = Number.isFinite(activeFriend.turtleAnchorWorldX)
          ? activeFriend.turtleAnchorWorldX
          : activeFriend.worldX;
        const minWorldX = Math.max(0, Math.min(worldCanvas.offsetWidth - friendElement.offsetWidth, anchorX - 100));
        const maxWorldX = Math.max(0, Math.min(worldCanvas.offsetWidth - friendElement.offsetWidth, anchorX + 100));
        let nextX = activeFriend.worldX + activeFriend.turtleDirection;

        if (nextX >= maxWorldX) {
          nextX = maxWorldX;
          activeFriend.turtleDirection = -1;
        } else if (nextX <= minWorldX) {
          nextX = minWorldX;
          activeFriend.turtleDirection = 1;
        }

        activeFriend.worldX = nextX;
        friendElement.style.left = `${nextX}px`;
        const art = friendElement.querySelector(".friend-character-art");
        activeFriend.turtleDistanceSinceEat += activeFriend.turtleDirection;
        const distanceSinceEat = Math.abs(activeFriend.turtleDistanceSinceEat);

        if (art) {
          art.style.transform = `scaleX(${activeFriend.turtleDirection < 0 ? -1 : 1})`;
          art.style.transformOrigin = "center bottom";
        }

        if (distanceSinceEat >= 20) {
          activeFriend.turtleDistanceSinceEat = 0;
          activeFriend.turtleAnimationTimer = setTimeout(() => {
            const eatingFriend = findFriendById(friendId);
            const eatingElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"]`);
            if (!eatingFriend || eatingFriend.type !== "turtle-bead-craft" || !eatingElement) {
              return;
            }

            const eatingArt = eatingElement.querySelector(".friend-character-art");
            const facingScale = eatingFriend.turtleDirection < 0 ? -1 : 1;
            const eatingRotation = eatingFriend.turtleDirection >= 0 ? 14 : -14;
            if (eatingArt) {
              eatingArt.style.transition = "transform 2s ease-in-out";
              eatingArt.style.transform = `scaleX(${facingScale}) rotate(${eatingRotation}deg)`;
            }

            eatingFriend.turtleAnimationTimer = setTimeout(() => {
              const standingFriend = findFriendById(friendId);
              const standingArt = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"] .friend-character-art`);
              if (!standingFriend || standingFriend.type !== "turtle-bead-craft") {
                return;
              }
              if (standingArt) {
                standingArt.style.transition = "transform 400ms ease-in-out";
                standingArt.style.transform = `scaleX(${standingFriend.turtleDirection < 0 ? -1 : 1})`;
              }
              standingFriend.turtleAnimationTimer = setTimeout(crawl, 100);
            }, 2000);
          }, 2000);
          return;
        }

        activeFriend.turtleAnimationTimer = setTimeout(crawl, 100);
      };

      friendState.turtleAnimationTimer = setTimeout(crawl, 100);
    }

    function stopPizzaManAnimation(friendId) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "pizza-man-craft") {
        return;
      }
      if (friendState.pizzaAnimationFrameId) {
        cancelAnimationFrame(friendState.pizzaAnimationFrameId);
        friendState.pizzaAnimationFrameId = null;
      }
      if (friendState.pizzaPauseTimer) {
        clearTimeout(friendState.pizzaPauseTimer);
        friendState.pizzaPauseTimer = null;
      }
      const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendState.id}"]`);
      const art = friendElement?.querySelector(".friend-character-art");
      if (art) {
        art.style.transform = "";
        art.style.transformOrigin = "";
      }
    }

    function getPizzaManStepConfig() {
      return {
        legDurationMs: 1200,
        pauseMs: 1000,
        stepDistancePx: 100,
        skewDeg: 18,
        rotateDeg: 8,
      };
    }

    function startPizzaManAnimation(friendId) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "pizza-man-craft") {
        return;
      }
      if (!friendState.pizzaWobbleActive) {
        stopPizzaManAnimation(friendId);
        return;
      }
      if (friendState.pizzaAnimationFrameId || friendState.pizzaPauseTimer) {
        return;
      }

      const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"]`);
      if (!friendElement) {
        return;
      }
      const art = friendElement.querySelector(".friend-character-art");
      if (!Number.isFinite(friendState.pizzaAnchorWorldX)) {
        friendState.pizzaAnchorWorldX = friendState.worldX;
      }
      if (!Number.isFinite(friendState.pizzaAnchorWorldY)) {
        friendState.pizzaAnchorWorldY = friendState.worldY;
      }

      const {
        legDurationMs,
        pauseMs,
        stepDistancePx,
        skewDeg,
        rotateDeg,
      } = getPizzaManStepConfig();

      const runLeg = (fromX, toX, facingScaleX) => {
        const legStart = performance.now();
        const step = (now) => {
          const active = findFriendById(friendId);
          if (!active || active.type !== "pizza-man-craft" || !active.pizzaWobbleActive) {
            stopPizzaManAnimation(friendId);
            return;
          }
          const element = worldCanvas.querySelector(`.friend-character[data-friend-id="${friendId}"]`);
          const activeArt = element?.querySelector(".friend-character-art");
          if (!element || !activeArt) {
            stopPizzaManAnimation(friendId);
            return;
          }
          const progress = Math.min(1, (now - legStart) / legDurationMs);
          const eased = progress * progress * (3 - (2 * progress));
          const nextX = fromX + ((toX - fromX) * eased);
          active.worldX = Math.max(0, Math.min(worldCanvas.offsetWidth - element.offsetWidth, nextX));
          active.worldY = Number.isFinite(active.pizzaAnchorWorldY) ? active.pizzaAnchorWorldY : active.worldY;
          element.style.left = `${active.worldX}px`;
          element.style.top = `${active.worldY}px`;

          const wobbleWave = Math.sin(progress * Math.PI * 4);
          const stepSkewDeg = wobbleWave * skewDeg;
          const stepRotateDeg = wobbleWave * rotateDeg;
          const bouncePx = Math.sin(progress * Math.PI * 6) * 4;
          activeArt.style.transformOrigin = "center bottom";
          activeArt.style.transform = `translateY(${bouncePx.toFixed(2)}px) scaleX(${facingScaleX}) skewX(${stepSkewDeg.toFixed(2)}deg) rotate(${stepRotateDeg.toFixed(2)}deg)`;

          if (progress < 1) {
            active.pizzaAnimationFrameId = requestAnimationFrame(step);
            return;
          }

          active.pizzaAnimationFrameId = null;
          activeArt.style.transform = `scaleX(${facingScaleX})`;
          activeArt.style.transformOrigin = "center bottom";
          active.pizzaPauseTimer = setTimeout(() => {
            active.pizzaPauseTimer = null;
            const loopAnchor = Number.isFinite(active.pizzaAnchorWorldX) ? active.pizzaAnchorWorldX : active.worldX;
            const leftTarget = Math.max(0, Math.min(worldCanvas.offsetWidth - element.offsetWidth, loopAnchor - stepDistancePx));
            const rightTarget = Math.max(0, Math.min(worldCanvas.offsetWidth - element.offsetWidth, loopAnchor));
            if (Math.abs(active.worldX - leftTarget) < 1) {
              runLeg(active.worldX, rightTarget, -1);
            } else {
              runLeg(active.worldX, leftTarget, 1);
            }
          }, pauseMs);
        };
        friendState.pizzaAnimationFrameId = requestAnimationFrame(step);
      };

      const anchorX = Number.isFinite(friendState.pizzaAnchorWorldX) ? friendState.pizzaAnchorWorldX : friendState.worldX;
      const leftTarget = Math.max(0, Math.min(worldCanvas.offsetWidth - friendElement.offsetWidth, anchorX - stepDistancePx));
      runLeg(friendState.worldX, leftTarget, 1);
    }

    function getRocketLaunchDelayMs() {
      return 60000 + Math.floor(Math.random() * 120001);
    }

    function getRocketManInstances() {
      if (!state?.activeWorld) {
        return [];
      }
      return (state.worlds?.[state.activeWorld]?.friends || [])
        .filter((friend) => friend.type === "rocketman-craft");
    }

    function launchRandomRocketMan() {
      const rocketMen = getRocketManInstances();
      if (!rocketMen.length) {
        return;
      }
      const selected = rocketMen[Math.floor(Math.random() * rocketMen.length)];
      triggerRocketManAnimation(selected.id);
    }

    function scheduleRandomRocketLaunch() {
      if (rocketAutoScheduleTimer) {
        clearTimeout(rocketAutoScheduleTimer);
      }
      rocketAutoScheduleTimer = setTimeout(() => {
        rocketAutoScheduleTimer = null;
        launchRandomRocketMan();
      }, getRocketLaunchDelayMs());
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
      friendElement?.querySelector(".rocketman-flame")?.remove();
    }

    function startRocketManAnimation(friendId) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "rocketman-craft") {
        return;
      }
      stopRocketManAnimation(friendId);

      const launchRocket = (activeFriendId) => {
        const activeFriend = findFriendById(activeFriendId);
        if (!activeFriend || activeFriend.type !== "rocketman-craft") {
          return;
        }
        const friendElement = worldCanvas.querySelector(`.friend-character[data-friend-id="${activeFriendId}"]`);
        const art = friendElement?.querySelector(".friend-character-art");
        if (!friendElement) {
          scheduleRandomRocketLaunch();
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
          const flame = document.createElement("span");
          flame.className = "rocketman-flame";
          friendElement.prepend(flame);
          setTimeout(() => {
            flame.remove();
            const smoke = document.createElement("span");
            smoke.className = "rocketman-smoke";
            for (let index = 0; index < 7; index += 1) {
              const puff = document.createElement("span");
              puff.className = "rocketman-smoke-puff";
              smoke.appendChild(puff);
            }
            friendElement.appendChild(smoke);
            setTimeout(() => smoke.remove(), 1400);
          }, 2000);
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
              scheduleRandomRocketLaunch();
            };
            activeFriend.rocketAnimationFrameId = requestAnimationFrame(returnFrame);
          };
          activeFriend.rocketAnimationFrameId = requestAnimationFrame(launchFrame);
        }, launchDelayMs);
      };

      rocketLaunchers.set(friendId, launchRocket);
      scheduleRandomRocketLaunch();
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
      const friendState = findFriendById(friendId);
      if (friendState?.puppyPlayTimer) {
        clearTimeout(friendState.puppyPlayTimer);
        friendState.puppyPlayTimer = null;
      }
      stopRabbitAnimation(friendId);
      stopTurtleAnimation(friendId);
      stopRocketManAnimation(friendId);
      stopPizzaManAnimation(friendId);
    }

    return {
      startRabbitAnimation,
      stopRabbitAnimation,
      startTurtleAnimation,
      stopTurtleAnimation,
      startPizzaManAnimation,
      stopPizzaManAnimation,
      startRocketManAnimation,
      stopRocketManAnimation,
      triggerRocketManAnimation,
      stopForFriend,
      getPizzaManStepConfig,
    };
  }

  window.CuppyLandFriendMotionController = {
    createController,
  };
})();
