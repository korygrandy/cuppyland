(function () {
  const defaultCupState = {
    lidColor: "yellow",
    cupColor: "red",
    sleeve: "child",
    expression: "happy",
    hairstyle: null,
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
    hairstyleVisible: false,
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
          cups: [{
            id: "cup-playground-1",
            state: (() => {
              const state = JSON.parse(JSON.stringify(defaultCupState));
              state.worldX = 3300;
              state.worldY = 420;
              return state;
            })(),
          }],
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
    expressionTypes: ["happy", "scared", "loved"],
    hairstyleTypes: ["child", "grandpa", "hat", "bow", "summer-hat", "tiara"],
    friendTypes: [
      "heart-women",
      "heart-man",
      "tricerotops-bead-craft",
      "rocketman-craft",
      "furball-guy",
      "hairy-guy",
      "turkey",
      "lavalamp",
      "spongebob-stuffy",
      "pizza-man-craft",
      "chocolate-milk",
      "barbie-blonde",
      "barbie-blonde-baby",
    ],
    expressionAssetMap: {
      happy: "./assets/facial-expression-happy.png",
      scared: "./assets/facial-expression-scared.png",
      loved: "./assets/facial-expression-loved.png",
    },
    faceAssetMap: {
      child: {
        happy: "./assets/facial-expression-happy.png",
        scared: "./assets/facial-expression-scared.png",
        loved: "./assets/facial-expression-loved.png",
      },
      parent: {
        happy: "./assets/facial-expression-happy.png",
        scared: "./assets/facial-expression-scared.png",
        loved: "./assets/facial-expression-loved.png",
      },
      grandparent: {
        happy: "./assets/facial-expression-happy.png",
        scared: "./assets/facial-expression-scared.png",
        loved: "./assets/facial-expression-loved.png",
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
      bow: "./assets/hairstyle-bow.png",
      "summer-hat": "./assets/hairstyle-summer-hat.png",
      tiara: "./assets/hairstyle-tiara.png",
    },
    friendAssetMap: {
      "heart-women": "./assets/heart-woman.png",
      "heart-man": "./assets/heart-man.png",
      "tricerotops-bead-craft": "./assets/tricerotops-bead-craft.png",
      "rocketman-craft": "./assets/rocketman-craft.png",
      "furball-guy": "./assets/furball-guy-drawing.png",
      "hairy-guy": "./assets/hairy-guy-drawing.png",
      "turkey": "./assets/turkey-clipart-sequence1.png",
      "turkey-sequence-2": "./assets/turkey-clipart-sequence2.png",
      "lavalamp": "./assets/lavalamp-sequence1.png",
      "lavalamp-sequence-1": "./assets/lavalamp-sequence1.png",
      "lavalamp-sequence-2": "./assets/lavalamp-sequence2.png",
      "lavalamp-sequence-3": "./assets/lavalamp-sequence3.png",
      "spongebob-stuffy": "./assets/spongebob-stuffy.png",
      "pizza-man-craft": "./assets/pizza-man-craft.png",
      "chocolate-milk": "./assets/chocolate-milk.png",
      "barbie-blonde": "./assets/barbie-blonde.png",
      "barbie-blonde-activated": "./assets/barbie-blonde-activated.png",
      "barbie-blonde-baby": "./assets/barbie-blonde-baby.png",
      "barbie-blonde-baby-activated": "./assets/barbie-blonde-baby-activated.png",
    },
    chocolateMilkSequence: {
      durationMs: 5000,
      frameIntervalMs: 320,
      frameAssets: {
        frame2: "./assets/chocolate-milk-sequence2.png",
        frame3: "./assets/chocolate-milk-sequence3.png",
      },
      preview: {
        width: 188,
        height: 188,
        offsetX: 132,
        offsetY: 18,
        rotationDeg: -8,
        opacity: 0.96,
      },
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
    worldHeadlineConfig: {
      durationMs: 3000,
      fadeOutMs: 700,
      assets: {
        playground: "./assets/playground-headline.png",
        "olivia-room": "./assets/olivia-room-headline.png",
      },
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
      menu: "./sfx/Kailua_Breeze.ogg",
      worlds: {
        playground: "./sfx/theme-playground.ogg",
        "olivia-room": "./sfx/theme-olivias-room.ogg",
      },
      sfxClips: {
        welcomeToCuppyland: "./sfx/welcome-to-cuppyland.mp3",
        myNameIsOlivia: "./sfx/my-name-is-olivia.mp3",
        hi: "./sfx/hi.mp3",
        rocketship: "./sfx/rocketship-snap.ogg",
        spongebob: "./sfx/spongebob-snap.ogg",
        hairyGuy: "./sfx/hairy-guy-drawing-snap.ogg",
        furballGuy: "./sfx/name-is-scary-varity.ogg",
        barbieBlonde: "./sfx/barbie-blonde.ogg",
        barbieBlondeBaby: "./sfx/barbie-blonde-baby.ogg",
        turkeyGobble: "./sfx/turkey-gobble-doubleclick.ogg",
        cupRemoved: "./sfx/goodbye.ogg",
        defaultObjectRemoved: "./sfx/default-object-removed.ogg",
        milkPour: "./sfx/milk-pour.ogg",
        shimmer: "./sfx/shimmer.ogg",
        lidSnapOn: "./sfx/lid-snap-on.ogg",
        lidSnapOff: "./sfx/lid-snap-off.ogg",
        sleeveSnapOn: "./sfx/sleeve-snap-on.ogg",
        sleeveSnapOff: "./sfx/sleeve-snap-off.ogg",
      },
      transitions: {
        fadeOutMs: 220,
        fadeInMs: 260,
      },
    },
  };

  window.CuppyLandGame = gameConfig;
})();
