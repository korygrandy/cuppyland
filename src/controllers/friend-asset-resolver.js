(function () {
  function isBarbieActivated(friendState) {
    if (!friendState) {
      return false;
    }
    return Boolean(
      friendState.activated
      || friendState.attachedCupId
      || friendState.sequenceFrame === 2
      || friendState.sequenceFrame === "activated"
    );
  }

  function resolveFriendAsset(friendState, options = {}) {
    const getFriendAssetMap = options.getFriendAssetMap || (() => ({}));
    const petAssetController = options.petAssetController || null;
    if (!friendState) {
      return "";
    }
    const assetMap = getFriendAssetMap();

    if (friendState.type === "turkey") {
      if (friendState.sequenceFrame === 2) {
        return assetMap["turkey-sequence-2"] || assetMap[friendState.type] || "";
      }
      if (friendState.sequenceFrame === 1) {
        return assetMap[friendState.type] || "";
      }
    }
    if (friendState.type === "lavalamp") {
      if (friendState.sequenceFrame === 2) {
        return assetMap["lavalamp-sequence-2"] || assetMap["lavalamp-sequence-1"] || assetMap[friendState.type] || "";
      }
      if (friendState.sequenceFrame === 3) {
        return assetMap["lavalamp-sequence-3"] || assetMap["lavalamp-sequence-1"] || assetMap[friendState.type] || "";
      }
      return assetMap["lavalamp-sequence-1"] || assetMap[friendState.type] || "";
    }
    if (friendState.type === "barbie-blonde") {
      return isBarbieActivated(friendState)
        ? (assetMap["barbie-blonde-activated"] || assetMap[friendState.type] || "")
        : (assetMap[friendState.type] || "");
    }
    if (friendState.type === "barbie-blonde-baby") {
      return isBarbieActivated(friendState)
        ? (assetMap["barbie-blonde-baby-activated"] || assetMap[friendState.type] || "")
        : (assetMap[friendState.type] || "");
    }
    if (friendState.type === "merry-go-round") {
      return friendState.activated
        ? (assetMap["merry-go-round-animated"] || assetMap[friendState.type] || "")
        : (assetMap[friendState.type] || "");
    }
    if (friendState.type === "golden-puppy") {
      return petAssetController?.resolveGoldenPuppy(friendState)
        || assetMap[friendState.type]
        || "";
    }
    if (friendState.type === "fishbowl") {
      return assetMap["fishbowl-sequence-1"] || "";
    }
    if (friendState.type === "chocolate-milk" || friendState.type === "baby-mr-chocolate-milk") {
      if (friendState.sequenceFrame === 2) {
        return assetMap["chocolate-milk-sequence-2"] || assetMap[friendState.type] || "";
      }
      if (friendState.sequenceFrame === 3) {
        return assetMap["chocolate-milk-sequence-3"] || assetMap[friendState.type] || "";
      }
    }
    if (friendState.type === "dogbed") {
      if (friendState.sleeping) {
        return assetMap["dogbed-with-dog-sleeping"] || assetMap["dogbed-with-dog"] || assetMap[friendState.type] || "";
      }
      if (friendState.activated) {
        return assetMap["dogbed-with-dog"] || assetMap[friendState.type] || "";
      }
    }
    if (friendState.type === "water-bowl") {
      return friendState.full
        ? (assetMap["water-bowl-full"] || assetMap[friendState.type] || "")
        : (assetMap[friendState.type] || "");
    }
    if (friendState.type === "dogbowl") {
      return friendState.hasFood
        ? (assetMap["dogbowl-with-food"] || assetMap[friendState.type] || "")
        : (assetMap[friendState.type] || "");
    }
    if (friendState.type === "dogbowl-with-food") {
      return assetMap["dogbowl-with-food"] || assetMap["dogbowl"] || "";
    }
    if (friendState.type === "doghouse") {
      return petAssetController?.resolveDoghouse(friendState)
        || assetMap[friendState.type]
        || "";
    }
    return assetMap[friendState.type] || "";
  }

  window.CuppyLandFriendAssetResolver = {
    isBarbieActivated,
    resolveFriendAsset,
  };
})();
