import * as assert from "node:assert";
import * as path from "node:path";
import { test } from "node:test";
import csv from "../index.js";
import { collect } from "./helpers/helper.js";

const eol = "\n";

test("simple csv", async () => {
  const lines = await collect("basic");
  assert.deepEqual(lines[0], {
    a: "1",
    b: "2",
    c: "3",
  });
  assert.equal(lines.length, 1, "1 row");
});

test("supports strings", async () => {
  const { readable, writable } = csv();

  await new Promise((resolve, reject) => {
    readable
      .getReader()
      .read()
      .then(({ value }) => {
        try {
          assert.deepEqual(value, {
            hello: "world",
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      });

    const writer = writable.getWriter();
    writer
      .write("hello\n")
      .then(() => writer.write("world\n"))
      .finally(() => writer.close());
  });
});

test.skip("newlines in a cell", async () => {
  const lines = await collect("newlines");

  assert.deepEqual(lines[0], {
    a: "1",
    b: "2",
    c: "3",
  });
  assert.deepEqual(lines[1], {
    a: `Once upon ␊
      a time`,
    b: "5",
    c: "6",
  });
  assert.deepEqual(lines[2], {
    a: "7",
    b: "8",
    c: "9",
  });
  assert.equal(lines.length, 3, "3 rows");
});

test("raw escaped quotes", async () => {
  const lines = await collect("escape-quotes");

  assert.deepEqual(lines[0], {
    a: "1",
    b: 'ha "ha" ha',
  });
  assert.deepEqual(lines[1], {
    a: "2",
    b: '""',
  });
  assert.deepEqual(lines[2], {
    a: "3",
    b: "4",
  });
  assert.equal(lines.length, 3, "3 rows");
});

test.skip("raw escaped quotes and newlines", async () => {
  const lines = await collect("quotes+newlines");

  assert.deepEqual(lines[0], {
    a: "1",
    b: `ha ␊
      "ha" ␊
      ha`,
  });
  assert.deepEqual(lines[1], {
    a: "2",
    b: ` ␊
      "" ␊
      `,
  });
  assert.deepEqual(lines[2], {
    a: "3",
    b: "4",
  });
  assert.equal(lines.length, 3, "3 rows");
});

test("line with comma in quotes", async () => {
  const headers = "a,b,c,d,e\n";
  const line = 'John,Doe,120 any st.,"Anytown, WW",08123\n';
  const correct = {
    a: "John",
    b: "Doe",
    c: "120 any st.",
    d: "Anytown, WW",
    e: "08123",
  };
  const { writable, readable } = csv();

  await new Promise((resolve, reject) => {
    readable
      .getReader()
      .read()
      .then(({ value }) => {
        try {
          assert.deepEqual(value, correct);
          resolve(e);
        } catch (e) {
          reject(e);
        }
      });

    const writer = writable.getWriter();
    writer
      .writer(headers)
      .then(() => writer.write(line))
      .finally(() => writer.close());
  });
});

test("line with newline in quotes", async () => {
  const headers = "a,b,c\n";
  const line = `1,"ha ${eol}""ha"" ${eol}ha",3\n`;
  const correct = {
    a: "1",
    b: `ha ${eol}"ha" ${eol}ha`,
    c: "3",
  };
  const { readable, writable } = csv();

  await new Promise((resolve, reject) => {
    readable
      .getReader()
      .read()
      .then(({ value }) => {
        try {
          assert.equal(JSON.stringify(value), JSON.stringify(correct));
          resolve();
        } catch (err) {
          reject(err);
        }
      });

    const writer = writable.getWriter();
    writer
      .write(headers)
      .then(() => writer.write(line))
      .finally(() => writer.close());
  });
});

test("cell with comma in quotes", async () => {
  const headers = "a\n";
  const cell = '"Anytown, WW"\n';
  const correct = "Anytown, WW";
  const { readable, writable } = csv();

  await new Promise((resolve, reject) => {
    readable
      .getReader()
      .read()
      .then(({ value }) => {
        try {
          assert.equal(value.a, correct);
          resolve();
        } catch (err) {
          reject(err);
        }
      });

    const writer = writable.getWriter();
    writer
      .write(headers)
      .then(() => writer.write(cell))
      .finally(() => writer.close());
  });
});

test.skip("cell with newline", async () => {
  const headers = bops.from("a\n");
  const cell = bops.from(`"why ${eol}hello ${eol}there"\n`);
  const correct = `why ${eol}hello ${eol}there`;
  const parser = csv();

  parser.write(headers);
  parser.write(cell);
  parser.end();

  parser.once("data", data => {
    t.is(data.a, correct);
    t.end();
  });
});

test.skip("cell with escaped quote in quotes", t => {
  const headers = bops.from("a\n");
  const cell = bops.from('"ha ""ha"" ha"\n');
  const correct = 'ha "ha" ha';
  const parser = csv();

  parser.write(headers);
  parser.write(cell);
  parser.end();

  parser.once("data", data => {
    t.is(data.a, correct);
    t.end();
  });
});

test.skip("cell with multibyte character", t => {
  const headers = bops.from("a\n");
  const cell = bops.from("this ʤ is multibyte\n");
  const correct = "this ʤ is multibyte";
  const parser = csv();

  parser.write(headers);
  parser.write(cell);
  parser.end();

  parser.once("data", data => {
    t.is(data.a, correct, "multibyte character is preserved");
    t.end();
  });
});

test("geojson", async () => {
  const lines = await collect("geojson");
  const lineobj = {
    type: "LineString",
    coordinates: [
      [102.0, 0.0],
      [103.0, 1.0],
      [104.0, 0.0],
      [105.0, 1.0],
    ],
  };
  assert.deepEqual(JSON.parse(lines[1].geojson), lineobj, "linestrings match");
});

test("empty columns", async () => {
  const lines = await collect("empty-columns", ["a", "b", "c"]);

  for (const line of lines) {
    assert.equal(Object.keys(line).length, 3, "Split into three columns");
    assert.ok(/^2007-01-0\d$/.test(line.a), "First column is a date");
    assert.ok(line.b !== undefined, "Empty column is in line");
    assert.equal(line.b.length, 0, "Empty column is empty");
    assert.ok(line.c !== undefined, "Empty column is in line");
    assert.equal(line.c.length, 0, "Empty column is empty");
  }
});

test.skip("csv-spectrum", t => {
  spectrum((err, data) => {
    if (err) throw err;
    let pending = data.length;
    data.map(d => {
      const parser = csv();
      const collector = concat(objs => {
        t.snapshot(objs, d.name);
        done();
      });
      parser.pipe(collector);
      parser.write(d.csv);
      parser.end();
    });
    function done() {
      pending--;
      if (pending === 0) t.end();
    }
  });
});

test("process all rows", async () => {
  const lines = await collect("large-dataset", {});
  assert.equal(lines.length, 7268, "7268 rows");
});

test.skip("binary stanity", async () => {
  const binPath = path.resolve(__dirname, "../bin/csv-parser");
  const { stdout } = await execa(`echo "a\n1" | ${process.execPath} ${binPath}`, { shell: true });

  t.snapshot(stdout);
});
