(function () {
  function createController(options) {
    const {
      state,
      getWorldFriendList,
      playSfxClip = () => {},
      motionController = null,
      puppySequenceController = null,
      removeBackgroundObjectActivation = () => {},
      stopChocolateMilkSequence = () => {},
      onRenderWorldCups = () => {},
    } = options;

    function removeFriendInstance(friendId, options = {}) {
      const { playRemovedSfx = true } = options;
      if (!state.activeWorld || !friendId) {
        return false;
      }
      const worldFriends = getWorldFriendList(state.activeWorld);
      const friendIndex = worldFriends.findIndex((friend) => friend.id === friendId);
      if (friendIndex < 0) {
        return false;
      }

      const friendState = worldFriends[friendIndex];
      if (friendState?.requestTimerId) {
        clearTimeout(friendState.requestTimerId);
        friendState.requestTimerId = null;
        friendState.requestType = null;
        friendState.requestExpiresAt = 0;
      }
      if (friendState?.type === "dogbed" && friendState.attachedPuppyId) {
        const attachedPuppy = worldFriends.find((friend) => friend.id === friendState.attachedPuppyId);
        if (attachedPuppy) {
          attachedPuppy.dogbedId = null;
        }
      }
      if (friendState?.sleepTimer) {
        clearTimeout(friendState.sleepTimer);
        friendState.sleepTimer = null;
      }

      const isBarbieRemoval = friendState
        && (friendState.type === "barbie-blonde" || friendState.type === "barbie-blonde-baby");
      if (friendState?.squirrelRunningTimer) {
        clearTimeout(friendState.squirrelRunningTimer);
        friendState.squirrelRunningTimer = null;
        const remainingRunningSquirrel = worldFriends.some((friend) => (
          friend.type === "squirrel" && friend.squirrelRunningTimer
        ));
        if (!remainingRunningSquirrel) {
          window.CuppyLandSquirrelRunningSfx?.reset?.();
        }
      }
      [
        "turkeyAnimationTimer",
        "lavaLampSequenceTimer",
        "barbieActivationTimer",
        "fishbowlSequenceTimer",
        "ukeDanceTimer",
      ].forEach((timerName) => {
        if (friendState?.[timerName]) {
          clearTimeout(friendState[timerName]);
          friendState[timerName] = null;
        }
      });

      motionController?.stopForFriend?.(friendId);
      puppySequenceController?.stop?.(friendId);
      removeBackgroundObjectActivation(friendId);
      stopChocolateMilkSequence(friendId);
      worldFriends.splice(friendIndex, 1);

      if (isBarbieRemoval) {
        playSfxClip("blondeBarbieObjectRemoved");
      } else if (playRemovedSfx) {
        playSfxClip("defaultObjectRemoved");
      }
      if (friendState.type === "golden-puppy") {
        const remainingPuppies = worldFriends.some((friend) => friend.type === "golden-puppy");
        if (!remainingPuppies) {
          window.CuppyLandSquirrelRunningSfx?.reset?.();
        }
      }
      onRenderWorldCups();
      return true;
    }

    return {
      removeFriendInstance,
    };
  }

  window.CuppyLandFriendRemovalController = {
    createController,
  };
})();
