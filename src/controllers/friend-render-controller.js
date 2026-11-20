(function () {
  function createController(options) {
    const {
      worldCanvas,
      getWorldFriendList,
      state,
      resolveFriendAsset,
      onFriendPointerDown,
      onFriendPointerMove,
      onFriendPointerUp,
    } = options;

    function clear() {
      worldCanvas.querySelectorAll(".friend-character").forEach((node) => node.remove());
    }

    function create(friendState) {
      const friendElement = document.createElement("div");
      friendElement.className = "friend-character";
      friendElement.dataset.friendId = friendState.id;
      friendElement.dataset.friendType = friendState.type;
      friendElement.style.left = `${friendState.worldX || 0}px`;
      friendElement.style.top = `${friendState.worldY || 0}px`;
      friendElement.style.zIndex = String(Number.isFinite(friendState.zIndex) ? friendState.zIndex : 90);

      const art = document.createElement("span");
      art.className = "friend-character-art";
      art.style.backgroundImage = `url("${resolveFriendAsset(friendState)}")`;
      friendElement.appendChild(art);
      friendElement.addEventListener("pointerdown", onFriendPointerDown);
      friendElement.addEventListener("pointermove", onFriendPointerMove);
      friendElement.addEventListener("pointerup", onFriendPointerUp);
      friendElement.addEventListener("pointercancel", onFriendPointerUp);
      return friendElement;
    }

    function render() {
      clear();
      return getWorldFriendList(state.activeWorld)
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
        .map(create);
    }

    return {
      clear,
      create,
      render,
    };
  }

  window.CuppyLandFriendRenderController = {
    createController,
  };
})();
