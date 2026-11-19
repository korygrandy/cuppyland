(function () {
  function createController(options) {
    const {
      documentRef,
      windowRef,
      audio,
      ui,
      handlers,
      actions,
    } = options;

    function wireEvents() {
      documentRef.addEventListener("pointerdown", () => audio.unlockAudio(), { once: true });
      documentRef.addEventListener("keydown", () => audio.unlockAudio(), { once: true });
      documentRef.addEventListener("visibilitychange", audio.handleAppVisibilityChange);
      windowRef.addEventListener("blur", audio.handleAppVisibilityChange);
      windowRef.addEventListener("pagehide", audio.handleAppVisibilityChange);
      windowRef.addEventListener("pageshow", audio.handleAppVisibilityChange);

      ui.playBtn.addEventListener("click", () => {
        audio.playSfxClip("welcomeToCuppyland");
        actions.showScreen("worldSelect");
      });

      ui.backToSplashBtn.addEventListener("click", () => {
        audio.playSfx("standard");
        actions.showScreen("splash");
      });

      ui.worldButtons.forEach((button) => {
        button.addEventListener("click", () => {
          audio.playSfx("standard");
          actions.openWorld(button.dataset.world);
        });
      });

      ui.inventoryToggleBtn.addEventListener("click", () => {
        audio.playSfx("standard");
        actions.toggleInventory();
      });

      ui.closeWorldBtn.addEventListener("click", () => {
        audio.playSfx("close");
        actions.showCloseModal();
      });

      ui.confirmCloseBtn.addEventListener("click", () => {
        audio.playSfx("yes");
        actions.hideCloseModal();
        actions.closeWorld();
      });

      ui.cancelCloseBtn.addEventListener("click", () => {
        audio.playSfx("no");
        actions.hideCloseModal();
      });

      windowRef.addEventListener("resize", () => {
        actions.updateLandscapePrompt();
        actions.updateGameViewportScale();
      });
      if (windowRef.visualViewport) {
        windowRef.visualViewport.addEventListener("resize", actions.updateGameViewportScale);
        windowRef.visualViewport.addEventListener("scroll", actions.updateGameViewportScale);
      }

      ui.cupCharacter.addEventListener("pointerdown", handlers.onCupPointerDown);
      ui.cupCharacter.addEventListener("pointermove", handlers.onCupPointerMove);
      ui.cupCharacter.addEventListener("pointerup", handlers.onCupPointerUp);
      ui.cupCharacter.addEventListener("pointercancel", handlers.onCupPointerUp);

      ui.cupLayer.addEventListener("pointerdown", handlers.onCupPointerDown);
      ui.cupLayer.addEventListener("pointermove", handlers.onCupPointerMove);
      ui.cupLayer.addEventListener("pointerup", handlers.onCupPointerUp);
      ui.cupLayer.addEventListener("pointercancel", handlers.onCupPointerUp);

      ui.lidLayer.addEventListener("pointerdown", handlers.onLidPointerDown);
      ui.lidLayer.addEventListener("pointermove", handlers.onLidPointerMove);
      ui.lidLayer.addEventListener("pointerup", handlers.onLidPointerUp);
      ui.lidLayer.addEventListener("pointercancel", handlers.onLidPointerUp);

      ui.hairstyleLayer.addEventListener("pointerdown", handlers.onHairstylePointerDown);
      ui.hairstyleLayer.addEventListener("pointermove", handlers.onHairstylePointerMove);
      ui.hairstyleLayer.addEventListener("pointerup", handlers.onHairstylePointerUp);
      ui.hairstyleLayer.addEventListener("pointercancel", handlers.onHairstylePointerUp);

      ui.sleeveLayer.addEventListener("pointerdown", handlers.onSleevePointerDown);
      ui.sleeveLayer.addEventListener("pointermove", handlers.onSleevePointerMove);
      ui.sleeveLayer.addEventListener("pointerup", handlers.onSleevePointerUp);
      ui.sleeveLayer.addEventListener("pointercancel", handlers.onSleevePointerUp);

      ui.inventoryPanel.addEventListener("pointerdown", handlers.onInventoryPointerDown);
      ui.inventoryPanel.addEventListener("click", handlers.onInventoryClick);
      ui.inventoryPanel.addEventListener("pointermove", handlers.onInventoryPointerMove);
      ui.inventoryPanel.addEventListener("pointerup", handlers.onInventoryPointerEnd);
      ui.inventoryPanel.addEventListener("pointercancel", handlers.onInventoryPointerEnd);

      ui.musicVolumeInput.addEventListener("input", audio.handleMusicVolumeChange);
      ui.sfxVolumeInput.addEventListener("input", audio.handleSfxVolumeChange);
      ui.musicMuteBtn.addEventListener("click", audio.toggleMusicMute);
      ui.sfxMuteBtn.addEventListener("click", audio.toggleSfxMute);

    }

    function init() {
      audio.loadAudioSettings();
      audio.applyMusicVolume();
      audio.syncAudioControlsUi();
      actions.buildInventoryItems();
      actions.renderCup();
      wireEvents();
      actions.updateLandscapePrompt();
      actions.updateGameViewportScale();
      actions.showScreen("splash");
      actions.loadTintAssets();
    }

    return {
      wireEvents,
      init,
    };
  }

  window.CuppyLandBootstrapController = {
    createController,
  };
})();
