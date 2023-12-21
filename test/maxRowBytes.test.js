import * as assert from "node:assert";
import { test } from "node:test";
import { collect } from "./helpers/helper.js";

test("maxRowBytes", async () => {
  assert.rejects(() => collect("option-maxRowBytes", { maxRowBytes: 200 }), {
    name: "Error",
    message: "Row exceeds the maximum size",
  });
});
