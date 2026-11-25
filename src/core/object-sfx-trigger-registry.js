(function () {
  const snapSfxByType = {
    "rocketman-craft": "rocketship",
    "spongebob-stuffy": "spongebob",
    "hairy-guy": "hairyGuy",
    "furball-guy": "furballGuy",
    "golden-puppy": "goldenPuppyActivated",
    "barbie-blonde": "barbieBlondeSnap",
    "barbie-blonde-baby": "barbieBlondeBabySnap",
  };

  const doubleTapSfxByType = {
    "golden-puppy": "puppyBarking",
    "barbie-blonde": "blondeBarbieActivated",
    "barbie-blonde-baby": "blondeBarbieBabyActivated",
    "punpkin-man": "pumpkinManActivated",
    "pumpkin-woman": null,
    turkey: "turkeyGobble",
    fishbowl: "fishbowlActivated",
    "parmesan-cheese": "parmesanCheeseActivated",
    "water-bowl": "drinkingFountainActivated",
    "rocketman-craft": "rocketmanActivated",
    uke: "ukuleleActivated",
  };

  function getSnapSfx(friendType) {
    return snapSfxByType[friendType] || null;
  }

  function getDoubleTapSfx(friendType) {
    return doubleTapSfxByType[friendType] || null;
  }

  function getHitboxSfx(friendType) {
    return snapSfxByType[friendType] || null;
  }

  function playSnapSfx(friendType, playSfxClip) {
    const clipName = getSnapSfx(friendType);
    if (clipName && typeof playSfxClip === "function") {
      playSfxClip(clipName);
      return clipName;
    }
    return null;
  }

  function playDoubleTapSfx(friendType, playSfxClip) {
    const clipName = getDoubleTapSfx(friendType);
    if (clipName && typeof playSfxClip === "function") {
      playSfxClip(clipName);
      return clipName;
    }
    return null;
  }

  function playHitboxSfx(friendType, playSfxClip) {
    const clipName = getHitboxSfx(friendType);
    if (clipName && typeof playSfxClip === "function") {
      playSfxClip(clipName);
      return clipName;
    }
    return null;
  }

  function validate(sfxMap = {}) {
    const errors = [];
    const allClipNames = new Set([
      ...Object.values(snapSfxByType),
      ...Object.values(doubleTapSfxByType).filter(Boolean),
    ]);
    allClipNames.forEach((clipName) => {
      if (!sfxMap[clipName]) {
        errors.push(`Missing SFX configuration for ${clipName}`);
      }
    });
    return { valid: errors.length === 0, errors };
  }

  window.CuppyLandObjectSfxTriggerRegistry = {
    snapSfxByType,
    doubleTapSfxByType,
    getSnapSfx,
    getDoubleTapSfx,
    getHitboxSfx,
    playSnapSfx,
    playDoubleTapSfx,
    playHitboxSfx,
    validate,
  };
})();
