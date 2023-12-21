import * as fs from "node:fs";
import * as path from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import csv from "../../index.js";

export function fixture(name) {
  const filename = fileURLToPath(import.meta.url);
  const dirname = path.dirname(filename);
  return path.join(dirname, "../fixtures", name);
}

export async function collect(file, opts = {}) {
  const data = fs.createReadStream(fixture(`${file}.csv`));
  const lines = [];
  const parser = csv(opts);

  const stream = Readable.toWeb(data).pipeThrough(parser);
  for await (const data of stream) {
    lines.push(data);
  }

  return lines;
}
