import * as assert from "node:assert";
import { test } from "node:test";
import { collect } from "./helpers/helper.js";

test("custom quote character", async () => {
  const lines = await collect("option-quote", { quote: "'" });

  assert.deepEqual(lines[0], {
    a: "1",
    b: "some value",
    c: "2",
  });
  assert.deepEqual(lines[1], {
    a: "3",
    b: "4",
    c: "5",
  });
});

test("custom quote and escape character", async () => {
  const lines = await collect("option-quote-escape", {
    quote: "'",
    escape: "\\",
  });

  assert.deepEqual(lines[0], {
    a: "1",
    b: "some 'escaped' value",
    c: "2",
  });
  assert.deepEqual(lines[1], {
    a: "3",
    b: "''",
    c: "4",
  });
  assert.deepEqual(lines[2], {
    a: "5",
    b: "6",
    c: "7",
  });
});

test("quote many", async () => {
  const lines = await collect("option-quote-many", { quote: "'" });

  assert.deepEqual(lines[0], {
    a: "1",
    b: "some 'escaped' value",
    c: "2",
  });
  assert.deepEqual(lines[1], {
    a: "3",
    b: "''",
    c: "4",
  });
  assert.deepEqual(lines[2], {
    a: "5",
    b: "6",
    c: "7",
  });
});
