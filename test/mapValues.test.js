import * as assert from "node:assert";
import { test } from "node:test";
import { collect } from "./helpers/helper.js";

test("map values", async () => {
  const headers = [];
  const indexes = [];
  const mapValues = ({ header, index, value }) => {
    headers.push(header);
    indexes.push(index);
    return parseInt(value, 10);
  };

  const lines = await collect("basic", { mapValues });

  assert.deepEqual(lines[0], {
    a: 1,
    b: 2,
    c: 3,
  });
  assert.deepEqual(headers, ["a", "b", "c"]);
  assert.deepEqual(indexes, [0, 1, 2]);
});

test("map last empty value", async () => {
  const mapValues = ({ value }) => {
    return value === "" ? null : value;
  };

  const lines = await collect("empty-columns", {
    mapValues,
    headers: ["date", "name", "location"],
  });

  assert.equal(lines[0].name, null, "name is mapped");
  assert.equal(lines[0].location, null, "last value mapped");
});
