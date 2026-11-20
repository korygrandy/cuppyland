(function () {
  function createController(options) {
    const { timerLifecycle } = options;

    function schedulePose(key, element, state, poses, onComplete) {
      timerLifecycle?.clearPrefix?.(`pose:${key}:`);
      let index = 0;
      const apply = () => {
        if (index >= poses.length) {
          onComplete?.();
          return;
        }
        const pose = poses[index];
        state.worldX = pose.x;
        state.worldY = pose.y;
        element.style.left = `${pose.x}px`;
        element.style.top = `${pose.y}px`;
        index += 1;
        timerLifecycle?.set(`pose:${key}:${index}`, apply, pose.durationMs || 260);
      };
      apply();
    }

    return {
      schedulePose,
    };
  }

  window.CuppyLandMotionSequenceHelper = {
    createController,
  };
})();
