(function () {
  function isChocolateMilkType(friendType) {
    return friendType === "chocolate-milk" || friendType === "baby-mr-chocolate-milk";
  }

  function isBabyChocolateMilkType(friendType) {
    return friendType === "baby-mr-chocolate-milk";
  }

  function normalizeChocolateMilkType(friendType) {
    return isBabyChocolateMilkType(friendType)
      ? "baby-mr-chocolate-milk"
      : "chocolate-milk";
  }

  window.CuppyLandChocolateMilkTypes = {
    isChocolateMilkType,
    isBabyChocolateMilkType,
    normalizeChocolateMilkType,
  };
})();
