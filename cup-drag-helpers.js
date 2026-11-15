(function () {
  function getRectCenter(rect) {
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  function centerDistance(rectA, rectB) {
    const centerA = getRectCenter(rectA);
    const centerB = getRectCenter(rectB);
    return Math.hypot(centerA.x - centerB.x, centerA.y - centerB.y);
  }

  function clampDetachedOffset({ initialLeft, initialTop, localX, localY, anchorX, anchorY, minLeft, maxLeft, minTop, maxTop }) {
    const nextLeft = Math.max(minLeft, Math.min(maxLeft, initialLeft + (localX - anchorX)));
    const nextTop = Math.max(minTop, Math.min(maxTop, initialTop + (localY - anchorY)));
    return { nextLeft, nextTop };
  }

  function createHelpers({ cupLayer, lidLayer, sleeveLayer, hairstyleLayer }) {
    function isLidNearCup(cupElement) {
      const cupBaseElement = (cupElement && cupElement.querySelector(".cup-base")) || cupLayer;
      const lidLayerElement = (cupElement && cupElement.querySelector(".cup-lid")) || lidLayer;
      return centerDistance(cupBaseElement.getBoundingClientRect(), lidLayerElement.getBoundingClientRect()) < 110;
    }

    function isSleeveNearCup(cupElement) {
      const cupBaseElement = (cupElement && cupElement.querySelector(".cup-base")) || cupLayer;
      const sleeveLayerElement = (cupElement && cupElement.querySelector(".cup-sleeve")) || sleeveLayer;
      return centerDistance(cupBaseElement.getBoundingClientRect(), sleeveLayerElement.getBoundingClientRect()) < 120;
    }

    function isHairstyleNearLid(cupElement, hairstyleVisible) {
      const lidRect = (cupElement.querySelector(".cup-lid") || lidLayer).getBoundingClientRect();
      const hairRect = (cupElement.querySelector(".cup-hairstyle") || hairstyleLayer).getBoundingClientRect();
      return centerDistance(lidRect, hairRect) < 90 && hairstyleVisible !== false;
    }

    return {
      clampDetachedOffset,
      isLidNearCup,
      isSleeveNearCup,
      isHairstyleNearLid,
    };
  }

  window.CuppyLandCupDrag = {
    createHelpers,
  };
})();
