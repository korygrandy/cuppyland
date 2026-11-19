(function () {
  function createController(options) {
    const {
      container,
      playSfxClip = () => {},
    } = options;

    const activeFriendsByObject = new Map();
    const fadeTimers = new Map();
    let activeWorld = null;

    function getObjects(worldId = activeWorld) {
      return window.CuppyLandGame?.backgroundObjectAnchors?.[worldId] || [];
    }

    function render(worldId) {
      activeWorld = worldId;
      container.innerHTML = "";
      activeFriendsByObject.clear();
      fadeTimers.forEach((timerId) => clearTimeout(timerId));
      fadeTimers.clear();

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
