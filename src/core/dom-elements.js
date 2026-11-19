(function () {
  function createDomElements(documentRef = document) {
    return {
      screenEls: {
        splash: documentRef.getElementById("splashScreen"),
        worldSelect: documentRef.getElementById("worldSelectScreen"),
        world: documentRef.getElementById("worldScreen"),
      },
      playBtn: documentRef.getElementById("playBtn"),
      backToSplashBtn: documentRef.getElementById("backToSplashBtn"),
      worldButtons: Array.from(documentRef.querySelectorAll(".world-card")),
      closeWorldBtn: documentRef.getElementById("closeWorldBtn"),
      inventoryToggleBtn: documentRef.getElementById("inventoryToggleBtn"),
      inventoryPanel: documentRef.getElementById("inventoryPanel"),
      worldBackground: documentRef.getElementById("worldBackground"),
      worldBackgroundObjects: documentRef.getElementById("worldBackgroundObjects"),
      worldHeadlineOverlay: documentRef.getElementById("worldHeadlineOverlay"),
      worldViewport: documentRef.getElementById("worldViewport"),
      closeModal: documentRef.getElementById("closeModal"),
      confirmCloseBtn: documentRef.getElementById("confirmCloseBtn"),
      cancelCloseBtn: documentRef.getElementById("cancelCloseBtn"),
      rotatePrompt: documentRef.getElementById("rotatePrompt"),
      worldCanvas: documentRef.getElementById("worldCanvas"),
      cupCharacter: documentRef.getElementById("cupCharacter"),
      lidLayer: documentRef.getElementById("lidLayer"),
      cupLayer: documentRef.getElementById("cupLayer"),
      hairstyleLayer: documentRef.getElementById("hairstyleLayer"),
      sleeveLayer: documentRef.getElementById("sleeveLayer"),
      faceLayer: documentRef.getElementById("faceLayer"),
      dragGhost: documentRef.getElementById("dragGhost"),
      dropZoneLid: documentRef.getElementById("dropZoneLid"),
      dropZoneCup: documentRef.getElementById("dropZoneCup"),
      dropZoneSleeve: documentRef.getElementById("dropZoneSleeve"),
      musicVolumeInput: documentRef.getElementById("musicVolumeInput"),
      sfxVolumeInput: documentRef.getElementById("sfxVolumeInput"),
      musicVolumeValue: documentRef.getElementById("musicVolumeValue"),
      sfxVolumeValue: documentRef.getElementById("sfxVolumeValue"),
      musicMuteBtn: documentRef.getElementById("musicMuteBtn"),
      sfxMuteBtn: documentRef.getElementById("sfxMuteBtn"),
    };
  }

  window.CuppyLandDomElements = {
    createDomElements,
  };
})();
