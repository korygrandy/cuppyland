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
    if (toyType === "squirrel") {
      return assetMap["golden-puppy-playing-with-squirrel"] || assetMap["golden-puppy-playing"] || "";
    }
    return assetMap["golden-puppy-playing"] || "";
  }

  function resolveFinalAsset(options = {}) {
    const {
      friendState = {},
      assetMap = {},
    } = options;
    if (friendState.hasBall) {
      return assetMap["golden-puppy-sitting-with-ball"] || assetMap["golden-puppy-sitting"] || "";
    }
    if (friendState.hasSquirrel) {
      return assetMap["golden-puppy-sitting-with-squirrel"] || assetMap["golden-puppy-sitting"] || "";
    }
    if (friendState.hasBone) {
      return assetMap["golden-puppy-with-bone-sitting"] || assetMap["golden-puppy-sitting"] || "";
    }
    if (friendState.hasRope) {
      return assetMap["golden-puppy-with-rope-sitting"] || assetMap["golden-puppy-sitting"] || "";
    }
    return assetMap["golden-puppy-sitting"] || "";
  }

  window.CuppyLandPuppySequenceAssetHelper = {
    resolvePlayingAsset,
    resolveFinalAsset,
  };
})();
