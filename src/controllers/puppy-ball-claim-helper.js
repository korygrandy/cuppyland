(function () {
  function tryClaim(ballState, puppyId) {
    if (!ballState || !puppyId) {
      return false;
    }
    if (ballState.claimedByPuppyId && ballState.claimedByPuppyId !== puppyId) {
      return false;
    }
    ballState.claimedByPuppyId = puppyId;
    ballState.claimedAtMs = Date.now();
    return true;
  }

  function release(ballState, puppyId = null) {
    if (!ballState) {
      return;
    }
    if (puppyId && ballState.claimedByPuppyId && ballState.claimedByPuppyId !== puppyId) {
      return;
    }
    ballState.claimedByPuppyId = null;
    ballState.claimedAtMs = 0;
  }

  window.CuppyLandPuppyBallClaimHelper = {
    tryClaim,
    release,
  };
})();
