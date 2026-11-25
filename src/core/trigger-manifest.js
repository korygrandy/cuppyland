(function () {
  const triggers = [
    { id: "bed-bounce", world: "olivia-room", kind: "hitbox", anchorId: "bed-bg", allowedTypes: ["*"], assets: ["./assets/bed-bounce-down.png", "./assets/bed-bounce-up.png"] },
    { id: "trampoline-bounce", world: "playground", kind: "hitbox", anchorId: "trampoline", allowedTypes: ["*"], assets: ["./assets/trampoline-down.png", "./assets/trampoline-up.png"] },
    { id: "tube-slide", world: "playground", kind: "hitbox", anchorId: "tube-slide", allowedTypes: ["*"], assets: [] },
    { id: "drinking-fountain", world: "playground", kind: "hitbox", anchorId: "drinking-fountain", allowedTypes: ["*"], assets: ["./assets/drinking-fountain-activated.png"], sfx: "drinkingFountainActivated" },
    { id: "merry-go-round", world: "playground", kind: "hitbox", anchorId: "merry-go-round", allowedTypes: ["*"], assets: ["./assets/merry-go-round-animated.gif"] },
    { id: "puppy-dogbed", world: "*", kind: "overlap", sourceType: "golden-puppy", targetType: "dogbed" },
    { id: "puppy-doghouse", world: "*", kind: "overlap", sourceType: "golden-puppy", targetType: "doghouse" },
    { id: "puppy-dogfood", world: "*", kind: "overlap", sourceType: "golden-puppy", targetType: "dogfood" },
    { id: "puppy-dogbowl", world: "*", kind: "overlap", sourceType: "golden-puppy", targetType: "dogbowl" },
    { id: "puppy-dogtoy-ball", world: "*", kind: "overlap", sourceType: "golden-puppy", targetType: "dogtoy-ball" },
    { id: "puppy-dogbone", world: "*", kind: "overlap", sourceType: "golden-puppy", targetType: "dogbone" },
    { id: "puppy-rope-dogtoy", world: "*", kind: "overlap", sourceType: "golden-puppy", targetType: "rope-dogtoy" },
    { id: "puppy-squirrel", world: "*", kind: "overlap", sourceType: "golden-puppy", targetType: "squirrel" },
    { id: "fishbowl-water-bowl", world: "*", kind: "overlap", sourceType: "fishbowl", targetType: "water-bowl" },
    { id: "water-bottle-water-bowl", world: "*", kind: "overlap", sourceType: "water-bottle", targetType: "water-bowl" },
    { id: "cup-hairstyle-lid", world: "*", kind: "cup-drop", sourceType: "hairstyle", targetType: "lid" },
    { id: "pumpkin-man-double-tap", world: "*", kind: "double-tap", sourceType: "punpkin-man", assets: ["./assets/punpkin-man.png"], sfx: "pumpkinManActivated" },
    { id: "pumpkin-woman-double-tap", world: "*", kind: "double-tap", sourceType: "pumpkin-woman", assets: ["./assets/pumpkin-woman.png"] },
    { id: "parmesan-cheese-double-tap", world: "*", kind: "double-tap", sourceType: "parmesan-cheese", assets: ["./assets/parmesan-cheese.png"], sfx: "parmesanCheeseActivated" },
    { id: "fishbowl-double-tap", world: "*", kind: "double-tap", sourceType: "fishbowl", sfx: "fishbowlActivated" },
    { id: "turkey-double-tap", world: "*", kind: "double-tap", sourceType: "turkey", sfx: "turkeyGobble" },
    { id: "uke-double-tap", world: "*", kind: "double-tap", sourceType: "uke", sfx: "ukuleleActivated" },
  ];

  function validate(options = {}) {
    const {
      worldAnchors = {},
      friendTypes = [],
      assetMap = {},
      sfxMap = {},
      frameAssets = {},
    } = options;
    const errors = [];
    const ids = new Set();
    const knownFriendTypes = new Set(friendTypes);

    triggers.forEach((trigger) => {
      if (!trigger.id) {
        errors.push("Trigger is missing an id");
        return;
      }
      if (ids.has(trigger.id)) {
        errors.push(`Duplicate trigger id: ${trigger.id}`);
      }
      ids.add(trigger.id);

      if (trigger.kind === "hitbox") {
        const worlds = trigger.world === "*" ? Object.keys(worldAnchors) : [trigger.world];
        let foundAnchor = false;
        worlds.forEach((worldId) => {
          const anchor = (worldAnchors[worldId] || []).find((candidate) => candidate.id === trigger.anchorId);
          if (!anchor) {
            return;
          }
          foundAnchor = true;
          const anchorAssets = anchor.activatedAssets
            ? Object.values(anchor.activatedAssets)
            : [anchor.activatedAsset].filter(Boolean);
          trigger.assets?.forEach((assetPath) => {
            if (!anchorAssets.includes(assetPath) && !Object.values(assetMap).includes(assetPath)) {
              errors.push(`Trigger ${trigger.id} references missing hitbox asset ${assetPath}`);
            }
          });
          const hitboxWidth = anchor.hitboxWidth ?? anchor.width;
          const hitboxHeight = anchor.hitboxHeight ?? anchor.height;
          if (!Number.isFinite(hitboxWidth) || hitboxWidth <= 0
            || !Number.isFinite(hitboxHeight) || hitboxHeight <= 0) {
            errors.push(`Trigger ${trigger.id} has an invalid hitbox size`);
          }
          if (!Number.isFinite(anchor.hitboxOffsetX ?? 0) || !Number.isFinite(anchor.hitboxOffsetY ?? 0)) {
            errors.push(`Trigger ${trigger.id} has invalid hitbox offsets`);
          }
        });
        if (!foundAnchor) {
          errors.push(`Trigger ${trigger.id} is missing anchor ${trigger.anchorId} in ${trigger.world}`);
        }
      }

      if (trigger.assets && trigger.kind !== "hitbox") {
        trigger.assets.forEach((assetPath) => {
          const registered = Object.values(assetMap).includes(assetPath)
            || Object.values(frameAssets).includes(assetPath);
          if (!registered) {
            errors.push(`Trigger ${trigger.id} references unregistered asset ${assetPath}`);
          }
        });
      }

      if (trigger.sfx) {
        if (!sfxMap[trigger.sfx]) {
          errors.push(`Trigger ${trigger.id} references missing SFX key ${trigger.sfx}`);
        }
      }

      [trigger.sourceType, trigger.targetType].forEach((objectType) => {
        if (objectType && knownFriendTypes.size > 0 && objectType !== "*" && !knownFriendTypes.has(objectType)
          && objectType !== "lid" && objectType !== "hairstyle") {
          errors.push(`Trigger ${trigger.id} references unknown object type ${objectType}`);
        }
      });
    });

    return { valid: errors.length === 0, errors, triggers: triggers.slice() };
  }

  window.CuppyLandTriggerManifest = {
    triggers,
    validate,
  };
})();
