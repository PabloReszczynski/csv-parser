import * as assert from "node:assert";
import { test } from "node:test";
import { collect } from "./helpers/helper.js";

test("strict: false - more columns", async () => {
  const lines = await collect("strict-false-more-columns", { strict: false });
  const headersFirstLine = Object.keys(lines[0]);
  const headersBrokenLine = Object.keys(lines[1]);
  const headersLastLine = Object.keys(lines[2]);

  assert.deepEqual(headersFirstLine, headersLastLine);
  assert.deepEqual(headersBrokenLine, ["a", "b", "c", "_3"]);
  assert.deepEqual(lines[0], {
    a: "1",
    b: "2",
    c: "3",
  });
  assert.deepEqual(lines[1], {
    _3: "7",
    a: "4",
    b: "5",
    c: "6",
  });
  assert.deepEqual(lines[2], {
    a: "8",
    b: "9",
    c: "10",
  });
  assert.equal(lines.length, 3, "3 rows");
  assert.equal(headersBrokenLine.length, 4, "4 columns");
});

test("strict: false - less columns", async () => {
  const lines = await collect("strict-false-less-columns", { strict: false });
  const headersFirstLine = Object.keys(lines[0]);
  const headersBrokenLine = Object.keys(lines[1]);
  const headersLastLine = Object.keys(lines[2]);

  assert.deepEqual(headersFirstLine, headersLastLine);
  assert.deepEqual(headersBrokenLine, ["a", "b"]);
  assert.deepEqual(lines[0], {
    a: "1",
    b: "2",
    c: "3",
  });
  assert.deepEqual(lines[1], {
    a: "4",
    b: "5",
  });
  assert.deepEqual(lines[2], {
    a: "6",
    b: "7",
    c: "8",
  });
  assert.equal(lines.length, 3, "3 rows");
  assert.equal(headersBrokenLine.length, 2, "2 columns");
});
