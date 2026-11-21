(function () {
  function createController(options) {
    const {
      getWorldFriendList,
      findFriendById,
      isCupOpen,
      getSequenceConfig,
      syncAttachedFriendPosition,
      updateFriendElementAsset,
      getCupElementById = null,
      onCompleted = () => {},
      removeFriendInstance = () => false,
    } = options;

    const runtime = new Map();

    function ensureSpillEffect(cupId) {
      if (!cupId) {
        return null;
      }
      const cupElement = typeof getCupElementById === "function"
        ? getCupElementById(cupId)
        : null;
      if (!cupElement) {
        return null;
      }
      let spillElement = cupElement.querySelector(".chocolate-milk-spill");
      if (!spillElement) {
        spillElement = document.createElement("div");
        spillElement.className = "chocolate-milk-spill";
        spillElement.setAttribute("aria-hidden", "true");
        spillElement.innerHTML = [
          '<span class="milk-flow"></span>',
          '<span class="milk-splash"><i></i><i></i><i></i><i></i><i></i></span>',
        ].join("");
        cupElement.appendChild(spillElement);
      }
      cupElement.classList.add("is-spilling");
      return spillElement;
    }

    function stopSpillEffect(cupId) {
      const cupElement = typeof getCupElementById === "function"
        ? getCupElementById(cupId)
        : null;
      const spillElement = cupElement?.querySelector(".chocolate-milk-spill");
      if (spillElement) {
        spillElement.classList.remove("is-active");
        spillElement.remove();
      }
      cupElement?.classList.remove("is-spilling");
    }

    function isAttachedAndOpen(friendState) {
      if (!friendState || friendState.type !== "chocolate-milk" || !friendState.attachedCupId) {
        return false;
      }

      return Boolean(isCupOpen(friendState.attachedCupId));
    }

    function stop(friendId, keepFrame = false) {
      const activeRuntime = runtime.get(friendId);
      if (activeRuntime) {
        clearInterval(activeRuntime.intervalId);
        runtime.delete(friendId);
      }

      const friendState = findFriendById(friendId);
      if (friendState && !keepFrame) {
        friendState.sequenceFrame = null;
        updateFriendElementAsset(friendId);
        stopSpillEffect(friendState.attachedCupId);
      }
    }

    function start(friendState) {
      if (!friendState || runtime.has(friendState.id)) {
        return;
      }

      const sequenceConfig = getSequenceConfig();
      friendState.sequenceFrame = null;
      updateFriendElementAsset(friendState.id);
      const spillElement = ensureSpillEffect(friendState.attachedCupId);
      if (spillElement) {
        spillElement.classList.remove("is-active");
        void spillElement.offsetWidth;
        spillElement.classList.add("is-active");
      }

      const startedAt = Date.now();
      const intervalId = setInterval(() => {
        const activeFriend = findFriendById(friendState.id);
        if (!isAttachedAndOpen(activeFriend)) {
          stop(friendState.id);
          return;
        }

        syncAttachedFriendPosition(activeFriend);
        const elapsedMs = Date.now() - startedAt;
        const currentSpill = ensureSpillEffect(activeFriend.attachedCupId);
        if (currentSpill) {
          currentSpill.classList.toggle("is-pulsing", Math.floor(elapsedMs / 450) % 2 === 0);
        }

        if (elapsedMs >= sequenceConfig.durationMs) {
          const attachedCupId = activeFriend.attachedCupId;
          activeFriend.sequenceCompleted = true;
          stop(activeFriend.id);
          stopSpillEffect(attachedCupId);
          removeFriendInstance(activeFriend.id, { playRemovedSfx: false });
          if (attachedCupId) {
            onCompleted(attachedCupId);
          }
        }
      }, sequenceConfig.frameIntervalMs);

      runtime.set(friendState.id, { intervalId, startedAt });
    }

    function refresh() {
      const worldFriends = getWorldFriendList();
      const worldFriendIds = new Set(worldFriends.map((friend) => friend.id));

      runtime.forEach((_, friendId) => {
        if (!worldFriendIds.has(friendId)) {
          stop(friendId);
        }
      });

      worldFriends.forEach((friendState) => {
        if (isAttachedAndOpen(friendState) && !friendState.sequenceCompleted) {
          start(friendState);
          return;
        }

        if (runtime.has(friendState.id)) {
          stop(friendState.id);
        } else if (friendState.type === "chocolate-milk" && friendState.sequenceFrame) {
          friendState.sequenceFrame = null;
        }
      });
    }

    function stopAll() {
      Array.from(runtime.keys()).forEach((friendId) => stop(friendId));
    }

    function startForCup(friendId, cupId) {
      const friendState = findFriendById(friendId);
      if (!friendState || friendState.type !== "chocolate-milk" || !cupId) {
        return false;
      }
      const normalizedCupId = typeof cupId === "object" ? cupId.attachedCupId : cupId;
      if (!normalizedCupId || !isCupOpen(normalizedCupId)) {
        return false;
      }
      friendState.attachedCupId = normalizedCupId;
      friendState.sequenceCompleted = false;
      friendState.sequenceFrame = null;
      refresh();
      return true;
    }

    return {
      stop,
      refresh,
      stopAll,
      startForCup,
    };
  }

  window.CuppyLandChocolateMilkSequenceController = {
    createController,
  };
})();
