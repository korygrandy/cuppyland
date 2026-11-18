(function () {
  function createController(options) {
    const {
      worldCanvas,
      getCupStateById,
      playSfxClip = () => {},
    } = options;

    function createSparkleRay(index, angle) {
      const node = document.createElement("span");
      node.className = "cup-sparkle-ray";
      node.style.setProperty("--ray-angle", `${angle}deg`);
      node.style.setProperty("--ray-delay", `${index * 45}ms`);
      return node;
    }

    function createSparkleOrb(index) {
      const particle = document.createElement("span");
      particle.className = "cup-sparkle-orb";
      const startX = Math.round((Math.random() * 76) - 38);
      const startY = Math.round((Math.random() * 76) - 38);
      const driftX = startX + Math.round((Math.random() * 44) - 22);
      const driftY = startY + Math.round((Math.random() * 44) - 22);
      const size = 4 + Math.round(Math.random() * 4);
      const delayMs = 30 + (index * 35) + Math.round(Math.random() * 45);
      const durationMs = 560 + Math.round(Math.random() * 220);

      particle.style.setProperty("--orb-start-x", `${startX}px`);
      particle.style.setProperty("--orb-start-y", `${startY}px`);
      particle.style.setProperty("--orb-drift-x", `${driftX}px`);
      particle.style.setProperty("--orb-drift-y", `${driftY}px`);
      particle.style.setProperty("--orb-size", `${size}px`);
      particle.style.setProperty("--orb-delay", `${delayMs}ms`);
      particle.style.setProperty("--orb-duration", `${durationMs}ms`);
      return particle;
    }

    function triggerCupSparkle(cupId) {
      const cupState = getCupStateById(cupId);
      if (!cupState) {
        return;
      }

      playSfxClip("shimmer");

      const sparkle = document.createElement("div");
      sparkle.className = "cup-sparkle-burst";
      sparkle.style.left = `${cupState.worldX + 120}px`;
      sparkle.style.top = `${cupState.worldY + 108}px`;

      [45, 135, 225, 315].forEach((angle, index) => {
        sparkle.appendChild(createSparkleRay(index, angle));
      });

      const particleCount = 5 + Math.floor(Math.random() * 2);
      for (let index = 0; index < particleCount; index += 1) {
        sparkle.appendChild(createSparkleOrb(index));
      }

      worldCanvas.appendChild(sparkle);
      window.setTimeout(() => sparkle.remove(), 1300);
    }

    function triggerFriendSparkle(friendState, friendElement) {
      if (!friendState || !friendElement) {
        return;
      }

      const flowerArt = friendElement.querySelector(".friend-character-art");
      if (friendState.type === "flower-bead-craft" && flowerArt) {
        const flippedScale = friendState.flipped ? -1 : 1;
        flowerArt.style.transformOrigin = "center bottom";
        flowerArt.style.transform = `scaleX(${flippedScale}) scaleY(1)`;
        playSfxClip("shimmer");
        triggerFlowerTwinkle(friendState, friendElement);
        return;
      }

      triggerFlowerTwinkle(friendState, friendElement);
    }

    function triggerFlowerTwinkle(friendState, friendElement) {
      const elementCenterX = friendState.worldX + (friendElement.offsetWidth / 2);
      const elementCenterY = friendState.worldY + (friendElement.offsetHeight / 2);

      const sparkle = document.createElement("div");
      sparkle.className = "cup-sparkle-burst flower-sparkle-burst";
      sparkle.style.left = `${elementCenterX}px`;
      sparkle.style.top = `${elementCenterY}px`;

      const particleCount = 14 + Math.floor(Math.random() * 7);
      for (let index = 0; index < particleCount; index += 1) {
        const glint = document.createElement("span");
        glint.className = index % 3 === 0 ? "flower-twinkle flower-twinkle-star" : "flower-twinkle";

        const angle = (Math.PI * 2 * index) / particleCount + (Math.random() * 0.35);
        const distance = 24 + Math.floor(Math.random() * 46);
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        glint.style.setProperty("--twinkle-x", `${x}px`);
        glint.style.setProperty("--twinkle-y", `${y}px`);
        glint.style.setProperty("--twinkle-mid-x", `${x * 0.25}px`);
        glint.style.setProperty("--twinkle-mid-y", `${y * 0.25}px`);
        glint.style.setProperty("--twinkle-far-x", `${x * 1.12}px`);
        glint.style.setProperty("--twinkle-far-y", `${y * 1.12}px`);
        glint.style.setProperty("--twinkle-delay", `${Math.floor(Math.random() * 520)}ms`);
        glint.style.setProperty("--twinkle-duration", `${850 + Math.floor(Math.random() * 700)}ms`);
        glint.style.setProperty("--twinkle-scale", `${0.7 + (Math.random() * 0.8)}`);
        sparkle.appendChild(glint);
      }

      worldCanvas.appendChild(sparkle);
      window.setTimeout(() => sparkle.remove(), 2000);
    }

    return {
      triggerCupSparkle,
      triggerFriendSparkle,
    };
  }

  window.CuppyLandSparkleEffectController = {
    createController,
  };
})();
