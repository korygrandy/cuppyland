(function () {
  const profiles = {
    friend: {
      width: 132,
      height: 132,
      overlayWidth: 132,
      overlayHeight: 132,
      offsetX: 0,
      offsetY: -43,
      scale: 0.82,
      snapDistance: 58,
    },
    barbie: {
      width: 150,
      height: 150,
      overlayWidth: 150,
      overlayHeight: 150,
      offsetX: 0,
      offsetY: -12,
      scale: 0.58,
      snapDistance: 58,
    },
    "barbie-baby": {
      width: 86,
      height: 140,
      overlayWidth: 86,
      overlayHeight: 140,
      offsetX: 0,
      offsetY: -12,
      scale: 0.58,
      snapDistance: 48,
    },
    "baby-mr-chocolate-milk": {
      width: 86,
      height: 86,
      overlayWidth: 86,
      overlayHeight: 86,
      offsetX: 0,
      offsetY: -8,
      scale: 0.78,
      snapDistance: 42,
    },
    parmesan: {
      width: 132,
      height: 276,
      overlayWidth: 132,
      overlayHeight: 276,
      offsetX: 0,
      offsetY: -43,
      scale: 0.72,
      snapDistance: 58,
    },
  };

  const petTypes = new Set([
    "golden-puppy",
    "doghouse",
    "fishbowl",
    "dogbone",
    "rope-dogtoy",
    "dogtoy-ball",
    "dogleash",
    "dog-collar",
    "dogbed",
    "dogbowl",
    "dogfood",
    "water-bowl",
    "water-bottle",
    "squirrel",
    "rabbit-bead-craft",
    "triceratops-bead-craft",
    "turkey",
  ]);

  function getCategory(friendState) {
    if (!friendState) {
      return null;
    }
    if (petTypes.has(friendState.type)) {
      return null;
    }
    if (friendState.type === "barbie-blonde-baby") {
      return "barbie-baby";
    }
    if (friendState.type === "barbie-blonde") {
      return "barbie";
    }
    if (friendState.type === "baby-mr-chocolate-milk") {
      return "baby-mr-chocolate-milk";
    }
    if (friendState.type === "parmesan-cheese") {
      return "parmesan";
    }
    return "friend";
  }

  function getProfile(friendState) {
    const category = getCategory(friendState);
    return category ? profiles[category] : null;
  }

  window.CuppyLandObjectOverlayRegistry = {
    getCategory,
    getProfile,
  };
})();
