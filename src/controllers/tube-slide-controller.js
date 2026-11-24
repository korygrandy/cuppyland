(function () {
  function createController(options) {
    const {
      container,
      worldCanvas = null,
      findFriendById = () => null,
    } = options;

    let activeWorld = null;
    const activeSequences = new Map();
    const allowedTypes = new Set([
      "heart-women",
      "heart-man",
      "rocketman-craft",
      "furball-guy",
      "hairy-guy",
      "spongebob-stuffy",
      "pizza-man-craft",
      "chocolate-milk",
      "baby-mr-chocolate-milk",
      "barbie-blonde",
      "barbie-blonde-baby",
      "golden-puppy",
      "triceratops-bead-craft",
      "rabbit-bead-craft",
      "squirrel",
      "turkey",
    ]);

    function getConfig(worldId = activeWorld) {
      return window.CuppyLandGame?.backgroundObjectAnchors?.[worldId]
        ?.find((item) => item.id === "tube-slide") || null;
    }

    function rectsOverlap(element, config) {
      if (!element?.getBoundingClientRect || !worldCanvas) {
        return false;
      }
      const canvasRect = worldCanvas.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      if (!canvasRect.width || !canvasRect.height) {
        return false;
      }
      const scaleX = worldCanvas.offsetWidth ? canvasRect.width / worldCanvas.offsetWidth : 1;
      const scaleY = worldCanvas.offsetHeight ? canvasRect.height / worldCanvas.offsetHeight : 1;
      const left = (elementRect.left - canvasRect.left) / scaleX;
      const top = (elementRect.top - canvasRect.top) / scaleY;
      const right = (elementRect.right - canvasRect.left) / scaleX;
      const bottom = (elementRect.bottom - canvasRect.top) / scaleY;
      const hitLeft = config.x + (config.hitboxOffsetX ?? 0);
      const hitTop = config.y + (config.hitboxOffsetY ?? 0);
      const hitRight = hitLeft + (config.hitboxWidth ?? config.width);
      const hitBottom = hitTop + (config.hitboxHeight ?? config.height);
      return right >= hitLeft && left <= hitRight && bottom >= hitTop && top <= hitBottom;
    }

    function cancelSequence(id) {
      const sequence = activeSequences.get(id);
      if (!sequence) {
        return;
      }
      sequence.timers.forEach((timerId) => clearTimeout(timerId));
      const element = sequence.element;
      if (element) {
        element.style.transform = sequence.transform;
        element.style.transition = sequence.transition;
        element.style.opacity = sequence.opacity;
        element.classList.remove("tube-slide-entering", "tube-slide-exiting");
      }
      activeSequences.delete(id);
    }

    function startSequence(id, state, element, config) {
      if (!element || activeSequences.has(id)) {
        return false;
      }
      const sequence = {
        element,
        state,
        transform: element.style.transform || "",
        transition: element.style.transition || "",
        opacity: element.style.opacity || "",
        timers: [],
      };
      activeSequences.set(id, sequence);

      element.classList.remove("tube-slide-exiting");
      element.classList.add("tube-slide-entering");
      element.style.transition = "transform 650ms cubic-bezier(.2,.7,.2,1), opacity 650ms ease";
      element.style.transform = "translateY(-18px) rotate(7deg) scale(.08)";
      element.style.opacity = "0";

      const reappearTimer = setTimeout(() => {
        const reanchorX = config.x + (config.reanchorOffsetX ?? config.width * 0.7);
        const reanchorY = config.y + (config.reanchorOffsetY ?? config.height * 0.82);
        state.worldX = reanchorX;
        state.worldY = reanchorY;
        element.style.left = `${reanchorX}px`;
        element.style.top = `${reanchorY}px`;
        element.classList.remove("tube-slide-entering");
        element.classList.add("tube-slide-exiting");
        element.style.transition = "transform 650ms cubic-bezier(.2,.7,.2,1), opacity 650ms ease";
        element.style.transform = "translateY(18px) rotate(-3deg) scale(1)";
        element.style.opacity = "1";

        const finishTimer = setTimeout(() => {
          element.classList.remove("tube-slide-exiting");
          element.style.transform = sequence.transform;
          element.style.transition = sequence.transition;
          element.style.opacity = sequence.opacity;
          activeSequences.delete(id);
        }, 650);
        sequence.timers.push(finishTimer);
      }, 1650);
      sequence.timers.push(reappearTimer);
      return true;
    }

    function syncFriend(friendState, friendElement) {
      if (!activeWorld || activeWorld !== "playground" || !friendState || !friendElement) {
        return;
      }
      const config = getConfig();
      if (!config) {
        return;
      }
      const overlaps = rectsOverlap(friendElement, config);
      if (overlaps && allowedTypes.has(friendState.type)) {
        startSequence(`friend:${friendState.id}`, friendState, friendElement, config);
      } else if (!overlaps) {
        cancelSequence(`friend:${friendState.id}`);
      }
    }

    function syncCup(cupState, cupElement) {
      if (!activeWorld || activeWorld !== "playground" || !cupState || !cupElement) {
        return;
      }
      const config = getConfig();
      if (!config) {
        return;
      }
      const overlaps = rectsOverlap(cupElement, config);
      const cupId = cupElement.dataset?.cupId || cupState.id || "active";
      if (overlaps) {
        startSequence(`cup:${cupId}`, cupState, cupElement, config);
      } else {
        cancelSequence(`cup:${cupId}`);
      }
    }

    function render(worldId) {
      activeWorld = worldId;
      activeSequences.forEach((sequence, id) => cancelSequence(id));

      container.querySelectorAll(".tube-slide-debug-hitbox, .tube-slide-debug-reanchor").forEach((node) => node.remove());
      if (activeWorld !== "playground") {
        return;
      }
      const config = getConfig();
      if (!config) {
        return;
      }

      const hitbox = document.createElement("div");
      hitbox.className = "tube-slide-debug-hitbox";
      hitbox.style.left = `${config.x + (config.hitboxOffsetX ?? 0)}px`;
      hitbox.style.top = `${config.y + (config.hitboxOffsetY ?? 0)}px`;
      hitbox.style.width = `${config.hitboxWidth ?? config.width}px`;
      hitbox.style.height = `${config.hitboxHeight ?? config.height}px`;
      container.appendChild(hitbox);

      const reanchor = document.createElement("div");
      reanchor.className = "tube-slide-debug-reanchor";
      reanchor.style.left = `${config.x + (config.reanchorOffsetX ?? 0)}px`;
      reanchor.style.top = `${config.y + (config.reanchorOffsetY ?? 0)}px`;
      reanchor.style.width = `${config.reanchorWidth ?? 132}px`;
      reanchor.style.height = `${config.reanchorHeight ?? 132}px`;
      container.appendChild(reanchor);
    }

    return {
      render,
      syncFriend,
      syncCup,
    };
  }

  window.CuppyLandTubeSlideController = {
    createController,
  };
})();
