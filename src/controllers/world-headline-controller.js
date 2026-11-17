(function () {
  function createController(options) {
    const {
      overlay,
      config = {},
      cardHeadlineSelector = ".world-card-headline",
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

    function getHeadlineAsset(worldId) {
      return config?.assets?.[worldId] || "";
    }

    function syncCardHeadlines() {
      const headlines = Array.from(document.querySelectorAll(cardHeadlineSelector));
      headlines.forEach((headline) => {
        const worldCard = headline.closest(".world-card");
        if (!worldCard) {
          headline.style.backgroundImage = "";
          return;
        }

        const worldId = worldCard.dataset.world;
        const asset = getHeadlineAsset(worldId);
        headline.style.backgroundImage = asset ? `url("${asset}")` : "";
      });
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
      const headlineAsset = getHeadlineAsset(worldId);
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
      getHeadlineAsset,
      syncCardHeadlines,
      show,
      hide,
      clearTimers,
    };
  }

  window.CuppyLandWorldHeadlineController = {
    createController,
  };
})();
