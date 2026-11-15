(function () {
  const gameConfig = {
    state: {
      currentScreen: "splash",
      activeWorld: null,
      inventoryOpen: false,
      cup: {
        lidColor: "yellow",
        cupColor: "red",
        sleeve: "child",
        lidDetached: false,
        lidOffsetX: 17,
        lidOffsetY: 0,
        sleeveDetached: false,
        sleeveOffsetX: 30,
        sleeveOffsetY: 164,
      },
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
      child: "./assets/sleeve-default.png",
      parent: "./assets/sleeve-default.png",
      grandparent: "./assets/sleeve-default.png",
    },
    sleevePalette: {
      child: {
        label: "child",
        backgroundColor: "#f9d7bd",
        borderColor: "rgba(96, 44, 62, 0.45)",
      },
      parent: {
        label: "parent",
        backgroundColor: "#ffd7e5",
        borderColor: "rgba(115, 56, 93, 0.55)",
      },
      grandparent: {
        label: "grandparent",
        backgroundColor: "#e9ddff",
        borderColor: "rgba(111, 87, 147, 0.55)",
      },
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
    defaultSleeveAsset: "./assets/sleeve-default.png",
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
