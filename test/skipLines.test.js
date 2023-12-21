import * as assert from "node:assert";
import { test } from "node:test";
import { collect } from "./helpers/helper.js";

test("skip lines", async () => {
  const lines = await collect("bad-data", { skipLines: 2 });

  assert.deepEqual(lines[0], {
    yes: "ok",
    yup: "ok",
    yeah: "ok!",
  });
});

test("skip lines with headers", async () => {
  const lines = await collect("bad-data", { headers: ["s", "p", "h"], skipLines: 2 });

  assert.deepEqual(lines[0], {
    s: "yes",
    p: "yup",
    h: "yeah",
  });
  assert.deepEqual(lines[1], {
    s: "ok",
    p: "ok",
    h: "ok!",
  });
});
