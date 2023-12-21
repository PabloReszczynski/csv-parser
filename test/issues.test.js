import * as assert from "node:assert";
import { test } from "node:test";
import { collect } from "./helpers/helper.js";

test("backtick separator (#105)", async () => {
  const lines = await collect("backtick", { separator: "`" });
  assert.deepEqual(lines[0], {
    p_desc: "Bulbasaur can be seen napping",
    pokemon_id: "1",
  });
  assert.deepEqual(lines[1], {
    p_desc: "There is a bud on this",
    pokemon_id: "2",
  });
});

test("strict + skipLines (#136)", async () => {
  const lines = await collect("strict+skipLines", {
    strict: true,
    skipLines: 1,
  });
  assert.deepEqual(lines, [
    {
      h1: "1",
      h2: "2",
      h3: "3",
    },
    {
      h1: "4",
      h2: "5",
      h3: "6",
    },
    {
      h1: "7",
      h2: "8",
      h3: "9",
    },
  ]);
  assert.equal(lines.length, 3, "3 rows");
});
