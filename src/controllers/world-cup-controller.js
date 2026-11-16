(function () {
  function createController(options) {
    const {
      state,
      worldCanvas,
      cupCharacter,
      getWorldCupList,
      ensureCupLayerOrder,
      renderCupInstance,
      renderWorldFriends,
      syncWorldCupSelection,
      syncCupSelectionVisualState,
      cupPointerHandlers,
    } = options;

    function createCupElement(cupId, cupState) {
      const template = cupCharacter.cloneNode(true);
      template.dataset.cupId = cupId;
      template.id = `cupCharacter-${cupId}`;
      template.classList.remove("hidden-object");
      template.style.left = `${cupState.worldX}px`;
      template.style.top = `${cupState.worldY}px`;
      template.style.zIndex = String(ensureCupLayerOrder(cupState));

      template.querySelectorAll("[id]").forEach((node) => {
        const nextId = `${cupId}-${node.id}`;
        node.id = nextId;
        node.dataset.cupId = cupId;
      });

      const cupNode = template.querySelector(".cup-base");
      if (cupNode) {
        cupNode.dataset.cupId = cupId;
      }

      const lidNode = template.querySelector(".cup-lid");
      if (lidNode) {
        lidNode.dataset.cupId = cupId;
      }

      const sleeveNode = template.querySelector(".cup-sleeve");
      if (sleeveNode) {
        sleeveNode.dataset.cupId = cupId;
      }

      const hairstyleNode = template.querySelector(".cup-hairstyle");
      if (hairstyleNode) {
        hairstyleNode.dataset.cupId = cupId;
      }

      const faceNode = template.querySelector(".cup-face");
      if (faceNode) {
        faceNode.dataset.cupId = cupId;
      }

      template.addEventListener("pointerdown", cupPointerHandlers.onCupPointerDown);
      template.addEventListener("pointermove", cupPointerHandlers.onCupPointerMove);
      template.addEventListener("pointerup", cupPointerHandlers.onCupPointerUp);
      template.addEventListener("pointercancel", cupPointerHandlers.onCupPointerUp);

      template.querySelector(".cup-base")?.addEventListener("pointerdown", cupPointerHandlers.onCupPointerDown);
      template.querySelector(".cup-base")?.addEventListener("pointermove", cupPointerHandlers.onCupPointerMove);
      template.querySelector(".cup-base")?.addEventListener("pointerup", cupPointerHandlers.onCupPointerUp);
      template.querySelector(".cup-base")?.addEventListener("pointercancel", cupPointerHandlers.onCupPointerUp);

      template.querySelector(".cup-lid")?.addEventListener("pointerdown", cupPointerHandlers.onLidPointerDown);
      template.querySelector(".cup-lid")?.addEventListener("pointermove", cupPointerHandlers.onLidPointerMove);
      template.querySelector(".cup-lid")?.addEventListener("pointerup", cupPointerHandlers.onLidPointerUp);
      template.querySelector(".cup-lid")?.addEventListener("pointercancel", cupPointerHandlers.onLidPointerUp);

      template.querySelector(".cup-sleeve")?.addEventListener("pointerdown", cupPointerHandlers.onSleevePointerDown);
      template.querySelector(".cup-sleeve")?.addEventListener("pointermove", cupPointerHandlers.onSleevePointerMove);
      template.querySelector(".cup-sleeve")?.addEventListener("pointerup", cupPointerHandlers.onSleevePointerUp);
      template.querySelector(".cup-sleeve")?.addEventListener("pointercancel", cupPointerHandlers.onSleevePointerUp);

      template.querySelector(".cup-hairstyle")?.addEventListener("pointerdown", cupPointerHandlers.onHairstylePointerDown);
      template.querySelector(".cup-hairstyle")?.addEventListener("pointermove", cupPointerHandlers.onHairstylePointerMove);
      template.querySelector(".cup-hairstyle")?.addEventListener("pointerup", cupPointerHandlers.onHairstylePointerUp);
      template.querySelector(".cup-hairstyle")?.addEventListener("pointercancel", cupPointerHandlers.onHairstylePointerUp);

      return template;
    }

    function renderWorldCups() {
      worldCanvas.querySelectorAll(".cup-character").forEach((node) => node.remove());
      const worldCups = getWorldCupList(state.activeWorld);
      if (worldCups.length) {
        worldCups.forEach((cupInfo, index) => ensureCupLayerOrder(cupInfo.state, index + 1));

        [...worldCups]
          .sort((a, b) => ensureCupLayerOrder(a.state) - ensureCupLayerOrder(b.state))
          .forEach((cupInfo) => {
            const cupElement = createCupElement(cupInfo.id, cupInfo.state);
            cupElement.classList.toggle("is-selected", cupInfo.id === state.activeCupId);
            worldCanvas.appendChild(cupElement);
            renderCupInstance(cupInfo.state, cupElement);
          });

        syncWorldCupSelection();
        syncCupSelectionVisualState();
      }
      renderWorldFriends();
    }

    return {
      createCupElement,
      renderWorldCups,
    };
  }

  window.CuppyLandWorldCupController = {
    createController,
  };
})();
