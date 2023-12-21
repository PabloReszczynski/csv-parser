import * as assert from "node:assert";
import { test } from "node:test";
import { collect } from "./helpers/helper.js";

test("strict", () => {
  assert.rejects(() => collect("strict", { strict: true }), {
    name: "RangeError",
    message: "Row length does not match headers",
  });
});
