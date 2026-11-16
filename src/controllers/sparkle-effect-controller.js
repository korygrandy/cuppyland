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

    return {
      triggerCupSparkle,
    };
  }

  window.CuppyLandSparkleEffectController = {
    createController,
  };
})();
