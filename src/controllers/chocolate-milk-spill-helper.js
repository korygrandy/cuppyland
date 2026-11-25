(function () {
  function isCupOpen(cupState) {
    return Boolean(cupState && (cupState.lidVisible === false || cupState.lidDetached === true));
  }

  function canStartSpill(cupState, friendState) {
    if (!isCupOpen(cupState)) {
      return false;
    }
    if (!friendState) {
      return false;
    }
    const isChocolateMilkType = window.CuppyLandChocolateMilkTypes?.isChocolateMilkType;
    return typeof isChocolateMilkType === "function"
      ? isChocolateMilkType(friendState.type)
      : friendState.type === "chocolate-milk" || friendState.type === "baby-mr-chocolate-milk";
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
