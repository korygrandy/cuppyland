(function () {
  function getCanvasContext(canvasElement, layerName) {
    const context = canvasElement.getContext("2d");
    if (!context) {
      throw new Error(`Unable to render ${layerName}: 2D canvas context unavailable`);
    }
    return context;
  }

  function drawTintedImage(canvas, src, colorHex) {
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const image = new Image();
    image.onload = () => {
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
    };
    image.src = src;
  }

  function createController(options) {
    const {
      state,
      gameConfig,
      lidLayer,
      cupLayer,
      sleeveLayer,
      hairstyleLayer,
      faceLayer,
      colorMap,
      sleeveAssetMap,
      defaultSleeveAsset,
      syncCupWorldPosition,
      syncLidPosition,
      syncSleevePosition,
      syncFacePosition,
      resolveCupStateForElement,
    } = options;

    const tintedLayers = {
      lid: {
        canvas: lidLayer,
        context: getCanvasContext(lidLayer, "lid"),
        image: null,
        imageLoaded: false,
        src: gameConfig.tintAssetConfig.lid,
      },
      cup: {
        canvas: cupLayer,
        context: getCanvasContext(cupLayer, "cup"),
        image: null,
        imageLoaded: false,
        src: gameConfig.tintAssetConfig.cup,
      },
    };

    function drawSolidColorLayer(layer, colorHex) {
      const { context, canvas } = layer;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = colorHex;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawTintedLayer(layer, colorHex) {
      if (!layer.imageLoaded || !layer.image) {
        drawSolidColorLayer(layer, colorHex);
        return;
      }

      const { context, canvas, image } = layer;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = colorHex;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = "multiply";
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = "destination-in";
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = "source-over";
    }

    function renderTintedPart(part, colorName) {
      const layer = tintedLayers[part];
      const colorHex = colorMap[colorName];
      drawTintedLayer(layer, colorHex);
    }

    function renderTintedPartForCanvas(part, colorName, targetCanvas) {
      const colorHex = colorMap[colorName];
      const asset = part === "lid" ? gameConfig.tintAssetConfig.lid : gameConfig.tintAssetConfig.cup;
      if (!targetCanvas) {
        return;
      }
      drawTintedImage(targetCanvas, asset, colorHex);
    }

    function renderCupInstance(cupState, cupElement) {
      const lidLayerElement = cupElement.querySelector(".cup-lid") || lidLayer;
      const cupLayerElement = cupElement.querySelector(".cup-base") || cupLayer;
      const sleeveLayerElement = cupElement.querySelector(".cup-sleeve") || sleeveLayer;
      const hairstyleLayerElement = cupElement.querySelector(".cup-hairstyle") || hairstyleLayer;
      const faceLayerElement = cupElement.querySelector(".cup-face") || faceLayer;

      const lidVisible = cupState.lidVisible !== false;
      const sleeveVisible = cupState.sleeveVisible !== false;
      const hairstyleVisible = cupState.hairstyleVisible !== false;
      const faceVisible = cupState.faceVisible !== false;

      lidLayerElement.style.display = lidVisible ? "block" : "none";
      sleeveLayerElement.style.display = sleeveVisible ? "block" : "none";
      hairstyleLayerElement.style.display = hairstyleVisible ? "block" : "none";
      faceLayerElement.style.display = faceVisible ? "block" : "none";

      renderTintedPartForCanvas("lid", cupState.lidColor, lidLayerElement);
      renderTintedPartForCanvas("cup", cupState.cupColor, cupLayerElement);

      const activeSleeveAsset = sleeveAssetMap[cupState.sleeve] || defaultSleeveAsset;
      const activeFaceAsset =
        gameConfig.faceAssetMap?.[cupState.sleeve]?.[cupState.expression || "happy"] || "./assets/mr-chocolate-milk-happy.jpg";
      const activeHairstyleAsset = gameConfig.hairstyleAssetMap?.[cupState.hairstyle || "child"] || "./assets/hairstyle-grandpa.png";

      if (sleeveVisible) {
        drawTintedImage(sleeveLayerElement, activeSleeveAsset, "#d1b9ff");
        sleeveLayerElement.style.width = "200px";
        sleeveLayerElement.style.height = "110px";
      }

      if (hairstyleVisible && hairstyleLayerElement) {
        hairstyleLayerElement.style.backgroundColor = "transparent";
        hairstyleLayerElement.style.backgroundImage = `url("${activeHairstyleAsset}")`;
        hairstyleLayerElement.style.backgroundSize = "contain";
        hairstyleLayerElement.style.backgroundPosition = "center";
        hairstyleLayerElement.style.backgroundRepeat = "no-repeat";
        hairstyleLayerElement.textContent = "";
      }

      if (faceVisible && faceLayerElement) {
        faceLayerElement.style.backgroundColor = "transparent";
        faceLayerElement.style.backgroundImage = `url("${activeFaceAsset}")`;
        faceLayerElement.style.backgroundSize = "contain";
        faceLayerElement.style.backgroundPosition = "center";
        faceLayerElement.style.backgroundRepeat = "no-repeat";
        faceLayerElement.textContent = "";
      }

      syncCupWorldPosition(cupElement);
      syncLidPosition(cupElement);
      syncSleevePosition(cupElement);
      syncFacePosition(cupElement);
    }

    function renderCup() {
      renderCupInstance(state.cup, options.cupCharacter);
    }

    function loadImage(src) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load ${src}`));
        image.src = src;
      });
    }

    async function loadTintAssets() {
      const entries = Object.entries(tintedLayers);
      await Promise.all(
        entries.map(async ([partName, layer]) => {
          try {
            layer.image = await loadImage(layer.src);
            layer.imageLoaded = true;
            layer.canvas.classList.add("has-grayscale-asset");
          } catch (error) {
            layer.image = null;
            layer.imageLoaded = false;
            layer.canvas.classList.remove("has-grayscale-asset");
            console.warn(`Using fallback fill for ${partName}. Missing grayscale asset at ${layer.src}.`, error);
          }
        })
      );

      renderCup();
    }

    return {
      renderCupInstance,
      renderCup,
      renderTintedPart,
      renderTintedPartForCanvas,
      loadTintAssets,
      getCupStateForElement: resolveCupStateForElement,
    };
  }

  window.CuppyLandRenderController = {
    createController,
  };
})();
