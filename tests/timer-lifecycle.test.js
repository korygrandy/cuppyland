const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("timer lifecycle replaces keyed timers and clears prefixes", () => {
  const timers = new Map();
  let nextId = 1;
  const context = {
    window: {
      setTimeout(callback) {
        const id = nextId++;
        timers.set(id, callback);
        return id;
      },
      clearTimeout(id) {
        timers.delete(id);
      },
      setInterval() {
        return nextId++;
      },
      clearInterval() {},
    },
  };
  loadBrowserScript("src/controllers/timer-lifecycle-controller.js", context);
  const lifecycle = context.window.CuppyLandTimerLifecycle.createController();

  let calls = 0;
  lifecycle.set("puppy:1:pose:1", () => { calls += 1; }, 260);
  lifecycle.set("puppy:1:pose:1", () => { calls += 10; }, 260);
  assert.equal(timers.size, 1);
  lifecycle.clearPrefix("puppy:1:");
  assert.equal(timers.size, 0);

  lifecycle.set("puppy:2:finish", () => { calls += 100; }, 420);
  lifecycle.clearAll();
  assert.equal(calls, 0);
});
