(function () {
  function createController(options) {
    const {
      state,
      worldCanvas,
      friendDragState,
      trySetPointerCapture,
      isPointerOutsideWorldCanvas,
      resolveFriendStateForElement,
      getElementDragScale,
      getWorldPointFromClient,
      removeFriendInstance,
      stopChocolateMilkSequence,
      bringFriendElementToFront,
    } = options;

    function setFriendDragVisual(friendElement, friendState, isDragging) {
      if (!friendElement || !friendState || friendState.type !== "chocolate-milk") {
        return;
      }

      const friendArt = friendElement.querySelector(".friend-character-art");
      if (!friendArt) {
        return;
      }

      friendArt.style.transform = isDragging ? "rotate(-45deg)" : "";
      friendArt.style.transformOrigin = isDragging ? "center center" : "";
    }

    function resetFriendDragState() {
      friendDragState.active = false;
      friendDragState.pointerId = null;
      friendDragState.friendId = null;
      friendDragState.pointerOffsetX = 0;
      friendDragState.pointerOffsetY = 0;
    }

    function onPointerDown(event) {
      if (state.currentScreen !== "world") {
        return;
      }

      const friendElement = event.currentTarget.closest(".friend-character");
      const friendState = resolveFriendStateForElement(friendElement);
      if (!friendElement || !friendState) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const pointerScale = getElementDragScale(friendElement);
      const localPointerX = (event.clientX - friendElement.getBoundingClientRect().left) / pointerScale;
      const localPointerY = (event.clientY - friendElement.getBoundingClientRect().top) / pointerScale;
      friendDragState.active = true;
      friendDragState.pointerId = event.pointerId;
      friendDragState.friendId = friendState.id;
      friendDragState.pointerOffsetX = localPointerX;
      friendDragState.pointerOffsetY = localPointerY;
      if (friendState.type === "chocolate-milk") {
        friendState.attachedCupId = null;
        friendState.sequenceCompleted = false;
        stopChocolateMilkSequence(friendState.id);
      }
      if (typeof bringFriendElementToFront === "function") {
        bringFriendElementToFront(friendElement, friendState);
      }
      setFriendDragVisual(friendElement, friendState, true);
      trySetPointerCapture(friendElement, event.pointerId);
    }

    function onPointerMove(event) {
      if (!friendDragState.active || event.pointerId !== friendDragState.pointerId) {
        return;
      }

      if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
        const friendId = friendDragState.friendId;
        resetFriendDragState();
        removeFriendInstance(friendId);
        return;
      }

      const friendElement = event.currentTarget.closest(".friend-character");
      const friendState = resolveFriendStateForElement(friendElement);
      if (!friendElement || !friendState) {
        return;
      }

      const { worldX, worldY } = getWorldPointFromClient(event.clientX, event.clientY);
      const nextX = worldX - friendDragState.pointerOffsetX;
      const nextY = worldY - friendDragState.pointerOffsetY;
      friendState.worldX = Math.max(0, Math.min(worldCanvas.offsetWidth - friendElement.offsetWidth, nextX));
      friendState.worldY = Math.max(0, Math.min(worldCanvas.offsetHeight - friendElement.offsetHeight, nextY));
      friendElement.style.left = `${friendState.worldX}px`;
      friendElement.style.top = `${friendState.worldY}px`;
    }

    function onPointerUp(event) {
      if (!friendDragState.active || event.pointerId !== friendDragState.pointerId) {
        return;
      }

      const friendElement = event.currentTarget.closest(".friend-character");
      const friendState = resolveFriendStateForElement(friendElement);
      setFriendDragVisual(friendElement, friendState, false);

      if (isPointerOutsideWorldCanvas(event.clientX, event.clientY)) {
        removeFriendInstance(friendDragState.friendId);
      }

      resetFriendDragState();
    }

    return {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    };
  }

  window.CuppyLandFriendPointerController = {
    createController,
  };
})();
