import * as assert from "node:assert";
import { test } from "node:test";
import { collect } from "./helpers/helper.js";

test("headers: false, numeric column names", async () => {
  const lines = await collect("basic", { headers: false });
  assert.deepEqual(lines, [
    {
      0: "a",
      1: "b",
      2: "c",
    },
    {
      0: "1",
      1: "2",
      2: "3",
    },
  ]);
  assert.equal(lines.length, 2, "2 rows");
});
