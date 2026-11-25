(function () {
  const imageCache = new Map();

  function loadImage(src) {
    if (!src) {
      return Promise.resolve(null);
    }
    if (imageCache.has(src)) {
      return imageCache.get(src);
    }
    const promise = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
    imageCache.set(src, promise);
    return promise;
  }

  function paintTintedCanvas(canvas, assetSrc, colorName) {
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    loadImage(assetSrc).then((image) => {
      if (!image) {
        context.fillStyle = window.CuppyLandGame?.colorMap?.[colorName] || "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }
      const colorHex = window.CuppyLandGame?.colorMap?.[colorName] || "#ffffff";
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
    });
  }

  function appendComposite(friendElement) {
    if (!friendElement) {
      return;
    }
    const lid = document.createElement("canvas");
    lid.className = "baby-mr-chocolate-milk-cup-lid";
    lid.width = 232;
    lid.height = 149;
    const sleeve = document.createElement("canvas");
    sleeve.className = "baby-mr-chocolate-milk-cup-sleeve";
    sleeve.width = 200;
    sleeve.height = 110;
    const base = document.createElement("canvas");
    base.className = "baby-mr-chocolate-milk-cup-base";
    base.width = 220;
    base.height = 275;
    const face = document.createElement("span");
    face.className = "baby-mr-chocolate-milk-face";
    const hairstyle = document.createElement("span");
    hairstyle.className = "baby-mr-chocolate-milk-hairstyle";
    friendElement.appendChild(base);
    friendElement.appendChild(sleeve);
    friendElement.appendChild(lid);
    friendElement.appendChild(face);
    friendElement.appendChild(hairstyle);
  }

  function sync(friendState, friendElement) {
    if (!friendState || friendState.type !== "baby-mr-chocolate-milk" || !friendElement) {
      return;
    }
    const lid = friendElement.querySelector(".baby-mr-chocolate-milk-cup-lid");
    const base = friendElement.querySelector(".baby-mr-chocolate-milk-cup-base");
    const sleeve = friendElement.querySelector(".baby-mr-chocolate-milk-cup-sleeve");
    const hairstyle = friendElement.querySelector(".baby-mr-chocolate-milk-hairstyle");
    const face = friendElement.querySelector(".baby-mr-chocolate-milk-face");
    paintTintedCanvas(lid, window.CuppyLandGame?.tintAssetConfig?.lid, friendState.lidColor || "yellow");
    paintTintedCanvas(base, window.CuppyLandGame?.tintAssetConfig?.cup, friendState.cupColor || "red");
    if (sleeve) {
      const sleeveAsset = window.CuppyLandGame?.sleeveAssetMap?.[friendState.sleeve]
        || window.CuppyLandGame?.defaultSleeveAsset;
      paintTintedCanvas(sleeve, sleeveAsset, friendState.sleeve || "child");
    }
    if (lid) {
      lid.style.display = friendState.lidVisible === false ? "none" : "block";
      lid.style.left = `calc(50% + ${(friendState.lidDetached ? friendState.lidOffsetX * .65 : 11 * .65)}px)`;
      lid.style.top = `${friendState.lidDetached ? friendState.lidOffsetY * .65 : 0}px`;
    }
    if (sleeve) {
      sleeve.style.display = friendState.sleeveVisible === false ? "none" : "block";
      sleeve.style.left = `calc(50% + ${(friendState.sleeveDetached ? friendState.sleeveOffsetX * .65 : 20 * .65)}px)`;
      sleeve.style.top = `${friendState.sleeveDetached ? friendState.sleeveOffsetY * .65 : 104 * .65}px`;
    }
    if (hairstyle) {
      hairstyle.style.display = friendState.hairstyleVisible === false ? "none" : "block";
      hairstyle.style.left = `calc(50% + ${(friendState.hairstyleDetached ? friendState.hairstyleOffsetX * .65 : 17 * .65)}px)`;
      hairstyle.style.top = `${friendState.hairstyleDetached ? friendState.hairstyleOffsetY * .65 : -14 * .65}px`;
      const hairstyleAsset = window.CuppyLandGame?.hairstyleAssetMap?.[friendState.hairstyle || "child"]
        || "./assets/hairstyle-child.svg";
      hairstyle.style.backgroundImage = `url("${hairstyleAsset}")`;
    }
    if (face) {
      const faceAsset = window.CuppyLandGame?.expressionAssetMap?.[friendState.expression || "happy"];
      face.style.backgroundImage = `url("${faceAsset || "./assets/facial-expression-happy.png"}")`;
    }
  }

  window.CuppyLandBabyChocolateMilkComposite = {
    appendComposite,
    sync,
  };
})();
