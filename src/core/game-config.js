(function () {
  const defaultCupState = {
    lidColor: "yellow",
    cupColor: "red",
    sleeve: "child",
    expression: "happy",
    hairstyle: "child",
    worldX: 920,
    worldY: 430,
    zIndex: 1,
    lidDetached: false,
    lidVisible: true,
    lidOffsetX: 17,
    lidOffsetY: 0,
    sleeveDetached: false,
    sleeveVisible: true,
    sleeveOffsetX: 32,
    sleeveOffsetY: 160,
    faceOffsetX: 10,
    faceOffsetY: 18,
    faceVisible: true,
    hairstyleDetached: false,
    hairstyleOffsetX: 17,
    hairstyleOffsetY: -22,
    hairstyleVisible: true,
  };

  const gameConfig = {
    defaultCupState: JSON.parse(JSON.stringify(defaultCupState)),
    state: {
      currentScreen: "splash",
      activeWorld: null,
      activeCupId: null,
      inventoryOpen: false,
      worlds: {
        playground: {
          cups: [{ id: "cup-playground-1", state: JSON.parse(JSON.stringify(defaultCupState)) }],
          friends: [],
        },
        "olivia-room": {
          cups: [{ id: "cup-bedroom-1", state: JSON.parse(JSON.stringify(defaultCupState)) }],
          friends: [],
        },
      },
      cup: JSON.parse(JSON.stringify(defaultCupState)),
    },
    fixedViewport: {
      width: 1280,
      height: 800,
    },
    palette: ["red", "blue", "yellow", "green", "purple", "orange"],
    sleeveTypes: ["child", "parent", "grandparent"],
    sleeveFaceMap: {
      child: "😊",
      parent: "😎",
      grandparent: "🤗",
    },
    sleeveAssetMap: {
      child: "./assets/sleeve-child.png",
      parent: "./assets/sleeve-parent.png",
      grandparent: "./assets/sleeve-grandparent.png",
    },
    expressionTypes: ["happy", "excited", "surprised", "scared"],
    hairstyleTypes: ["child", "grandpa", "hat"],
    friendTypes: ["heart-women", "heart-man", "tricerotops-bead-craft", "rocketman-craft", "furball-guy", "hairy-guy"],
    faceAssetMap: {
      child: {
        happy: "./assets/facial-expression-child.png",
        excited: "./assets/facial-expression-child.png",
        surprised: "./assets/facial-expression-child.png",
        scared: "./assets/facial-expression-child.png",
      },
      parent: {
        happy: "./assets/happy-facial-expression.png",
        excited: "./assets/happy-facial-expression.png",
        surprised: "./assets/happy-facial-expression.png",
        scared: "./assets/facial-expression-scared.png",
      },
      grandparent: {
        happy: "./assets/facial-expression-grandparent.png",
        excited: "./assets/facial-expression-grandparent.png",
        surprised: "./assets/facial-expression-grandparent.png",
        scared: "./assets/facial-expression-grandparent.png",
      },
    },
    sleevePalette: {
      child: {
        label: "child",
        backgroundColor: "#ffd94d",
        borderColor: "rgba(96, 44, 62, 0.45)",
      },
      parent: {
        label: "parent",
        backgroundColor: "#f5d14a",
        borderColor: "rgba(115, 56, 93, 0.55)",
      },
      grandparent: {
        label: "grandparent",
        backgroundColor: "#f4ca21",
        borderColor: "rgba(111, 87, 147, 0.55)",
      },
    },
    hairstyleAssetMap: {
      child: "./assets/hairstyle-child.svg",
      grandpa: "./assets/hairstyle-grandpa.png",
      hat: "./assets/hairstyle-hat.svg",
    },
    friendAssetMap: {
      "heart-women": "./assets/heart-woman.png",
      "heart-man": "./assets/heart-man.png",
      "tricerotops-bead-craft": "./assets/tricerotops-bead-craft.png",
      "rocketman-craft": "./assets/rocketman-craft.png",
      "furball-guy": "./assets/furball-guy-drawing.png",
      "hairy-guy": "./assets/hairy-guy-drawing.png",
    },
    colorMap: {
      red: "#ff3c3c",
      blue: "#3e80ff",
      yellow: "#f3cf33",
      green: "#37c86e",
      purple: "#9c5bff",
      orange: "#ff9a3c",
    },
    worldClasses: {
      playground: "playground",
      "olivia-room": "olivia-room",
    },
    tintAssetConfig: {
      lid: "./assets/lid-grayscale.png",
      cup: "./assets/cup-grayscale.png",
    },
    gameplayConfig: {
      dragOutsidePadding: 12,
      dragMovementThreshold: 8,
      snapDistance: {
        lidToCup: 110,
        sleeveToCup: 120,
        hairstyleToLid: 90,
      },
      dragClamp: {
        lid: { minLeft: -60, maxLeft: 200, minTop: -80, maxTop: 120 },
        sleeve: { minLeft: -60, maxLeft: 200, minTop: -20, maxTop: 220 },
        hairstyle: { minLeft: -80, maxLeft: 220, minTop: -120, maxTop: 160 },
      },
      anchors: {
        hairstyleFromLidOffsetX: 10,
      },
    },
    defaultSleeveAsset: "./assets/sleeve-child.png",
    audioConfig: {
      menu: "./sfx/Kailua_Breeze.mp3",
      worlds: {
        playground: "./sfx/playground.mp3",
        "olivia-room": "./sfx/olivias-room.mp3",
      },
      sfxClips: {
        welcomeToCuppyland: "./sfx/welcome-to-cuppyland.mp3",
        myNameIsOlivia: "./sfx/my-name-is-olivia.mp3",
        hi: "./sfx/hi.mp3",
      },
      transitions: {
        fadeOutMs: 220,
        fadeInMs: 260,
      },
    },
  };

  window.CuppyLandGame = gameConfig;
})();
