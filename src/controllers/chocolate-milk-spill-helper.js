(function () {
  function isCupOpen(cupState) {
    return Boolean(cupState && (cupState.lidVisible === false || cupState.lidDetached === true));
  }

  function canStartSpill(cupState, friendState) {
    if (!isCupOpen(cupState)) {
      return false;
    }
    return Boolean(friendState && friendState.type === "chocolate-milk");
  }

  function getDoubleTapCupId(friendState, hoveredCupId) {
    if (hoveredCupId) {
      return hoveredCupId;
    }
    return friendState?.attachedCupId || null;
  }

  window.CuppyLandChocolateMilkSpillHelper = {
    isCupOpen,
    canStartSpill,
    getDoubleTapCupId,
  };
})();
