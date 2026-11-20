(function () {
  function resolvePlayingAsset(options = {}) {
    const {
      toyType = "",
      friendState = {},
      assetMap = {},
    } = options;

    if (toyType === "rope") {
      return assetMap["golden-puppy-playing-rope"] || assetMap["golden-puppy-playing"] || "";
    }
    if (toyType === "bone") {
      return assetMap["golden-puppy-playing-bone"] || assetMap["golden-puppy-playing"] || "";
    }
    if (toyType === "ball") {
      const hasOtherToy = !friendState?.hasBall && (friendState?.hasRope || friendState?.hasBone);
      if (hasOtherToy) {
        if (friendState?.hasRope) {
          return assetMap["golden-puppy-playing-rope"] || assetMap["golden-puppy-playing"] || "";
        }
        if (friendState?.hasBone) {
          return assetMap["golden-puppy-playing-bone"] || assetMap["golden-puppy-playing"] || "";
        }
      }
      return assetMap["golden-puppy-playing-with-ball"] || assetMap["golden-puppy-playing"] || "";
    }
    return assetMap["golden-puppy-playing"] || "";
  }

  window.CuppyLandPuppySequenceAssetHelper = {
    resolvePlayingAsset,
  };
})();
