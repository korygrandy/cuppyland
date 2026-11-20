(function () {
  function createController() {
    const timers = new Map();

    function set(key, callback, delayMs) {
      clear(key);
      const timerId = window.setTimeout(() => {
        timers.delete(key);
        callback();
      }, delayMs);
      timers.set(key, timerId);
      return timerId;
    }

    function setInterval(key, callback, delayMs) {
      clear(key);
      const timerId = window.setInterval(callback, delayMs);
      timers.set(key, timerId);
      return timerId;
    }

    function clear(key) {
      if (!timers.has(key)) {
        return false;
      }
      const timerId = timers.get(key);
      if (typeof window.clearInterval === "function") {
        window.clearInterval(timerId);
      }
      window.clearTimeout(timerId);
      timers.delete(key);
      return true;
    }

    function clearPrefix(prefix) {
      Array.from(timers.keys())
        .filter((key) => String(key).startsWith(prefix))
        .forEach(clear);
    }

    function clearAll() {
      Array.from(timers.keys()).forEach(clear);
    }

    return {
      set,
      setInterval,
      clear,
      clearPrefix,
      clearAll,
    };
  }

  window.CuppyLandTimerLifecycle = {
    createController,
  };
})();
