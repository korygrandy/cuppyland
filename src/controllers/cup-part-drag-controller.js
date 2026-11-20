(function () {
  function createController(options) {
    const { worldCanvas, gameplayConfig = {} } = options;

    function clampPartOffset(initialLeft, initialTop, localX, localY, anchorX, anchorY, dragClamp) {
      const nextLeft = initialLeft + (localX - anchorX);
      const nextTop = initialTop + (localY - anchorY);
      return {
        nextLeft: Math.max(dragClamp.minLeft ?? -60, Math.min(dragClamp.maxLeft ?? 200, nextLeft)),
        nextTop: Math.max(dragClamp.minTop ?? -80, Math.min(dragClamp.maxTop ?? 120, nextTop)),
      };
    }

    function getElementDragScale(element) {
      if (!element) {
        return 1;
      }
      const rect = element.getBoundingClientRect();
      const baseWidth = element.offsetWidth || rect.width || 1;
      const scale = rect.width / baseWidth;
      return Number.isFinite(scale) && scale > 0 ? scale : 1;
    }

    function clampWorldPosition(worldX, worldY, element) {
      const maxX = Math.max(0, worldCanvas.offsetWidth - element.offsetWidth);
      const maxY = Math.max(0, worldCanvas.offsetHeight - element.offsetHeight);
      return {
        worldX: Math.max(0, Math.min(maxX, worldX)),
        worldY: Math.max(0, Math.min(maxY, worldY)),
      };
    }

    return {
      clampPartOffset,
      getElementDragScale,
      clampWorldPosition,
    };
  }

  window.CuppyLandCupPartDragController = {
    createController,
  };
})();
