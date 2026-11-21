(function () {
  function createController(options) {
    const {
      state,
      worldCanvas,
      resolveFriendStateForElement,
      removeFriendInstance,
      playGoldenPuppyWithBall = () => {},
      playLoopingSfxClip = () => {},
      stopSfxClip = () => {},
      getFriendAssetMap = () => ({}),
      syncFriendActivation = () => {},
    } = options;

    let activeSquirrelChases = 0;

    function resetSquirrelRunningSfx() {
      activeSquirrelChases = 0;
      stopSfxClip("squirrelRunning");
      if (window.CuppyLandSquirrelRunningSfx) {
        window.CuppyLandSquirrelRunningSfx.reset = resetSquirrelRunningSfx;
      }
    }

    function syncSquirrelAvoidance(dogElement, dogState) {
      if (!dogElement || !dogState || dogState.type !== "golden-puppy" || dogState.activated === true) {
        return;
      }
      const squirrelElements = Array.from(worldCanvas.querySelectorAll('.friend-character[data-friend-type="squirrel"]'));
      if (!squirrelElements.length) {
        return;
      }
      const dogRect = dogElement.getBoundingClientRect();
      const dogCenterX = dogRect.left + dogRect.width / 2;
      const dogCenterY = dogRect.top + dogRect.height / 2;

      squirrelElements.forEach((squirrelElement) => {
        const squirrelState = resolveFriendStateForElement(squirrelElement);
        if (!squirrelState) {
          return;
        }
        const squirrelRect = squirrelElement.getBoundingClientRect();
        const squirrelCenterX = squirrelRect.left + squirrelRect.width / 2;
        const squirrelCenterY = squirrelRect.top + squirrelRect.height / 2;
        const deltaX = squirrelCenterX - dogCenterX;
        const deltaY = squirrelCenterY - dogCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance >= 260) {
          return;
        }
        const directionX = distance > 1 ? deltaX / distance : 1;
        const directionY = distance > 1 ? deltaY / distance : 0;
        squirrelState.worldX = Math.max(
          0,
          Math.min(worldCanvas.offsetWidth - squirrelElement.offsetWidth, squirrelState.worldX + directionX * 42)
        );
        squirrelState.worldY = Math.max(
          12,
          Math.min(worldCanvas.offsetHeight - squirrelElement.offsetHeight, squirrelState.worldY + directionY * 42)
        );
        squirrelElement.style.left = `${squirrelState.worldX}px`;
        squirrelElement.style.top = `${squirrelState.worldY}px`;
        syncFriendActivation(squirrelState, squirrelElement);
        const art = squirrelElement.querySelector(".friend-character-art");
        if (!art) {
          return;
        }
        const dogIsLeftOfSquirrel = dogCenterX < squirrelCenterX;
        art.style.transformOrigin = "center bottom";
        art.style.transform = dogIsLeftOfSquirrel ? "scaleX(-1) rotate(45deg)" : "rotate(115deg)";
        art.style.backgroundImage = `url("${getFriendAssetMap()["squirrel-running"] || getFriendAssetMap().squirrel || ""}")`;
        squirrelElement.classList.add("is-running");
        if (!squirrelState.squirrelRunningTimer) {
          activeSquirrelChases = Math.max(1, activeSquirrelChases + 1);
          playLoopingSfxClip("squirrelRunning");
        }
        if (squirrelState.squirrelRunningTimer) {
          window.clearTimeout(squirrelState.squirrelRunningTimer);
        }
        squirrelState.squirrelRunningTimer = window.setTimeout(() => {
          if (art.isConnected) {
            squirrelElement.classList.remove("is-running");
            art.style.transform = "";
            art.style.transformOrigin = "";
            art.style.backgroundImage = `url("${getFriendAssetMap().squirrel || ""}")`;
            squirrelState.squirrelRunningTimer = null;
            activeSquirrelChases = Math.max(0, activeSquirrelChases - 1);
            if (activeSquirrelChases === 0) {
              stopSfxClip("squirrelRunning");
            }
          }
        }, 800);
      });
    }

    function syncBallAvoidance(dogElement, dogState) {
      if (!dogElement || !dogState || dogState.type !== "golden-puppy" || dogState.activated === true || dogState.hasBall) {
        return;
      }
      const ballElements = Array.from(worldCanvas.querySelectorAll('.friend-character[data-friend-type="dogtoy-ball"]'));
      if (!ballElements.length) {
        return;
      }
      const dogRect = dogElement.getBoundingClientRect();
      const dogCenterX = dogRect.left + dogRect.width / 2;
      const dogCenterY = dogRect.top + dogRect.height / 2;

      ballElements.forEach((ballElement) => {
        const ballState = resolveFriendStateForElement(ballElement);
        if (!ballState) {
          return;
        }
        const ballRect = ballElement.getBoundingClientRect();
        const ballCenterX = ballRect.left + ballRect.width / 2;
        const ballCenterY = ballRect.top + ballRect.height / 2;
        const deltaX = ballCenterX - dogCenterX;
        const deltaY = ballCenterY - dogCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance >= 260) {
          return;
        }

        const directionX = distance > 1 ? deltaX / distance : 1;
        const directionY = distance > 1 ? deltaY / distance : 0;
        ballState.worldX = Math.max(
          0,
          Math.min(worldCanvas.offsetWidth - ballElement.offsetWidth, ballState.worldX + directionX * 42)
        );
        ballState.worldY = Math.max(
          12,
          Math.min(worldCanvas.offsetHeight - ballElement.offsetHeight, ballState.worldY + directionY * 42)
        );
        ballElement.style.left = `${ballState.worldX}px`;
        ballElement.style.top = `${ballState.worldY}px`;
        ballElement.classList.add("is-pushed");
        if (ballState.ballPushTimer) {
          window.clearTimeout(ballState.ballPushTimer);
        }
        ballState.ballPushTimer = window.setTimeout(() => {
          if (ballElement.isConnected) {
            ballElement.classList.remove("is-pushed");
          }
          ballState.ballPushTimer = null;
        }, 800);
      });
    }

    return {
      syncSquirrelAvoidance,
      resetSquirrelRunningSfx,
      syncBallAvoidance,
    };
  }

  window.CuppyLandFriendProximityController = {
    createController,
  };
})();
