(function () {
  function createController(options) {
    const {
      overlay,
      config = {},
      setTimer = window.setTimeout.bind(window),
      clearTimer = window.clearTimeout.bind(window),
    } = options;

    let fadeTimerId = null;
    let hideTimerId = null;

    function clearTimers() {
      if (fadeTimerId) {
        clearTimer(fadeTimerId);
        fadeTimerId = null;
      }
      if (hideTimerId) {
        clearTimer(hideTimerId);
        hideTimerId = null;
      }
    }

    function hide() {
      if (!overlay) {
        return;
      }
      clearTimers();
      overlay.classList.remove("visible", "fading");
      overlay.style.backgroundImage = "";
    }

    function show(worldId) {
      if (!overlay) {
        return;
      }

      hide();
      const headlineAsset = config?.assets?.[worldId] || "";
      if (!headlineAsset) {
        return;
      }

      const displayMs = config?.durationMs ?? 3000;
      const fadeMs = config?.fadeOutMs ?? 700;
      overlay.style.transitionDuration = `${fadeMs}ms`;
      overlay.style.backgroundImage = `url("${headlineAsset}")`;
      overlay.classList.add("visible");
      hideTimerId = setTimer(() => {
        overlay.classList.add("fading");
        overlay.classList.remove("visible");
        fadeTimerId = setTimer(() => {
          hide();
        }, fadeMs);
      }, displayMs);
    }

    return {
      show,
      hide,
      clearTimers,
    };
  }

  window.CuppyLandWorldHeadlineController = {
    createController,
  };
})();
