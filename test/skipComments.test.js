import * as assert from "node:assert";
import { test } from "node:test";
import { collect } from "./helpers/helper.js";

test("comment", async () => {
  const lines = await collect("comment", { skipComments: true });

  assert.deepEqual(lines, [
    {
      a: "1",
      b: "2",
      c: "3",
    },
  ]);
});

test("custom comment", async () => {
  const lines = await collect("option-comment", { skipComments: "~" });

  assert.deepEqual(lines, [
    {
      a: "1",
      b: "2",
      c: "3",
    },
  ]);
});
