(function () {
  const game = window.CuppyLandGame;
  const { palette, sleeveTypes, colorMap } = game;

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
    item.textContent = sleeve;
    return item;
  }

  function buildInventoryItems() {
    const lidItems = document.getElementById("lidItems");
    const cupItems = document.getElementById("cupItems");
    const sleeveItems = document.getElementById("sleeveItems");

    lidItems.innerHTML = "";
    cupItems.innerHTML = "";
    sleeveItems.innerHTML = "";

    palette.forEach((colorName) => {
      lidItems.appendChild(createColorItem("lid", colorName));
      cupItems.appendChild(createColorItem("cup", colorName));
    });

    sleeveTypes.forEach((sleeve) => {
      sleeveItems.appendChild(createSleeveItem(sleeve));
    });
  }

  window.CuppyLandInventory = { createColorItem, createSleeveItem, buildInventoryItems };
})();
