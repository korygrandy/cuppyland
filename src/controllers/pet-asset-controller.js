(function () {
  function createController(options) {
    const { getFriendAssetMap = () => ({}), getWorldFriendList, state } = options;

    function resolveGoldenPuppy(friendState) {
      const assetMap = getFriendAssetMap();
      if (friendState?.hasBall) {
        return assetMap["golden-puppy-sitting-with-ball"] || assetMap["golden-puppy-sitting"] || assetMap[friendState.type] || "";
      }
      if (friendState?.hasSquirrel) {
        return assetMap["golden-puppy-sitting-with-squirrel"] || assetMap["golden-puppy-sitting"] || assetMap[friendState.type] || "";
      }
      if (friendState?.isDrinking) {
        return assetMap["golden-puppy-drinking"] || assetMap["golden-puppy-sitting"] || assetMap[friendState.type] || "";
      }
      if (friendState?.isEating) {
        return assetMap["golden-puppy-eating"] || assetMap["golden-puppy-sitting"] || assetMap[friendState.type] || "";
      }
      if (friendState?.hasRope) {
        return assetMap["golden-puppy-with-rope-sitting"] || assetMap["golden-puppy-sitting"] || assetMap[friendState.type] || "";
      }
      if (friendState?.hasBone) {
        return assetMap["golden-puppy-with-bone-sitting"] || assetMap["golden-puppy-sitting"] || assetMap[friendState.type] || "";
      }
      if (friendState?.activated) {
        return assetMap["golden-puppy-activated"] || assetMap[friendState.type] || "";
      }
      return assetMap["golden-puppy-sitting"] || assetMap[friendState.type] || "";
    }

    function resolveDoghouse(friendState) {
      const assetMap = getFriendAssetMap();
      if (!friendState?.activated) {
        return assetMap.doghouse || "";
      }

      const attachedPuppy = getWorldFriendList(state.activeWorld).find((friend) => (
        friend.type === "golden-puppy" && friend.doghouseId === friendState.id
      ));
      if (attachedPuppy?.hasBall) {
        return assetMap["doghouse-with-ball"] || assetMap["doghouse-with-dog"] || assetMap.doghouse || "";
      }
      if (attachedPuppy?.hasCollar) {
        return assetMap["doghouse-with-collar"] || assetMap["doghouse-with-dog"] || assetMap.doghouse || "";
      }
      if (attachedPuppy?.hasBone) {
        return assetMap["doghouse-with-bone"] || assetMap["doghouse-with-dog"] || assetMap.doghouse || "";
      }
      if (attachedPuppy?.hasRope) {
        return assetMap["doghouse-with-rope"] || assetMap["doghouse-with-dog"] || assetMap.doghouse || "";
      }
      return assetMap["doghouse-with-dog"] || assetMap.doghouse || "";
    }

    return {
      resolveGoldenPuppy,
      resolveDoghouse,
    };
  }

  window.CuppyLandPetAssetController = {
    createController,
  };
})();
