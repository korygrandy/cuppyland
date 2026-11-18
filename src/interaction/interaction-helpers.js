(function () {
  function createHelpers(options) {
    const {
      documentRef,
      worldViewport,
      gameplayConfig,
      dropZones = [],
      onHoveredCup = () => {},
    } = options;

    function safeClosest(target, selector) {
      if (!target || typeof target.closest !== "function") {
        return null;
      }
      return target.closest(selector);
    }

    function trySetPointerCapture(element, pointerId) {
      if (!element || typeof pointerId !== "number") {
        return;
      }

      try {
        element.setPointerCapture(pointerId);
      } catch (error) {
        // Some synthetic or touch events can arrive without a valid active pointer capture.
      }
    }

    function getCupElementAtPoint(x, y) {
      const hitElement = documentRef.elementFromPoint(x, y);
      if (!hitElement) {
        return null;
      }

      const cupElement = hitElement.closest(".cup-character[data-cup-id]");
      if (cupElement) {
        return cupElement;
      }

      const parentCup = hitElement.closest(".cup-lid, .cup-base, .cup-sleeve, .cup-hairstyle, .cup-face");
      return parentCup ? parentCup.closest(".cup-character[data-cup-id]") : null;
    }

    function getDropZoneForCup(cupElement, x, y) {
      if (!cupElement) {
        return null;
      }

      const hitElement = documentRef.elementFromPoint(x, y);
      const hitDropZone = hitElement?.closest(".drop-zone");
      if (hitDropZone?.dataset?.target) {
        return hitDropZone.dataset.target;
      }

      const zoneCandidates = Array.from(cupElement.querySelectorAll(".drop-zone"));
      const orderedZones = [...zoneCandidates].sort((a, b) => {
        const zonePriority = { sleeve: 3, lid: 2, hairstyle: 2, cup: 1 };
        return (zonePriority[b.dataset.target] || 0) - (zonePriority[a.dataset.target] || 0);
      });
      for (const zone of orderedZones) {
        const rect = zone.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          return zone.dataset.target;
        }
      }
      if (!hitElement) {
        return null;
      }

      if (hitElement.closest(".cup-lid")) {
        return "lid";
      }
      if (hitElement.closest(".cup-base")) {
        return "cup";
      }
      if (hitElement.closest(".cup-sleeve")) {
        return "sleeve";
      }
      if (hitElement.closest(".cup-hairstyle")) {
        return "hairstyle";
      }

      return null;
    }

    function zoneForPoint(x, y) {
      const hoveredCup = getCupElementAtPoint(x, y);
      if (hoveredCup) {
        const zone = getDropZoneForCup(hoveredCup, x, y);
        if (zone) {
          onHoveredCup(hoveredCup.dataset.cupId);
          return zone;
        }
      }

      for (const zone of dropZones) {
        const rect = zone.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          return zone.dataset.target;
        }
      }

      return null;
    }

    function setZoneHighlight(pointX, pointY, itemType = null) {
      dropZones.forEach((zone) => zone.classList.remove("highlight"));
      const zoneName = zoneForPoint(pointX, pointY);
      if (!zoneName) {
        return;
      }

      if (itemType === "hairstyle") {
        if (zoneName !== "lid") {
          return;
        }
      } else if (itemType === "expression") {
        if (zoneName !== "sleeve") {
          return;
        }
      } else if (itemType && zoneName !== itemType) {
        return;
      }

      const match = dropZones.find((zone) => zone.dataset.target === zoneName);
      if (match) {
        match.classList.add("highlight");
      }
    }

    function clearZoneHighlights() {
      dropZones.forEach((zone) => zone.classList.remove("highlight"));
    }

    function isPointerOutsideWorldCanvas(x, y, padding = gameplayConfig?.dragOutsidePadding ?? 12) {
      const bounds = worldViewport.getBoundingClientRect();
      return x < bounds.left - padding || x > bounds.right + padding || y < bounds.top - padding || y > bounds.bottom + padding;
    }

    return {
      safeClosest,
      trySetPointerCapture,
      getCupElementAtPoint,
      zoneForPoint,
      setZoneHighlight,
      clearZoneHighlights,
      isPointerOutsideWorldCanvas,
    };
  }

  window.CuppyLandInteraction = {
    createHelpers,
  };
})();
