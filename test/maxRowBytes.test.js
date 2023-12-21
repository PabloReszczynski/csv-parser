import * as assert from "node:assert";
import { test } from "node:test";
import { collect } from "./helpers/helper.js";

test("maxRowBytes", async () => {
  const verify = (err, lines) => {
    t.is(err.message, "Row exceeds the maximum size", "strict row size");
    t.is(lines.length, 4576, "4576 rows before error");
    t.end();
  };

  assert.rejects(() => collect("option-maxRowBytes", { maxRowBytes: 200 }), {
    name: "Error",
    message: "Row exceeds the maximum size",
  });
});
