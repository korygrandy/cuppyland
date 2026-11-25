(function () {
  function createController(options) {
    const game = window.CuppyLandGame || {};
    const imageCache = new Map();
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
      getCupInstanceById,
      getDefaultFriendDropPoint,
      getWorldDropPoint,
      onChocolateMilkFillStart,
      onChocolateMilkFillTick,
      onChocolateMilkFillCancel,
      onChocolateMilkFillComplete,
      onChocolateMilkFillEnd,
      worldCanvas,
      onDirectPuppyToy = null,
      onDirectDogFood = null,
      onDirectPuppyToBed = null,
      onDirectWaterSource = null,
      onDirectBabyMilkPart = null,
      onDirectObjectHairstyle = null,
    } = options;
    const directDropResolver = window.CuppyLandInventoryDirectDropResolver?.createController({
      documentRef: document,
      worldCanvas,
      onDirectObjectHairstyle,
      onDirectBabyMilkPart,
      onDirectPuppyToBed,
      onDirectDogFood,
      onDirectWaterSource,
      onDirectPuppyToy,
    });
    const chocolateMilkFillDurationMs = game.chocolateMilkSequence?.durationMs || 5000;
    const chocolateMilkFillState = {
      cupId: null,
      startedAtMs: 0,
      completed: false,
      completionTimerId: null,
    };

    function loadImage(src) {
      if (!src) {
        return Promise.reject(new Error("Missing image source"));
      }
      if (imageCache.has(src)) {
        return imageCache.get(src);
      }
      const imagePromise = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load ${src}`));
        image.src = src;
      });
      imageCache.set(src, imagePromise);
      return imagePromise;
    }

    function createTintedGhostCanvas(partType, colorName, width, height) {
      const canvas = document.createElement("canvas");
      canvas.className = "drag-ghost-object";
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const asset = partType === "lid" ? game.tintAssetConfig?.lid : game.tintAssetConfig?.cup;
      const colorHex = game.colorMap?.[colorName] || "#ffffff";
      if (!asset) {
        return canvas;
      }
      loadImage(asset)
        .then((image) => {
          const context = canvas.getContext("2d");
          if (!context) {
            return;
          }
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.fillStyle = colorHex;
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.save();
          context.globalCompositeOperation = "multiply";
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          context.restore();
          context.save();
          context.globalCompositeOperation = "destination-in";
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          context.restore();
        })
        .catch(() => {});
      return canvas;
    }

    function createVisualGhost(type, value, sourceItem) {
      if (type === "lid") {
        return createTintedGhostCanvas("lid", value, 232, 149);
      }

      if (type === "cup") {
        return createTintedGhostCanvas("cup", value, 220, 230);
      }

      if (type === "expression") {
        const face = document.createElement("span");
        face.className = "drag-ghost-object drag-ghost-expression";
        const faceAsset = game.expressionAssetMap?.[value] || game.expressionAssetMap?.happy;
        face.style.backgroundImage = `url("${faceAsset || ""}")`;
        return face;
      }

      if (type === "hairstyle") {
        const hair = document.createElement("span");
        hair.className = "drag-ghost-object drag-ghost-hairstyle";
        hair.style.backgroundImage = `url("${game.hairstyleAssetMap?.[value] || ""}")`;
        return hair;
      }

      if (type === "friend") {
        const friend = document.createElement("span");
        friend.className = "drag-ghost-object drag-ghost-friend";
        friend.style.backgroundImage = `url("${game.friendAssetMap?.[value] || ""}")`;
        if (value === "baby-mr-chocolate-milk") {
          friend.classList.add("drag-ghost-baby-mr-chocolate-milk");
          friend.innerHTML = [
            '<i class="drag-ghost-baby-cup-lid"></i>',
            '<i class="drag-ghost-baby-cup-sleeve"></i>',
            '<i class="drag-ghost-baby-cup-base"></i>',
          ].join("");
        }
        if (value === "uke") {
          friend.className = "drag-ghost-object drag-ghost-friend drag-ghost-uke";
        }
        if (value === "chocolate-milk" || value === "baby-mr-chocolate-milk") {
          friend.style.transform = "rotate(-45deg)";
        }
        return friend;
      }

      const fallbackThumb = sourceItem?.querySelector(".inventory-expression-thumb, .inventory-hairstyle-thumb, .inventory-friend-thumb");
      if (fallbackThumb) {
        const img = document.createElement("img");
        img.className = "drag-ghost-object";
        img.src = window.getComputedStyle(fallbackThumb).backgroundImage.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
        img.alt = "";
        return img;
      }
      return null;
    }

    function showDragGhost(pointerX, pointerY, sourceItem, type, value) {
      dragGhost.innerHTML = "";
      const visual = createVisualGhost(type, value, sourceItem);
      if (visual) {
        dragGhost.appendChild(visual);
      }
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

    function resetChocolateMilkFill(reason = "cancelled") {
      if (chocolateMilkFillState.completionTimerId) {
        clearTimeout(chocolateMilkFillState.completionTimerId);
        chocolateMilkFillState.completionTimerId = null;
      }
      if (!chocolateMilkFillState.cupId) {
        return;
      }

      const endedCupId = chocolateMilkFillState.cupId;
      if (!chocolateMilkFillState.completed && typeof onChocolateMilkFillCancel === "function") {
        onChocolateMilkFillCancel(endedCupId, reason);
      }
      if (!chocolateMilkFillState.completed && typeof onChocolateMilkFillEnd === "function") {
        onChocolateMilkFillEnd(endedCupId, reason);
      }
      chocolateMilkFillState.cupId = null;
      chocolateMilkFillState.startedAtMs = 0;
      chocolateMilkFillState.completed = false;
    }

    function completeChocolateMilkFill(cupId) {
      if (!cupId || chocolateMilkFillState.completed) {
        return;
      }

      if (chocolateMilkFillState.completionTimerId) {
        clearTimeout(chocolateMilkFillState.completionTimerId);
        chocolateMilkFillState.completionTimerId = null;
      }

      chocolateMilkFillState.completed = true;
      dragState.suppressClick = true;
      dragState.active = false;
      dragState.type = "";
      dragState.value = "";
      dragState.pointerId = null;
      dragState.moved = true;
      hideDragGhost();
      clearZoneHighlights();
      if (typeof onChocolateMilkFillComplete === "function") {
        onChocolateMilkFillComplete(cupId, dragState.value);
      }

      chocolateMilkFillState.cupId = null;
      chocolateMilkFillState.startedAtMs = 0;
      chocolateMilkFillState.completed = false;
    }

    function isOpenCupTarget(cupId) {
      if (!cupId) {
        return false;
      }
      const cupInstance = getCupInstanceById?.(cupId) || (getActiveCupInstance?.()?.id === cupId ? getActiveCupInstance?.() : null);
      if (!cupInstance?.state) {
        return false;
      }
      return cupInstance.state.lidVisible === false || cupInstance.state.lidDetached === true;
    }

    function updateChocolateMilkFill(pointerX, pointerY) {
      if (!(dragState.type === "friend"
        && (dragState.value === "chocolate-milk" || dragState.value === "baby-mr-chocolate-milk"))) {
        resetChocolateMilkFill("not-chocolate-milk");
        return;
      }

      const hoveredCup = getCupElementAtPoint(pointerX, pointerY);
      const hoveredCupId = hoveredCup?.dataset?.cupId || null;
      const zone = zoneForPoint(pointerX, pointerY);
      const isZoneNearCupOpening = zone === "cup" || zone === "lid";
      let isPointerNearCupOpening = false;
      if (hoveredCup) {
        const cupRect = hoveredCup.getBoundingClientRect();
        const localX = pointerX - cupRect.left;
        const localY = pointerY - cupRect.top;
        isPointerNearCupOpening = (
          localX >= cupRect.width * 0.2 &&
          localX <= cupRect.width * 0.8 &&
          localY >= cupRect.height * 0.02 &&
          localY <= cupRect.height * 0.42
        );
      }
      const isValidFillHover = isOpenCupTarget(hoveredCupId) && (isZoneNearCupOpening || isPointerNearCupOpening);
      if (!isValidFillHover) {
        resetChocolateMilkFill("left-fill-zone");
        return;
      }

      const nowMs = Date.now();
      if (chocolateMilkFillState.cupId !== hoveredCupId) {
        resetChocolateMilkFill("changed-cup");
        chocolateMilkFillState.cupId = hoveredCupId;
        chocolateMilkFillState.startedAtMs = nowMs;
        chocolateMilkFillState.completed = false;
        chocolateMilkFillState.completionTimerId = setTimeout(() => {
          const isStillDraggingChocolateMilk = dragState.active
            && dragState.type === "friend"
            && (dragState.value === "chocolate-milk" || dragState.value === "baby-mr-chocolate-milk");
          if (!isStillDraggingChocolateMilk || chocolateMilkFillState.cupId !== hoveredCupId || !isOpenCupTarget(hoveredCupId)) {
            return;
          }
          completeChocolateMilkFill(hoveredCupId);
        }, chocolateMilkFillDurationMs);
        if (typeof onChocolateMilkFillStart === "function") {
          onChocolateMilkFillStart(hoveredCupId, dragState.value);
        }
      }

      const elapsedMs = nowMs - chocolateMilkFillState.startedAtMs;
      if (typeof onChocolateMilkFillTick === "function") {
        onChocolateMilkFillTick(hoveredCupId, elapsedMs, Math.max(0, chocolateMilkFillDurationMs - elapsedMs));
      }

      if (elapsedMs >= chocolateMilkFillDurationMs && !chocolateMilkFillState.completed) {
        completeChocolateMilkFill(hoveredCupId);
      }
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
      showDragGhost(event.clientX, event.clientY, target, dragState.type, dragState.value);
      setZoneHighlight(event.clientX, event.clientY, dragState.type);
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
      const dropPoint = target.dataset.itemType === "friend"
        ? getDefaultFriendDropPoint(target.dataset.value)
        : null;
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
      setZoneHighlight(event.clientX, event.clientY, dragState.type);
      updateChocolateMilkFill(event.clientX, event.clientY);
    }

    function onPointerEnd(event) {
      if (!dragState.active || event.pointerId !== dragState.pointerId) {
        return;
      }

      const hoveredCup = getCupElementAtPoint(event.clientX, event.clientY);
      const targetCupId = hoveredCup?.dataset.cupId || getActiveCupId();
      const zone = zoneForPoint(event.clientX, event.clientY);
      const isFriendDrop = dragState.type === "friend";
      const directDrop = directDropResolver?.resolve(event, dragState) || { handled: false };
      if (directDrop.handled) {
        dragState.suppressClick = true;
        dragState.active = false;
        dragState.type = "";
        dragState.value = "";
        dragState.pointerId = null;
        dragState.moved = false;
        if (directDrop.resetChocolateMilkFill) {
          resetChocolateMilkFill("direct-puppy-toy");
        }
        hideDragGhost();
        clearZoneHighlights();
        return;
      }
      const dropPoint = isFriendDrop ? getWorldDropPoint(event.clientX, event.clientY) : null;
      const adjustedDropPoint = (isFriendDrop
        && (dragState.value === "chocolate-milk" || dragState.value === "baby-mr-chocolate-milk")
        && state.activeWorld === "olivia-room"
        && dropPoint)
        ? {
          worldX: Math.max(0, dropPoint.worldX - 500),
          worldY: dropPoint.worldY,
        }
        : dropPoint;
      const result = isFriendDrop
        ? applyDrop(dragState.type, dragState.value, zone || "friend", targetCupId, adjustedDropPoint)
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
      resetChocolateMilkFill("pointer-end");
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
