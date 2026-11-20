(function () {
  function rectsOverlap(firstRect, secondRect) {
    return firstRect.right >= secondRect.left
      && firstRect.left <= secondRect.right
      && firstRect.bottom >= secondRect.top
      && firstRect.top <= secondRect.bottom;
  }

  function findOverlappingElement(worldCanvas, sourceElement, targetSelector) {
    if (!worldCanvas || !sourceElement) {
      return null;
    }
    const sourceRect = sourceElement.getBoundingClientRect();
    return Array.from(worldCanvas.querySelectorAll(targetSelector)).find((targetElement) => (
      rectsOverlap(targetElement.getBoundingClientRect(), sourceRect)
    )) || null;
  }

  window.CuppyLandFriendOverlap = {
    rectsOverlap,
    findOverlappingElement,
  };
})();
