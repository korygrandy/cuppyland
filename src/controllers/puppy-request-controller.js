(function () {
  function createController(options) {
    const {
      timerLifecycle = null,
      triggerCelebration = () => {},
      worldCanvas,
    } = options;
    const fallbackTimers = new Map();

    function clear(puppyState) {
      if (!puppyState?.id) {
        return;
      }
      timerLifecycle?.clear(`puppy-request:${puppyState.id}`);
      if (fallbackTimers.has(puppyState.id)) {
        clearTimeout(fallbackTimers.get(puppyState.id));
        fallbackTimers.delete(puppyState.id);
      }
      if (puppyState.requestTimerId) {
        clearTimeout(puppyState.requestTimerId);
        puppyState.requestTimerId = null;
      }
      puppyState.requestType = null;
      puppyState.requestExpiresAt = 0;
    }

    function schedule(puppyState) {
      if (!puppyState?.id) {
        return false;
      }
      if (Math.random() >= 0.5) {
        clear(puppyState);
        return false;
      }
      const requestType = Math.random() < 0.5 ? "food" : "drink";
      clear(puppyState);
      puppyState.requestType = requestType;
      puppyState.requestExpiresAt = Date.now() + 10000;
      const expire = () => {
        puppyState.requestType = null;
        puppyState.requestExpiresAt = 0;
        puppyState.requestTimerId = null;
        fallbackTimers.delete(puppyState.id);
      };
      if (timerLifecycle) {
        timerLifecycle.set(`puppy-request:${puppyState.id}`, expire, 10000);
      } else {
        puppyState.requestTimerId = setTimeout(expire, 10000);
        fallbackTimers.set(puppyState.id, puppyState.requestTimerId);
      }
      return true;
    }

    function complete(puppyState, requestType) {
      if (!puppyState?.id) {
        return false;
      }
      const isActive = puppyState.requestType === requestType
        && Number.isFinite(puppyState.requestExpiresAt)
        && puppyState.requestExpiresAt > Date.now();
      if (!isActive) {
        return false;
      }
      clear(puppyState);
      const puppyElement = worldCanvas?.querySelector
        ? worldCanvas.querySelector(`.friend-character[data-friend-id="${puppyState.id}"]`)
        : null;
      triggerCelebration(puppyState, puppyElement);
      return true;
    }

    return {
      schedule,
      complete,
      clear,
    };
  }

  window.CuppyLandPuppyRequestController = {
    createController,
  };
})();
