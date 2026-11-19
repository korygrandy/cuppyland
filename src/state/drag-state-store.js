(function () {
  function createDragStates() {
    return {
      dragState: {
        active: false,
        type: "",
        value: "",
        pointerId: null,
      },
      lidDragState: {
        active: false,
        pointerId: null,
        initialLeft: 17,
        initialTop: 0,
        anchorX: 0,
        anchorY: 0,
      },
      sleeveDragState: {
        active: false,
        pointerId: null,
        initialLeft: 30,
        initialTop: 164,
        anchorX: 0,
        anchorY: 0,
      },
      hairstyleDragState: {
        active: false,
        pointerId: null,
        initialLeft: 17,
        initialTop: -22,
        anchorX: 0,
        anchorY: 0,
        moved: false,
      },
      cupDragState: {
        active: false,
        pointerId: null,
        startClientX: 0,
        startClientY: 0,
        startWorldX: 0,
        startWorldY: 0,
      },
      friendDragState: {
        active: false,
        pointerId: null,
        friendId: null,
        pointerOffsetX: 0,
        pointerOffsetY: 0,
        startClientX: 0,
        startClientY: 0,
        moved: false,
      },
    };
  }

  window.CuppyLandDragState = {
    createDragStates,
  };
})();
