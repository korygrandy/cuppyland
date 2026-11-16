(function () {
  function createController(options) {
    const {
      state,
      dragState,
      dragGhost,
      trySetPointerCapture,
      setZoneHighlight,
      clearZoneHighlights,
      getCupElementAtPoint,
      zoneForPoint,
      applyDrop,
      applyInventorySelection,
      showInvalidFeedback,
      renderWorldCups,
      getActiveCupId,
      getActiveCupInstance,
      getDefaultFriendDropPoint,
      getWorldDropPoint,
    } = options;

    function showDragGhost(pointerX, pointerY, label) {
      dragGhost.textContent = label;
      dragGhost.classList.remove("hidden");
      dragGhost.style.left = `${pointerX}px`;
      dragGhost.style.top = `${pointerY}px`;
    }

    function moveDragGhost(pointerX, pointerY) {
      dragGhost.style.left = `${pointerX}px`;
      dragGhost.style.top = `${pointerY}px`;
    }

    function hideDragGhost() {
      dragGhost.classList.add("hidden");
    }

    function onPointerDown(event) {
      const target = event.target.closest(".inventory-item");
      if (!target || state.currentScreen !== "world") {
        return;
      }

      if (target.dataset.itemType === "cup-create") {
        return;
      }

      event.preventDefault();
      dragState.active = true;
      dragState.type = target.dataset.itemType;
      dragState.value = target.dataset.value;
      dragState.pointerId = event.pointerId;
      dragState.moved = false;
      dragState.startX = event.clientX;
      dragState.startY = event.clientY;
      trySetPointerCapture(target, event.pointerId);
      showDragGhost(event.clientX, event.clientY, `${dragState.type}: ${dragState.value}`);
      setZoneHighlight(event.clientX, event.clientY);
    }

    function onClick(event) {
      const target = event.target.closest(".inventory-item");
      if (!target || state.currentScreen !== "world") {
        return;
      }

      if (dragState.suppressClick) {
        dragState.suppressClick = false;
        return;
      }

      event.preventDefault();
      const targetCupId = getActiveCupId() || getActiveCupInstance()?.id || null;
      const dropPoint = target.dataset.itemType === "friend" ? getDefaultFriendDropPoint() : null;
      applyInventorySelection(target.dataset.itemType, target.dataset.value, targetCupId, dropPoint);
    }

    function onPointerMove(event) {
      if (!dragState.active || event.pointerId !== dragState.pointerId) {
        return;
      }

      const deltaX = Math.abs(event.clientX - (dragState.startX || event.clientX));
      const deltaY = Math.abs(event.clientY - (dragState.startY || event.clientY));
      if (deltaX > 4 || deltaY > 4) {
        dragState.moved = true;
      }
      moveDragGhost(event.clientX, event.clientY);
      setZoneHighlight(event.clientX, event.clientY);
    }

    function onPointerEnd(event) {
      if (!dragState.active || event.pointerId !== dragState.pointerId) {
        return;
      }

      const hoveredCup = getCupElementAtPoint(event.clientX, event.clientY);
      const targetCupId = hoveredCup?.dataset.cupId || getActiveCupId();
      const zone = zoneForPoint(event.clientX, event.clientY);
      const isFriendDrop = dragState.type === "friend";
      const dropPoint = isFriendDrop ? getWorldDropPoint(event.clientX, event.clientY) : null;
      const result = isFriendDrop
        ? applyDrop(dragState.type, dragState.value, "friend", targetCupId, dropPoint)
        : (zone ? applyDrop(dragState.type, dragState.value, zone, targetCupId) : { valid: false, reason: "no-zone" });

      if (result.valid) {
        renderWorldCups();
      } else if (!isFriendDrop) {
        showInvalidFeedback();
      }

      dragState.suppressClick = isFriendDrop || dragState.moved;
      dragState.active = false;
      dragState.type = "";
      dragState.value = "";
      dragState.pointerId = null;
      dragState.moved = false;
      hideDragGhost();
      clearZoneHighlights();
    }

    return {
      onPointerDown,
      onClick,
      onPointerMove,
      onPointerEnd,
    };
  }

  window.CuppyLandInventoryInteraction = {
    createController,
  };
})();
