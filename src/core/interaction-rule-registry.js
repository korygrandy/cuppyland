(function () {
  const toySequenceTypes = {
    dogbone: "bone",
    "rope-dogtoy": "rope",
    "dogtoy-ball": "ball",
  };

  const barbieTypes = new Set([
    "barbie-blonde",
    "barbie-blonde-baby",
  ]);

  function getToySequenceType(friendType) {
    return toySequenceTypes[friendType] || null;
  }

  function isToyType(friendType) {
    return Boolean(getToySequenceType(friendType));
  }

  function isBarbieType(friendType) {
    return barbieTypes.has(friendType);
  }

  function isPuppyType(friendType) {
    return friendType === "golden-puppy";
  }

  window.CuppyLandInteractionRules = {
    getToySequenceType,
    isToyType,
    isBarbieType,
    isPuppyType,
  };
})();
