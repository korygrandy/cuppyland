(function () {
  const defaultCupState = {
    lidColor: "yellow",
    cupColor: "red",
    sleeve: "child",
    expression: "happy",
    hairstyle: "child",
    worldX: 920,
    worldY: 430,
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
        },
        "olivia-room": {
          cups: [{ id: "cup-bedroom-1", state: JSON.parse(JSON.stringify(defaultCupState)) }],
        },
      },
      cup: JSON.parse(JSON.stringify(defaultCupState)),
    },
    fixedViewport: {
      width: 1280,
      height: 800,
    },
    palette: ["red", "blue", "yellow", "green"],
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
    expressionTypes: ["happy", "excited", "surprised"],
    hairstyleTypes: ["child", "grandpa", "hat"],
    faceAssetMap: {
      child: {
        happy: "./assets/happy-facial-expression.png",
        excited: "./assets/happy-facial-expression.png",
        surprised: "./assets/happy-facial-expression.png",
      },
      parent: {
        happy: "./assets/happy-facial-expression.png",
        excited: "./assets/happy-facial-expression.png",
        surprised: "./assets/happy-facial-expression.png",
      },
      grandparent: {
        happy: "./assets/happy-facial-expression.png",
        excited: "./assets/happy-facial-expression.png",
        surprised: "./assets/happy-facial-expression.png",
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
    colorMap: {
      red: "#ff3c3c",
      blue: "#3e80ff",
      yellow: "#f3cf33",
      green: "#37c86e",
    },
    worldClasses: {
      playground: "playground",
      "olivia-room": "olivia-room",
    },
    tintAssetConfig: {
      lid: "./assets/lid-grayscale.png",
      cup: "./assets/cup-grayscale.png",
    },
    defaultSleeveAsset: "./assets/sleeve-child.png",
    audioConfig: {
      menu: "./assets/Kailua_Breeze.mp3",
      worlds: {
        playground: ["./assets/playgound.mp3", "./assets/playground.mp3"],
        "olivia-room": "./assets/olivias-room.mp3",
      },
    },
  };

  window.CuppyLandGame = gameConfig;
})();
