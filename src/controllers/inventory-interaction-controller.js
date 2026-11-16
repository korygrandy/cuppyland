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
      trySetPointerCapture(target, event.pointerId);
      showDragGhost(event.clientX, event.clientY, `${dragState.type}: ${dragState.value}`);
      setZoneHighlight(event.clientX, event.clientY);
    }

    function onClick(event) {
      const target = event.target.closest(".inventory-item");
      if (!target || state.currentScreen !== "world") {
        return;
      }

      event.preventDefault();
      const targetCupId = getActiveCupId() || getActiveCupInstance()?.id || null;
      applyInventorySelection(target.dataset.itemType, target.dataset.value, targetCupId);
    }

    function onPointerMove(event) {
      if (!dragState.active || event.pointerId !== dragState.pointerId) {
        return;
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
      const result = zone ? applyDrop(dragState.type, dragState.value, zone, targetCupId) : { valid: false, reason: "no-zone" };

      if (result.valid) {
        renderWorldCups();
      } else {
        showInvalidFeedback();
      }

      dragState.active = false;
      dragState.type = "";
      dragState.value = "";
      dragState.pointerId = null;
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
