(function () {
  function createController(options = {}) {
    const now = typeof options.now === "function" ? options.now : Date.now;

    function tryActivate(friendState, windowMs, activate) {
      if (!friendState) {
        return false;
      }
      const nowMs = now();
      const lastTapAtMs = Number.isFinite(friendState.lastTapAtMs)
        ? friendState.lastTapAtMs
        : 0;

      if (lastTapAtMs && nowMs - lastTapAtMs <= windowMs) {
        friendState.lastTapAtMs = 0;
        if (typeof activate === "function") {
          activate();
        }
        return true;
      }

      friendState.lastTapAtMs = nowMs;
      return false;
    }

    return { tryActivate };
  }

  window.CuppyLandFriendDoubleTapController = {
    createController,
  };
})();
