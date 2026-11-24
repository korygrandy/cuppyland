(function () {
  function createController(options) {
    const {
      state,
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

    function getWorldViewportAnchorPoint() {
      if (!worldViewport || !worldCanvas) {
        return { worldX: 920, worldY: 430 };
      }

      const baseX = (worldViewport.scrollLeft ?? 0) + (worldViewport.clientWidth ?? 1280) * 0.52;
      const baseY = (worldViewport.clientHeight ?? 800) * 0.58;
      const maxX = Math.max(220, worldCanvas.offsetWidth - 260);
      const maxY = Math.max(200, worldCanvas.offsetHeight - 180);

      return {
        worldX: Math.min(Math.max(220, baseX), maxX),
        worldY: Math.min(Math.max(200, baseY), maxY),
      };
    }

    function getDefaultFriendDropPoint(friendType = "") {
      const visibleAnchor = getWorldViewportAnchorPoint();
      const worldList = state?.worlds?.[state?.activeWorld]?.friends ?? [];
      const instanceIndex = worldList.length;

      if (state?.activeWorld === "playground") {
        const offsetX = (instanceIndex % 3) * 120 - 120;
        const offsetY = (instanceIndex % 2 === 0 ? 0 : 80) + Math.floor(instanceIndex / 2) * 14;
        const maxX = Math.max(220, (worldCanvas?.offsetWidth || 6600) - 260);
        const maxY = Math.max(200, (worldCanvas?.offsetHeight || 900) - 180);
        return {
          worldX: Math.min(Math.max(220, visibleAnchor.worldX + offsetX), maxX),
          worldY: Math.min(Math.max(200, visibleAnchor.worldY + offsetY), maxY),
        };
      }

      const viewportRect = worldViewport?.getBoundingClientRect?.() || { left: 0, top: 0 };
      const centerClientX = viewportRect.left + (worldViewport?.clientWidth || 1280) / 2;
      const centerClientY = viewportRect.top + (worldViewport?.clientHeight || 800) / 2;
      const basePoint = getWorldDropPoint(centerClientX, centerClientY);
      if (state?.activeWorld === "olivia-room" && friendType === "chocolate-milk") {
        return {
          worldX: Math.max(0, basePoint.worldX - 500),
          worldY: basePoint.worldY,
        };
      }
      return basePoint;
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
