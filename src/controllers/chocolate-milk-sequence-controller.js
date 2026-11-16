(function () {
  function createController(options) {
    const {
      getWorldFriendList,
      findFriendById,
      isCupOpen,
      getSequenceConfig,
      syncAttachedFriendPosition,
      updateFriendElementAsset,
      onCompleted = () => {},
    } = options;

    const runtime = new Map();

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
      }
    }

    function start(friendState) {
      if (!friendState || friendState.sequenceCompleted || runtime.has(friendState.id)) {
        return;
      }

      const sequenceConfig = getSequenceConfig();
      friendState.sequenceFrame = 2;
      updateFriendElementAsset(friendState.id);

      const startedAt = Date.now();
      const intervalId = setInterval(() => {
        const activeFriend = findFriendById(friendState.id);
        if (!isAttachedAndOpen(activeFriend)) {
          stop(friendState.id);
          return;
        }

        syncAttachedFriendPosition(activeFriend);
        const elapsedMs = Date.now() - startedAt;
        activeFriend.sequenceFrame = activeFriend.sequenceFrame === 2 ? 3 : 2;
        updateFriendElementAsset(activeFriend.id);

        if (elapsedMs >= sequenceConfig.durationMs) {
          const attachedCupId = activeFriend.attachedCupId;
          activeFriend.sequenceCompleted = true;
          stop(activeFriend.id);
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

    return {
      stop,
      refresh,
      stopAll,
    };
  }

  window.CuppyLandChocolateMilkSequenceController = {
    createController,
  };
})();
