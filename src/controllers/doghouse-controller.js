(function () {
  function createController(options) {
    const {
      state,
      worldCanvas,
      getWorldFriendList,
      getWorldPointFromClient,
      onRenderWorldCups,
      updateFriendElementAsset,
    } = options;

    function sync(commitAttachment = false, draggedFriendState = null) {
      const worldFriends = getWorldFriendList(state.activeWorld);
      const friendElements = Array.from(worldCanvas.querySelectorAll(".friend-character"));
      const puppyElements = friendElements.filter((element) => element.dataset.friendType === "golden-puppy");

      friendElements
        .filter((element) => element.dataset.friendType === "doghouse")
        .forEach((doghouseElement) => {
          const doghouseState = worldFriends.find((friend) => friend.id === doghouseElement.dataset.friendId);
          if (!doghouseState) {
            return;
          }

          const doghouseRect = doghouseElement.getBoundingClientRect();
          const overlappingPuppyElement = puppyElements.find((puppyElement) => (
            window.CuppyLandFriendOverlap?.rectsOverlap(puppyElement.getBoundingClientRect(), doghouseRect)
          ));
          const puppyState = overlappingPuppyElement
            ? worldFriends.find((friend) => friend.id === overlappingPuppyElement.dataset.friendId)
            : null;
          const attachedPuppy = worldFriends.find((friend) => (
            friend.type === "golden-puppy" && friend.doghouseId === doghouseState.id
          ));
          const draggedPuppyMatches = Boolean(draggedFriendState && puppyState?.id === draggedFriendState.id);
          const occupied = Boolean(
            puppyState
            && (
              (!puppyState.activated && puppyState.puppyAttachmentPending)
              || (commitAttachment && draggedPuppyMatches)
            )
          );

          if (occupied && puppyState) {
            puppyState.doghouseId = doghouseState.id;
            puppyState.attached = true;
            puppyState.activated = false;
            puppyState.puppyAttachmentPending = false;
            doghouseState.attachedPuppyId = puppyState.id;
            doghouseState.activated = true;
            onRenderWorldCups();
            return;
          }

          doghouseState.activated = Boolean(attachedPuppy);
          if (!doghouseState.activated) {
            doghouseState.attachedPuppyId = null;
            updateFriendElementAsset(doghouseState.id);
          }
        });
    }

    function extract(doghouseState, event) {
      const puppyState = getWorldFriendList(state.activeWorld).find((friend) => (
        friend.type === "golden-puppy" && friend.doghouseId === doghouseState.id
      ));
      if (!puppyState) {
        return null;
      }

      const point = getWorldPointFromClient(event.clientX, event.clientY);
      puppyState.doghouseId = null;
      puppyState.attached = false;
      puppyState.activated = true;
      puppyState.extractedFromDoghouseId = doghouseState.id;
      puppyState.puppyAttachmentPending = false;
      puppyState.worldX = Math.max(0, point.worldX - 60);
      puppyState.worldY = Math.max(0, point.worldY - 60);
      doghouseState.attachedPuppyId = null;
      doghouseState.activated = false;
      onRenderWorldCups();
      return puppyState;
    }

    function cancelPuppyExtraction(puppyState) {
      const doghouseId = puppyState?.extractedFromDoghouseId;
      if (!doghouseId) {
        return;
      }
      const doghouseState = getWorldFriendList(state.activeWorld).find((friend) => friend.id === doghouseId);
      if (!doghouseState) {
        return;
      }
      puppyState.doghouseId = doghouseId;
      puppyState.attached = true;
      puppyState.activated = false;
      puppyState.puppyAttachmentPending = false;
      puppyState.extractedFromDoghouseId = null;
      doghouseState.attachedPuppyId = puppyState.id;
      doghouseState.activated = true;
      onRenderWorldCups();
    }

    return {
      sync,
      extract,
      cancelPuppyExtraction,
    };
  }

  window.CuppyLandDoghouseController = {
    createController,
  };
})();
