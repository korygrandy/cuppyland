(function () {
  function createController(options = {}) {
    const documentRef = options.documentRef || document;
    const worldCanvas = options.worldCanvas || null;

    function findElementAtPoint(event, targetSelector) {
      const targetedElement = documentRef.elementFromPoint
        ? documentRef.elementFromPoint(event.clientX, event.clientY)
        : null;
      let targetElement = targetedElement?.closest?.(targetSelector) || null;
      if (!targetElement && worldCanvas) {
        targetElement = Array.from(worldCanvas.querySelectorAll(targetSelector)).find((candidate) => {
          const rect = candidate.getBoundingClientRect();
          return event.clientX >= rect.left
            && event.clientX <= rect.right
            && event.clientY >= rect.top
            && event.clientY <= rect.bottom;
        }) || null;
      }
      return targetElement;
    }

    function resolve(event, dragState) {
      if (!dragState?.active) {
        return { handled: false };
      }
      const isFriendDrop = dragState.type === "friend";

      if (!isFriendDrop && dragState.type === "hairstyle") {
        const friendElement = findElementAtPoint(event, '.friend-character[data-friend-id]');
        if (friendElement && options.onDirectObjectHairstyle) {
          if (options.onDirectObjectHairstyle(friendElement.dataset.friendId, "hairstyle", dragState.value)) {
            return { handled: true };
          }
        }
      }

      if (!isFriendDrop && ["lid", "cup", "sleeve", "expression", "hairstyle"].includes(dragState.type)) {
        const babyElement = findElementAtPoint(event, '.friend-character[data-friend-type="baby-mr-chocolate-milk"]');
        if (babyElement && options.onDirectBabyMilkPart) {
          if (options.onDirectBabyMilkPart(babyElement.dataset.friendId, dragState.type, dragState.value)) {
            return { handled: true };
          }
        }
      }

      if (isFriendDrop && dragState.value === "golden-puppy") {
        const bedElement = findElementAtPoint(event, '.friend-character[data-friend-type="dogbed"]');
        if (bedElement && options.onDirectPuppyToBed?.(bedElement.dataset.friendId)) {
          return { handled: true };
        }
      }

      if (isFriendDrop && dragState.value === "dogfood") {
        const bowlElement = findElementAtPoint(event, '.friend-character[data-friend-type="dogbowl"]');
        if (bowlElement && options.onDirectDogFood?.(bowlElement.dataset.friendId)) {
          return { handled: true };
        }
      }

      if (isFriendDrop && (dragState.value === "fishbowl" || dragState.value === "water-bottle")) {
        const bowlElement = findElementAtPoint(event, '.friend-character[data-friend-type="water-bowl"]');
        if (bowlElement && options.onDirectWaterSource?.(bowlElement.dataset.friendId, dragState.value)) {
          return { handled: true };
        }
      }

      if (isFriendDrop
        && ["dogbone", "rope-dogtoy", "dogtoy-ball", "squirrel"].includes(dragState.value)) {
        const puppyElement = findElementAtPoint(event, '.friend-character[data-friend-type="golden-puppy"]');
        if (puppyElement && options.onDirectPuppyToy?.(dragState.value, puppyElement.dataset.friendId)) {
          return { handled: true, resetChocolateMilkFill: true };
        }
      }

      return { handled: false };
    }

    return { resolve };
  }

  window.CuppyLandInventoryDirectDropResolver = {
    createController,
  };
})();
