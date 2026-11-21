(function () {
  function createController(options) {
    const {
      container,
      playSfxClip = () => {},
    } = options;

    const activeFriendsByObject = new Map();
    const fadeTimers = new Map();
    const trampolineTimers = new Map();
    const trampolineFrames = new Map();
    let activeWorld = null;

    function stopTrampolineAnimation(objectId) {
      const timerId = trampolineTimers.get(objectId);
      if (timerId) {
        clearInterval(timerId);
        trampolineTimers.delete(objectId);
      }
      trampolineFrames.delete(objectId);
      const anchor = container.querySelector(`[data-object-id="${objectId}"]`);
      if (!anchor) {
        return;
      }
      anchor.classList.remove("is-bouncing", "trampoline-up", "trampoline-down");
      const art = anchor.querySelector(".world-background-object-art");
      if (art) {
        const objectConfig = getObjects(activeWorld).find((item) => item.id === objectId);
        art.style.backgroundImage = `url("${objectConfig?.activatedAsset || objectConfig?.activatedAssets?.down || ""}")`;
      }
    }

    function startTrampolineAnimation(objectId, objectConfig) {
      if (!objectConfig?.activatedAssets) {
        return;
      }
      const anchor = container.querySelector(`[data-object-id="${objectId}"]`);
      const art = anchor?.querySelector(".world-background-object-art");
      if (!anchor || !art) {
        return;
      }

      stopTrampolineAnimation(objectId);
      let frame = "down";
      trampolineFrames.set(objectId, frame);
      anchor.classList.add("is-bouncing");
      art.style.backgroundImage = `url("${objectConfig.activatedAssets.down}")`;

      const timerId = setInterval(() => {
        frame = frame === "down" ? "up" : "down";
        trampolineFrames.set(objectId, frame);
        anchor.classList.toggle("trampoline-up", frame === "up");
        anchor.classList.toggle("trampoline-down", frame === "down");
        art.style.backgroundImage = `url("${frame === "down"
          ? objectConfig.activatedAssets.down
          : objectConfig.activatedAssets.up}")`;
      }, objectConfig.frameDurationMs || 420);
      trampolineTimers.set(objectId, timerId);
    }

    function getObjects(worldId = activeWorld) {
      return window.CuppyLandGame?.backgroundObjectAnchors?.[worldId] || [];
    }

    function render(worldId) {
      activeWorld = worldId;
      container.innerHTML = "";
      activeFriendsByObject.clear();
      fadeTimers.forEach((timerId) => clearTimeout(timerId));
      fadeTimers.clear();
      trampolineTimers.forEach((timerId) => clearInterval(timerId));
      trampolineTimers.clear();
      trampolineFrames.clear();

      getObjects(worldId).forEach((objectConfig) => {
        const anchor = document.createElement("div");
        anchor.className = "world-background-object";
        anchor.dataset.objectId = objectConfig.id;
        anchor.dataset.label = objectConfig.label || objectConfig.id;
        anchor.style.left = `${objectConfig.x}px`;
        anchor.style.top = `${objectConfig.y}px`;
        anchor.style.width = `${objectConfig.width}px`;
        anchor.style.height = `${objectConfig.height}px`;

        const activatedArt = document.createElement("div");
        activatedArt.className = "world-background-object-art";
        activatedArt.style.backgroundImage = `url("${objectConfig.activatedAsset}")`;
        if (objectConfig.id === "trampoline") {
          const artScale = objectConfig.artScale || 1;
          activatedArt.style.left = `${objectConfig.artOffsetX || 0}px`;
          activatedArt.style.top = `${objectConfig.artOffsetY || 0}px`;
          activatedArt.style.width = "100%";
          activatedArt.style.height = "100%";
          activatedArt.style.setProperty("--trampoline-art-scale", String(objectConfig.artScale || 1));
        }
        anchor.appendChild(activatedArt);
        container.appendChild(anchor);
        activeFriendsByObject.set(objectConfig.id, new Set());
      });
    }

    function friendIntersectsObject(friendState, friendElement, objectConfig) {
      if (Array.isArray(objectConfig.activatorTypes) && !objectConfig.activatorTypes.includes(friendState.type)) {
        return false;
      }

      const friendLeft = Number.isFinite(friendState.worldX) ? friendState.worldX : 0;
      const friendTop = Number.isFinite(friendState.worldY) ? friendState.worldY : 0;
      const friendRight = friendLeft + (friendElement?.offsetWidth || 0);
      const friendBottom = friendTop + (friendElement?.offsetHeight || 0);

      return friendRight >= objectConfig.x
        && friendLeft <= objectConfig.x + objectConfig.width
        && friendBottom >= objectConfig.y
        && friendTop <= objectConfig.y + objectConfig.height;
    }

    function syncFriend(friendState, friendElement) {
      if (!friendState?.id || !friendElement || !activeWorld) {
        return;
      }

      getObjects().forEach((objectConfig) => {
        const activeFriends = activeFriendsByObject.get(objectConfig.id) || new Set();
        const wasActive = activeFriends.size > 0;
        activeFriends.delete(friendState.id);

        if (friendIntersectsObject(friendState, friendElement, objectConfig)) {
          activeFriends.add(friendState.id);
        }

        activeFriendsByObject.set(objectConfig.id, activeFriends);
        const isActive = activeFriends.size > 0;
        const anchor = container.querySelector(`[data-object-id="${objectConfig.id}"]`);
        if (!objectConfig.activatedSfx) {
          anchor?.classList.toggle("active", isActive);
        }
        if (objectConfig.id === "trampoline") {
          if (isActive && !trampolineTimers.has(objectConfig.id)) {
            startTrampolineAnimation(objectConfig.id, objectConfig);
          } else if (!isActive && trampolineTimers.has(objectConfig.id)) {
            stopTrampolineAnimation(objectConfig.id);
          }
        }

        if (!wasActive && isActive && objectConfig.activatedSfx) {
          const previousTimer = fadeTimers.get(objectConfig.id);
          if (previousTimer) {
            clearTimeout(previousTimer);
          }
          anchor?.classList.remove("fading");
          anchor?.classList.add("active");
          playSfxClip(objectConfig.activatedSfx, () => {
            if (!anchor) {
              return;
            }
            anchor.classList.remove("active");
            anchor.classList.add("fading");
            const fadeTimer = setTimeout(() => {
              anchor.classList.remove("fading");
              fadeTimers.delete(objectConfig.id);
            }, objectConfig.fadeOutMs ?? 450);
            fadeTimers.set(objectConfig.id, fadeTimer);
          });
        }
      });
    }

    function removeFriend(friendId) {
      if (!friendId) {
        return;
      }

      activeFriendsByObject.forEach((activeFriends, objectId) => {
        activeFriends.delete(friendId);
        const anchor = container.querySelector(`[data-object-id="${objectId}"]`);
        const objectConfig = getObjects().find((candidate) => candidate.id === objectId);
        if (!objectConfig?.activatedSfx) {
          anchor?.classList.toggle("active", activeFriends.size > 0);
        }
        if (objectConfig?.id === "trampoline" && activeFriends.size === 0) {
          stopTrampolineAnimation(objectId);
        }
      });
    }

    return {
      render,
      syncFriend,
      removeFriend,
    };
  }

  window.CuppyLandBackgroundObjectController = {
    createController,
  };
})();
