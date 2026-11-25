(function () {
  const game = window.CuppyLandGame;
  const { palette, colorMap, expressionTypes, hairstyleTypes, friendTypes } = game;
  const thumbnailImageCache = new Map();
  let activeColorTarget = "lid";

  function loadThumbnailImage(src) {
    if (!src) {
      return Promise.reject(new Error("Missing thumbnail source"));
    }

    if (thumbnailImageCache.has(src)) {
      return thumbnailImageCache.get(src);
    }

    const imagePromise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load ${src}`));
      image.src = src;
    });

    thumbnailImageCache.set(src, imagePromise);
    return imagePromise;
  }

  function paintTintedThumbnail(canvas, image, colorHex) {
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = colorHex;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.save();
    context.globalCompositeOperation = "multiply";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    context.restore();

    context.save();
    context.globalCompositeOperation = "destination-in";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    context.restore();
  }

  function createTintedPartThumbnail(partType, colorName) {
    const canvas = document.createElement("canvas");
    canvas.className = `inventory-part-thumb inventory-part-thumb-${partType}`;
    canvas.width = partType === "lid" ? 58 : 56;
    canvas.height = partType === "lid" ? 38 : 58;

    const colorHex = colorMap[colorName];
    const source = partType === "lid" ? game.tintAssetConfig.lid : game.tintAssetConfig.cup;
    loadThumbnailImage(source)
      .then((image) => {
        paintTintedThumbnail(canvas, image, colorHex);
      })
      .catch(() => {
        const context = canvas.getContext("2d");
        if (!context) {
          return;
        }
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = colorHex;
        context.fillRect(0, 0, canvas.width, canvas.height);
      });

    return canvas;
  }

  function createColorItem(colorName) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "inventory-item color-swatch";
    item.dataset.itemType = activeColorTarget;
    item.dataset.value = colorName;
    item.setAttribute("aria-label", `${activeColorTarget} ${colorName}`);

    const swatch = createTintedPartThumbnail(activeColorTarget, colorName);

    const label = document.createElement("span");
    label.className = "color-swatch-label";
    label.textContent = colorName;

    item.appendChild(swatch);
    item.appendChild(label);
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
    thumb.style.backgroundImage = `url("${game.expressionAssetMap?.[expressionName] || game.expressionAssetMap?.happy || './assets/facial-expression-happy.png'}")`;

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

  function createAddCupItem() {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "inventory-item add-cup";
    item.dataset.itemType = "cup-create";
    item.dataset.value = "new-cup";
    item.setAttribute("aria-label", "Add a new cup");

    const cupThumb = document.createElement("span");
    cupThumb.className = "add-cup-thumb";

    const cupBaseThumb = createTintedPartThumbnail("cup", "red");
    cupBaseThumb.classList.add("add-cup-base-thumb");
    const addBadge = document.createElement("span");
    addBadge.className = "add-cup-count-badge";
    addBadge.textContent = "+1";
    cupThumb.appendChild(cupBaseThumb);
    cupThumb.appendChild(addBadge);
    item.appendChild(cupThumb);
    return item;
  }

  function createFriendItem(friendName) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "inventory-item friend";
    item.dataset.itemType = "friend";
    item.dataset.value = friendName;
    const friendLabel = friendName === "baby-mr-chocolate-milk"
      ? "Baby Mr Chocolate Milk"
      : friendName;
    item.setAttribute("aria-label", friendLabel);
    item.title = friendLabel;

    const thumb = document.createElement("span");
    thumb.className = "inventory-friend-thumb";
    if (friendName === "baby-mr-chocolate-milk") {
      thumb.classList.add("inventory-baby-mr-chocolate-milk-thumb");
      const babyLabel = document.createElement("span");
      babyLabel.className = "inventory-baby-mr-chocolate-milk-label";
      babyLabel.textContent = "Baby";
      item.appendChild(thumb);
      item.appendChild(babyLabel);
      return item;
    }
    thumb.style.backgroundImage = `url("${game.friendAssetMap?.[friendName] || ""}")`;
    item.appendChild(thumb);
    return item;
  }

  function buildInventoryItems() {
    const colorItems = document.getElementById("colorItems");
    const colorTargetToggle = document.getElementById("colorTargetToggle");
    const expressionItems = document.getElementById("expressionItems");
    const hairstyleItems = document.getElementById("hairstyleItems");
    const accessoriesItems = document.getElementById("accessoriesItems");
    const petsItems = document.getElementById("petsItems");
    const friendsItems = document.getElementById("friendsItems");

    const accessoryTypes = new Set(["lavalamp", "chocolate-milk", "baby-mr-chocolate-milk", "parmesan-cheese", "uke", "flower-bead-craft", "merry-go-round", "water-bottle"]);
    const petTypes = new Set(["golden-puppy", "doghouse", "dogbone", "rope-dogtoy", "dogtoy-ball", "dogleash", "dog-collar", "dogbed", "dogbowl", "dogfood", "water-bowl", "squirrel", "fishbowl", "rabbit-bead-craft", "turtle-bead-craft", "turkey"]);
    const petOrder = [
      "golden-puppy",
      "squirrel",
      "rabbit-bead-craft",
      "turtle-bead-craft",
      "turkey",
      "fishbowl",
      "doghouse",
      "dogbed",
      "dogbowl",
      "dogfood",
      "water-bowl",
      "dogtoy-ball",
      "rope-dogtoy",
      "dogbone",
      "dog-collar",
      "dogleash",
    ];

    colorItems.innerHTML = "";
    expressionItems.innerHTML = "";
    hairstyleItems.innerHTML = "";
    accessoriesItems.innerHTML = "";
    petsItems.innerHTML = "";
    friendsItems.innerHTML = "";

    colorTargetToggle.querySelectorAll(".color-target-btn").forEach((button) => {
      const target = button.dataset.target;
      button.classList.toggle("is-active", target === activeColorTarget);
      button.setAttribute("aria-pressed", String(target === activeColorTarget));
      button.onclick = () => {
        if (target === activeColorTarget) {
          return;
        }
        activeColorTarget = target === "cup" ? "cup" : "lid";
        buildInventoryItems();
      };
    });

    palette.forEach((colorName) => {
      colorItems.appendChild(createColorItem(colorName));
    });

    expressionTypes.forEach((expressionName) => {
      expressionItems.appendChild(createExpressionItem(expressionName));
    });

    hairstyleTypes.forEach((hairstyleName) => {
      hairstyleItems.appendChild(createHairstyleItem(hairstyleName));
    });

    const accessoryOrder = [
      "baby-mr-chocolate-milk",
      "parmesan-cheese",
      "chocolate-milk",
      "lavalamp",
      "uke",
      "flower-bead-craft",
      "merry-go-round",
      "water-bottle",
    ];
    accessoryOrder
      .filter((friendName) => accessoryTypes.has(friendName))
      .forEach((friendName) => {
        accessoriesItems.appendChild(createFriendItem(friendName));
      });

    petOrder
      .filter((friendName) => petTypes.has(friendName))
      .forEach((friendName) => {
        petsItems.appendChild(createFriendItem(friendName));
      });

    friendTypes
      .filter((friendName) => !accessoryTypes.has(friendName) && !petTypes.has(friendName))
      .forEach((friendName) => {
        friendsItems.appendChild(createFriendItem(friendName));
      });

    const addCupGroup = document.createElement("div");
    addCupGroup.className = "inventory-group";
    addCupGroup.innerHTML = "<h3>Cup Crew</h3><div class=\"items-row\"></div>";
    addCupGroup.querySelector(".items-row").appendChild(createAddCupItem());
    const inventoryPanel = document.getElementById("inventoryPanel");
    inventoryPanel.querySelector(".inventory-group.cup-crew")?.remove();
    addCupGroup.classList.add("cup-crew");
    const hairstyleGroup = document.getElementById("hairstyleItems")?.closest(".inventory-group");
    if (hairstyleGroup && hairstyleGroup.nextSibling) {
      inventoryPanel.insertBefore(addCupGroup, hairstyleGroup.nextSibling);
    } else {
      inventoryPanel.appendChild(addCupGroup);
    }
  }

  window.CuppyLandInventory = {
    createColorItem,
    createExpressionItem,
    createHairstyleItem,
    createFriendItem,
    createAddCupItem,
    buildInventoryItems,
  };
})();
