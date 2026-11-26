function installGameplayEventCapture(targetWindow) {
  const runtimeWindow = targetWindow || (typeof window !== "undefined" ? window : null);
  if (!runtimeWindow) {
    return { installed: false, reason: "Window is not available" };
  }
  if (runtimeWindow.CuppyLandGameplayEventCapture?.installed) {
    return runtimeWindow.CuppyLandGameplayEventCapture;
  }

  const events = [];
  const pushEvent = (type, details = {}) => {
    events.push({
      type,
      timestamp: Date.now(),
      world: runtimeWindow.CuppyLandGame?.state?.activeWorld || null,
      ...details,
    });
  };

  const capture = {
    installed: true,
    events,
    start: (eventId, details = {}) => pushEvent("eventStart", { eventId, ...details }),
    step: (eventId, details = {}) => pushEvent("eventStep", { eventId, ...details }),
    complete: (eventId, details = {}) => pushEvent("eventComplete", { eventId, ...details }),
    cancel: (eventId, details = {}) => pushEvent("eventCancel", { eventId, ...details }),
    clear: () => {
      events.length = 0;
    },
    stop: () => {
      capture.installed = false;
    },
  };

  runtimeWindow.CuppyLandGameplayEventCapture = capture;
  return capture;
}

if (typeof module !== "undefined") {
  module.exports = {
    installGameplayEventCapture,
  };
}
