import * as assert from "node:assert";
import { test } from "node:test";
import { collect } from "./helpers/helper.js";

test("custom escape character", async () => {
  const lines = await collect("option-escape", { escape: "\\" });
  assert.deepEqual(lines[0], {
    a: "1",
    b: 'some "escaped" value',
    c: "2",
  });
  assert.deepEqual(lines[1], {
    a: "3",
    b: '""',
    c: "4",
  });
  assert.deepEqual(lines[2], {
    a: "5",
    b: "6",
    c: "7",
  });
  assert.equal(lines.length, 3, "3 rows");
});

test("headers: false", async () => {
  const lines = await collect("no-headers", { headers: false });
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
    {
      0: "4",
      1: "5",
      2: "6",
    },
    {
      0: "7",
      1: "8",
      2: "9",
      3: "10",
    },
  ]);
});

test("headers option", async () => {
  const lines = await collect("headers", { headers: ["a", "b", "c"] });
  assert.deepEqual(lines, [
    {
      a: "1",
      b: "2",
      c: "3",
    },
    {
      a: "4",
      b: "5",
      c: "6",
    },
    {
      a: "7",
      b: "8",
      c: "9",
    },
  ]);
});
