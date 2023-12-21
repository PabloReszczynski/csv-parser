import { test } from "node:test";
import { collect } from "./helpers/helper.js";
import * as assert from "node:assert";

test("newline", async () => {
  const lines = await collect("option-newline", { newline: "X" });

  assert.deepEqual(lines[0], {
    a: "1",
    b: "2",
    c: "3",
  });
  assert.deepEqual(lines[1], {
    a: "X-Men",
    b: "5",
    c: "6",
  });
  assert.deepEqual(lines[2], {
    a: "7",
    b: "8",
    c: "9",
  });
});
