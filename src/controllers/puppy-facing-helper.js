(function () {
  function resolveFacing(friendState) {
    return friendState?.walkingFacing === "left" ? "left" : "right";
  }

  function syncFacing(friendState, friendElement) {
    if (!friendState || friendState.type !== "golden-puppy" || !friendElement) {
      return;
    }
    const facing = resolveFacing(friendState);
    friendElement.classList.toggle("is-facing-left", facing === "left");
    friendElement.classList.toggle("is-facing-right", facing === "right");
    const art = friendElement.querySelector(".friend-character-art");
    if (art) {
      art.style.transform = facing === "left" ? "scaleX(-1)" : "";
      art.style.transformOrigin = facing === "left" ? "center bottom" : "";
    }
  }

  function updateFacingFromMovement(friendState, previousWorldX, nextWorldX) {
    if (!friendState || friendState.type !== "golden-puppy" || !friendState.hasLeash) {
      return;
    }
    const movementDelta = nextWorldX - previousWorldX;
    if (movementDelta < -1) {
      friendState.walkingFacing = "right";
    } else if (movementDelta > 1) {
      friendState.walkingFacing = "left";
    }
  }

  window.CuppyLandPuppyFacingHelper = {
    resolveFacing,
    syncFacing,
    updateFacingFromMovement,
  };
})();
