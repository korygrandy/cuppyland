(function () {
  function createController(options) {
    const {
      container,
      worldCanvas = null,
      playSfxClip = () => {},
    } = options;

    const activeFriendsByObject = new Map();
    const fadeTimers = new Map();
    const trampolineTimers = new Map();
    const trampolineFrames = new Map();
    const trampolineFriends = new Map();
    const trampolineFriendDelays = new Map();
    let activeWorld = null;
    const trampolineBouncerTypes = new Set([
      "heart-women",
      "heart-man",
      "rocketman-craft",
      "furball-guy",
      "hairy-guy",
      "spongebob-stuffy",
      "pizza-man-craft",
      "chocolate-milk",
      "barbie-blonde",
      "barbie-blonde-baby",
      "golden-puppy",
      "triceratops-bead-craft",
      "rabbit-bead-craft",
      "squirrel",
      "turkey",
    ]);

    function isTrampolineBouncer(friendState) {
      return Boolean(friendState?.type && trampolineBouncerTypes.has(friendState.type));
    }

    function restoreTrampolineFriend(friendId, record) {
      if (!record?.element) {
        return;
      }
      const delayTimer = trampolineFriendDelays.get(friendId);
      if (delayTimer) {
        clearTimeout(delayTimer);
        trampolineFriendDelays.delete(friendId);
      }
      record.element.style.transform = record.transform;
      record.element.style.transition = record.transition;
      record.element.style.opacity = record.opacity;
      record.element.classList.remove("trampoline-bounce-up", "trampoline-bounce-down");
    }

    function restoreTrampolineFriends(objectId) {
      const friends = trampolineFriends.get(objectId);
      if (!friends) {
        return;
      }
      friends.forEach((record, friendId) => {
        restoreTrampolineFriend(friendId, record);
      });
      trampolineFriends.delete(objectId);
    }

    function registerTrampolineFriend(objectId, friendState, friendElement) {
      let friends = trampolineFriends.get(objectId);
      if (!friends) {
        friends = new Map();
        trampolineFriends.set(objectId, friends);
      }
      if (!friends.has(friendState.id)) {
        friends.set(friendState.id, {
          state: friendState,
          element: friendElement,
          transform: friendElement.style.transform || "",
          transition: friendElement.style.transition || "",
          opacity: friendElement.style.opacity || "",
        });
        return true;
      }
      const record = friends.get(friendState.id);
      record.state = friendState;
      record.element = friendElement;
      return false;
    }

    function unregisterTrampolineFriend(objectId, friendId) {
      const friends = trampolineFriends.get(objectId);
      const record = friends?.get(friendId);
      if (record) {
        restoreTrampolineFriend(friendId, record);
        friends.delete(friendId);
      }
    }

    function applyTrampolineFriendFrame(objectId, frame) {
      const friends = trampolineFriends.get(objectId);
      if (!friends) {
        return;
      }
      friends.forEach((record, friendId) => {
        const existingDelay = trampolineFriendDelays.get(friendId);
        if (existingDelay) {
          clearTimeout(existingDelay);
          trampolineFriendDelays.delete(friendId);
        }
        const element = record.element;
        if (!element) {
          return;
        }
        const applyFrame = () => {
          if (frame === "up") {
            element.style.transition = "transform 90ms ease-out, opacity 90ms ease-out";
            element.style.transform = "translateY(-24px)";
            element.style.opacity = "0.92";
            element.classList.remove("trampoline-bounce-down");
            element.classList.add("trampoline-bounce-up");
          } else {
            element.style.transition = "transform 110ms ease-in, opacity 110ms ease-in";
            element.style.transform = "translateY(3px)";
            element.style.opacity = "1";
            element.classList.remove("trampoline-bounce-up");
            element.classList.add("trampoline-bounce-down");
          }
        };
        const delayMs = frame === "up" ? 55 : 30;
        const delayTimer = setTimeout(applyFrame, delayMs);
        trampolineFriendDelays.set(friendId, delayTimer);
      });
    }

    function stopTrampolineAnimation(objectId) {
      const timerId = trampolineTimers.get(objectId);
      if (timerId) {
        clearInterval(timerId);
        trampolineTimers.delete(objectId);
      }
      trampolineFrames.delete(objectId);
      restoreTrampolineFriends(objectId);
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

      let frame = "down";
      trampolineFrames.set(objectId, frame);
      anchor.classList.add("is-bouncing");
      art.style.backgroundImage = `url("${objectConfig.activatedAssets.down}")`;
      applyTrampolineFriendFrame(objectId, "down");

      const timerId = setInterval(() => {
        frame = frame === "down" ? "up" : "down";
        trampolineFrames.set(objectId, frame);
        anchor.classList.toggle("trampoline-up", frame === "up");
        anchor.classList.toggle("trampoline-down", frame === "down");
        art.style.backgroundImage = `url("${frame === "down"
          ? objectConfig.activatedAssets.down
          : objectConfig.activatedAssets.up}")`;
        applyTrampolineFriendFrame(objectId, frame);
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
      trampolineFriends.forEach((friends) => {
        friends.forEach((record, friendId) => restoreTrampolineFriend(friendId, record));
      });
      trampolineFriends.clear();
      trampolineFriendDelays.forEach((timerId) => clearTimeout(timerId));
      trampolineFriendDelays.clear();

      getObjects(worldId).forEach((objectConfig) => {
        const anchor = document.createElement("div");
        anchor.className = "world-background-object";
        anchor.dataset.objectId = objectConfig.id;
        anchor.dataset.label = objectConfig.label || objectConfig.id;
        anchor.style.left = `${objectConfig.x}px`;
        anchor.style.top = `${objectConfig.y}px`;
        anchor.style.width = `${objectConfig.width}px`;
        anchor.style.height = `${objectConfig.height}px`;
        if (objectConfig.id === "trampoline") {
          anchor.style.setProperty("--trampoline-hitbox-left", `${objectConfig.hitboxOffsetX ?? 0}px`);
          anchor.style.setProperty("--trampoline-hitbox-top", `${objectConfig.hitboxOffsetY ?? 0}px`);
          anchor.style.setProperty("--trampoline-hitbox-width", `${objectConfig.hitboxWidth ?? objectConfig.width}px`);
          anchor.style.setProperty("--trampoline-hitbox-height", `${objectConfig.hitboxHeight ?? objectConfig.height}px`);
        }

        const activatedArt = document.createElement("div");
        activatedArt.className = "world-background-object-art";
        activatedArt.style.backgroundImage = `url("${objectConfig.activatedAsset}")`;
        if (objectConfig.id === "trampoline") {
          const artScale = objectConfig.artScale ?? 1.425;
          activatedArt.style.left = `${(objectConfig.artOffsetX ?? -10) - (((artScale - 1) * objectConfig.width) / 2)}px`;
          activatedArt.style.top = `${(objectConfig.artOffsetY ?? 100) - (((artScale - 1) * objectConfig.height) / 2)}px`;
          activatedArt.style.width = `${100 * artScale}%`;
          activatedArt.style.height = `${100 * artScale}%`;
        }
        anchor.appendChild(activatedArt);
        container.appendChild(anchor);
        activeFriendsByObject.set(objectConfig.id, new Set());
      });
    }

    function friendIntersectsObject(friendState, friendElement, objectConfig) {
      const hitboxLeft = objectConfig.hitboxOffsetX != null
        ? objectConfig.x + objectConfig.hitboxOffsetX
        : objectConfig.x;
      const hitboxTop = objectConfig.hitboxOffsetY != null
        ? objectConfig.y + objectConfig.hitboxOffsetY
        : objectConfig.y;
      const hitboxWidth = objectConfig.hitboxWidth ?? objectConfig.width;
      const hitboxHeight = objectConfig.hitboxHeight ?? objectConfig.height;
      const hitboxRight = hitboxLeft + hitboxWidth;
      const hitboxBottom = hitboxTop + hitboxHeight;

      if (worldCanvas && friendElement?.getBoundingClientRect) {
        const canvasRect = worldCanvas.getBoundingClientRect();
        const friendRect = friendElement.getBoundingClientRect();
        const scaleX = worldCanvas.offsetWidth
          ? canvasRect.width / worldCanvas.offsetWidth
          : 1;
        const scaleY = worldCanvas.offsetHeight
          ? canvasRect.height / worldCanvas.offsetHeight
          : 1;
        if (canvasRect.width > 0 && canvasRect.height > 0) {
          const friendLeft = (friendRect.left - canvasRect.left) / scaleX;
          const friendTop = (friendRect.top - canvasRect.top) / scaleY;
          const friendRight = (friendRect.right - canvasRect.left) / scaleX;
          const friendBottom = (friendRect.bottom - canvasRect.top) / scaleY;
          return friendRight >= hitboxLeft
            && friendLeft <= hitboxRight
            && friendBottom >= hitboxTop
            && friendTop <= hitboxBottom;
        }
      }

      const friendLeft = Number.isFinite(friendState.worldX) ? friendState.worldX : 0;
      const friendTop = Number.isFinite(friendState.worldY) ? friendState.worldY : 0;
      const friendRight = friendLeft + (friendElement?.offsetWidth || 0);
      const friendBottom = friendTop + (friendElement?.offsetHeight || 0);

      return friendRight >= hitboxLeft
        && friendLeft <= hitboxRight
        && friendBottom >= hitboxTop
        && friendTop <= hitboxBottom;
    }

    function syncFriend(friendState, friendElement) {
      if (!friendState?.id || !friendElement || !activeWorld) {
        return;
      }

      getObjects().forEach((objectConfig) => {
        const activeFriends = activeFriendsByObject.get(objectConfig.id) || new Set();
        const wasActive = activeFriends.size > 0;
        activeFriends.delete(friendState.id);
        const isAllowedBouncer = isTrampolineBouncer(friendState);

        if (isAllowedBouncer && friendIntersectsObject(friendState, friendElement, objectConfig)) {
          activeFriends.add(friendState.id);
        }

        activeFriendsByObject.set(objectConfig.id, activeFriends);
        const isActive = activeFriends.size > 0;
        const anchor = container.querySelector(`[data-object-id="${objectConfig.id}"]`);
        if (!objectConfig.activatedSfx) {
          anchor?.classList.toggle("active", isActive);
        }
        if (objectConfig.id === "trampoline") {
          const currentFriendOverlaps = friendIntersectsObject(friendState, friendElement, objectConfig);
          let newlyRegistered = false;
          if (isAllowedBouncer && currentFriendOverlaps) {
            newlyRegistered = registerTrampolineFriend(objectConfig.id, friendState, friendElement);
          } else {
            unregisterTrampolineFriend(objectConfig.id, friendState.id);
          }
          const hasRegisteredTrampolineFriend = Boolean(trampolineFriends.get(objectConfig.id)?.size);
          if (hasRegisteredTrampolineFriend && !trampolineTimers.has(objectConfig.id)) {
            startTrampolineAnimation(objectConfig.id, objectConfig);
          } else if (hasRegisteredTrampolineFriend && trampolineTimers.has(objectConfig.id) && newlyRegistered) {
            applyTrampolineFriendFrame(
              objectConfig.id,
              trampolineFrames.get(objectConfig.id) || "down"
            );
          } else if (!hasRegisteredTrampolineFriend && trampolineTimers.has(objectConfig.id)) {
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

    function syncCup(cupState, cupElement) {
      if (!cupState || !cupElement || !activeWorld) {
        return;
      }

      getObjects().forEach((objectConfig) => {
        if (objectConfig.id !== "trampoline") {
          return;
        }

        const registeredCupId = `cup:${cupElement.dataset?.cupId || cupState.id || "active"}`;
        const activeFriends = activeFriendsByObject.get(objectConfig.id) || new Set();
        activeFriends.delete(registeredCupId);

        const overlaps = friendIntersectsObject(
          { worldX: cupState.worldX, worldY: cupState.worldY },
          cupElement,
          objectConfig
        );
        let newlyRegistered = false;
        if (overlaps) {
          activeFriends.add(registeredCupId);
          newlyRegistered = registerTrampolineFriend(
            objectConfig.id,
            { id: registeredCupId, type: "cup" },
            cupElement
          );
        } else {
          unregisterTrampolineFriend(objectConfig.id, registeredCupId);
        }

        activeFriendsByObject.set(objectConfig.id, activeFriends);
        const isActive = activeFriends.size > 0;
        const hasRegisteredTrampolineFriend = (trampolineFriends.get(objectConfig.id)?.size || 0) > 0;
        const anchor = container.querySelector(`[data-object-id="${objectConfig.id}"]`);
        anchor?.classList.toggle("active", isActive);
        if (isActive && !trampolineTimers.has(objectConfig.id)) {
          startTrampolineAnimation(objectConfig.id, objectConfig);
        } else if (isActive && trampolineTimers.has(objectConfig.id) && newlyRegistered) {
          applyTrampolineFriendFrame(
            objectConfig.id,
            trampolineFrames.get(objectConfig.id) || "down"
          );
        } else if (!isActive && trampolineTimers.has(objectConfig.id)) {
          stopTrampolineAnimation(objectConfig.id);
        }
      });
    }

    function removeFriend(friendId) {
      if (!friendId) {
        return;
      }

      activeFriendsByObject.forEach((activeFriends, objectId) => {
        activeFriends.delete(friendId);
        unregisterTrampolineFriend(objectId, friendId);
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
      syncCup,
      removeFriend,
    };
  }

  window.CuppyLandBackgroundObjectController = {
    createController,
  };
})();
