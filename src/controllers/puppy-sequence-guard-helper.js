(function () {
  function canStartSequence(friendState) {
    return Boolean(friendState && !friendState.sequenceActive);
  }

  function canAttachCompanion(friendState) {
    return Boolean(friendState && !friendState.sequenceActive);
  }

  function canAttachLeash(friendState) {
    return Boolean(friendState && !friendState.sequenceActive && friendState.hasCollar);
  }

  function shouldRenderCompanionOverlay(friendState) {
    return Boolean(friendState && !friendState.sequenceActive);
  }

  window.CuppyLandPuppySequenceGuardHelper = {
    canStartSequence,
    canAttachCompanion,
    canAttachLeash,
    shouldRenderCompanionOverlay,
  };
})();
