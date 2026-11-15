(function () {
  const game = window.CuppyLandGame;
  const { palette, sleeveTypes, colorMap, expressionTypes, hairstyleTypes } = game;

  function createColorItem(type, colorName) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "inventory-item color-swatch";
    item.dataset.itemType = type;
    item.dataset.value = colorName;
    item.setAttribute("aria-label", `${type} ${colorName}`);

    const swatch = document.createElement("span");
    swatch.className = "color-swatch-visual";
    swatch.style.backgroundColor = colorMap[colorName];

    const label = document.createElement("span");
    label.className = "color-swatch-label";
    label.textContent = colorName;

    item.appendChild(swatch);
    item.appendChild(label);
    return item;
  }

  function createSleeveItem(sleeve) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "inventory-item sleeve";
    item.dataset.itemType = "sleeve";
    item.dataset.value = sleeve;
    item.setAttribute("aria-label", `sleeve ${sleeve}`);

    const thumb = document.createElement("span");
    thumb.className = "inventory-sleeve-thumb";
    thumb.style.backgroundImage = `url("${game.sleeveAssetMap[sleeve] || './assets/sleeve-child.png'}")`;

    const face = document.createElement("span");
    face.className = "inventory-sleeve-face";
    face.style.backgroundImage = `url("${game.faceAssetMap?.[sleeve]?.happy || './assets/happy-facial-expression.png'}")`;

    thumb.appendChild(face);
    item.appendChild(thumb);
    return item;
  }

  function createExpressionItem(expressionName) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "inventory-item expression";
    item.dataset.itemType = "expression";
    item.dataset.value = expressionName;
    item.setAttribute("aria-label", `expression ${expressionName}`);

    const thumb = document.createElement("span");
    thumb.className = "inventory-expression-thumb";
    thumb.style.backgroundImage = `url("${game.faceAssetMap?.[game.state.cup.sleeve]?.[expressionName] || './assets/happy-facial-expression.png'}")`;

    const label = document.createElement("span");
    label.className = "inventory-expression-label";
    label.textContent = expressionName;

    item.appendChild(thumb);
    item.appendChild(label);
    return item;
  }

  function createHairstyleItem(hairstyleName) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "inventory-item hairstyle";
    item.dataset.itemType = "hairstyle";
    item.dataset.value = hairstyleName;
    item.setAttribute("aria-label", `hairstyle ${hairstyleName}`);

    const thumb = document.createElement("span");
    thumb.className = "inventory-hairstyle-thumb";
    thumb.style.backgroundImage = `url("${game.hairstyleAssetMap?.[hairstyleName] || './assets/hairstyle-child.svg'}")`;

    item.appendChild(thumb);
    return item;
  }

  function buildInventoryItems() {
    const lidItems = document.getElementById("lidItems");
    const cupItems = document.getElementById("cupItems");
    const sleeveItems = document.getElementById("sleeveItems");
    const expressionItems = document.getElementById("expressionItems");
    const hairstyleItems = document.getElementById("hairstyleItems");

    lidItems.innerHTML = "";
    cupItems.innerHTML = "";
    sleeveItems.innerHTML = "";
    expressionItems.innerHTML = "";
    hairstyleItems.innerHTML = "";

    palette.forEach((colorName) => {
      lidItems.appendChild(createColorItem("lid", colorName));
      cupItems.appendChild(createColorItem("cup", colorName));
    });

    sleeveTypes.forEach((sleeve) => {
      sleeveItems.appendChild(createSleeveItem(sleeve));
    });

    expressionTypes.forEach((expressionName) => {
      expressionItems.appendChild(createExpressionItem(expressionName));
    });

    hairstyleTypes.forEach((hairstyleName) => {
      hairstyleItems.appendChild(createHairstyleItem(hairstyleName));
    });
  }

  window.CuppyLandInventory = {
    createColorItem,
    createSleeveItem,
    createExpressionItem,
    createHairstyleItem,
    buildInventoryItems,
  };
})();
