(function () {
  function canStartSequence(friendState) {
    return Boolean(friendState && !friendState.sequenceActive);
  }

  function canAttachCompanion(friendState) {
    return Boolean(friendState && !friendState.sequenceActive);
  }

  function shouldRenderCompanionOverlay(friendState) {
    return Boolean(friendState && !friendState.sequenceActive);
  }

  window.CuppyLandPuppySequenceGuardHelper = {
    canStartSequence,
    canAttachCompanion,
    shouldRenderCompanionOverlay,
  };
})();
