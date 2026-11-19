(function () {
  const barbieActivationAnchors = {
    durationMs: 2000,
    playground: [
      { id: "swing-left", label: "Swing Left", x: 3475, y: 345, width: 220, height: 185 },
      { id: "swing-right", label: "Swing Right", x: 5661, y: 325, width: 220, height: 185 },
      { id: "trampoline", label: "Trampoline", x: 325, y: 295, width: 220, height: 185 },
      { id: "merry-go-round-right", label: "Merry-Go-Round Right", x: 5249, y: 565, width: 220, height: 185 },
    ],
    "olivia-room": [
      { id: "window-sill", label: "Window Sill", x: 1030, y: 60, width: 170, height: 300 },
      { id: "bed", label: "Bed", x: 1240, y: 290, width: 160, height: 120 },
    ],
  };

  const backgroundObjectAnchors = {
    playground: [
      {
        id: "drinking-fountain",
        label: "Drinking Fountain",
        x: 3224,
        y: 418,
        width: 97,
        height: 101,
        activatedAsset: "./assets/drinking-fountain-activated.png",
        activatedSfx: "drinkingFountainActivated",
        activatorTypes: [
          "heart-women",
          "heart-man",
          "triceratops-bead-craft",
          "rocketman-craft",
          "furball-guy",
          "hairy-guy",
          "turkey",
          "spongebob-stuffy",
          "pizza-man-craft",
          "barbie-blonde",
          "barbie-blonde-baby",
        ],
      },
      {
        id: "merry-go-round",
        label: "Merry-Go-Round",
        x: 3056,
        y: 539,
        width: 273,
        height: 169,
        activatedAsset: "./assets/merry-go-round-animated.gif",
        activatorTypes: [
          "heart-women",
          "heart-man",
          "triceratops-bead-craft",
          "rocketman-craft",
          "furball-guy",
          "hairy-guy",
          "turkey",
          "spongebob-stuffy",
          "pizza-man-craft",
          "barbie-blonde",
          "barbie-blonde-baby",
        ],
      },
    ],
    "olivia-room": [],
  };

  window.CuppyLandWorldAnchors = {
    barbieActivationAnchors,
    backgroundObjectAnchors,
  };
})();
