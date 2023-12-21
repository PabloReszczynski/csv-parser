import * as assert from "node:assert";
import { test } from "node:test";
import { collect } from "./helpers/helper.js";

test("rename columns", async () => {
  const headers = { a: "x", b: "y", c: "z" };
  const mapHeaders = ({ header }) => {
    return headers[header];
  };
  const lines = await collect("basic", { mapHeaders });
  assert.deepEqual(lines[0], {
    x: "1",
    y: "2",
    z: "3",
  });
  assert.equal(lines.length, 1, "1 row");
});

test("skip columns a and c", async () => {
  const mapHeaders = ({ header }) => {
    if (["a", "c"].indexOf(header) > -1) {
      return null;
    }
    return header;
  };

  const lines = await collect("basic", { mapHeaders });
  assert.deepEqual(lines[0], {
    b: "2",
  });
  assert.equal(lines.length, 1, "1 row");
});
