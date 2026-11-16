(function () {
  function createController(options) {
    const {
      worldCanvas,
      worldViewport,
    } = options;

    function getElementDragScale(element) {
      if (!element) {
        return 1;
      }

      const rect = element.getBoundingClientRect();
      const baseWidth = element.offsetWidth || rect.width || 1;
      const derivedScale = rect.width / baseWidth;
      if (!Number.isFinite(derivedScale) || derivedScale <= 0) {
        return 1;
      }
      return derivedScale;
    }

    function getWorldPointFromClient(clientX, clientY) {
      const bounds = worldCanvas.getBoundingClientRect();
      const widthScale = bounds.width > 0 ? worldCanvas.offsetWidth / bounds.width : 1;
      const heightScale = bounds.height > 0 ? worldCanvas.offsetHeight / bounds.height : 1;
      return {
        worldX: (clientX - bounds.left) * widthScale,
        worldY: (clientY - bounds.top) * heightScale,
      };
    }

    function getWorldDropPoint(clientX, clientY) {
      const { worldX, worldY } = getWorldPointFromClient(clientX, clientY);
      return {
        worldX: Math.max(0, Math.min(worldCanvas.offsetWidth - 132, worldX - 66)),
        worldY: Math.max(0, Math.min(worldCanvas.offsetHeight - 132, worldY - 66)),
      };
    }

    function getDefaultFriendDropPoint() {
      const centerClientX = worldViewport.getBoundingClientRect().left + worldViewport.clientWidth / 2;
      const centerClientY = worldViewport.getBoundingClientRect().top + worldViewport.clientHeight / 2;
      return getWorldDropPoint(centerClientX, centerClientY);
    }

    return {
      getElementDragScale,
      getWorldPointFromClient,
      getWorldDropPoint,
      getDefaultFriendDropPoint,
    };
  }

  window.CuppyLandWorldCoordinateController = {
    createController,
  };
})();
