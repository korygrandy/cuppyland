(function () {
  function isUkeDancing(friendState) {
    return Boolean(friendState && friendState.type === "uke" && friendState.ukeDancing);
  }

  function isPizzaWobbling(friendState) {
    return Boolean(friendState && friendState.type === "pizza-man-craft" && friendState.pizzaWobbleActive);
  }

  function togglePizzaWobble(friendState) {
    if (!friendState || friendState.type !== "pizza-man-craft") {
      return false;
    }
    friendState.pizzaWobbleActive = !friendState.pizzaWobbleActive;
    return friendState.pizzaWobbleActive;
  }

  window.CuppyLandFriendAnimationHelper = {
    isUkeDancing,
    isPizzaWobbling,
    togglePizzaWobble,
  };
})();
