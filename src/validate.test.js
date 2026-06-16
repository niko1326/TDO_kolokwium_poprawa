const { test } = require("node:test");
const assert = require("node:assert");
const { validateName } = require("./validate");

test("validateName accepts normal string", () => {
  const r = validateName("apple");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.value, "apple");
});

test("validateName trims whitespace", () => {
  const r = validateName("  banana  ");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.value, "banana");
});

test("validateName rejects empty", () => {
  const r = validateName("   ");
  assert.strictEqual(r.ok, false);
});

test("validateName rejects non-string", () => {
  const r = validateName(42);
  assert.strictEqual(r.ok, false);
});

test("validateName rejects too long", () => {
  const r = validateName("a".repeat(51));
  assert.strictEqual(r.ok, false);
});
